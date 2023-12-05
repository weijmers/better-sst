import { StackContext, Api, Table, Bucket, Cron, Function, NextjsSite } from "sst/constructs";
import * as cdk from "aws-cdk-lib";

export function STACK({ stack }: StackContext) {
  
  //
  //
  // STORAGE
  //

  const table = new Table(stack, "games", {
    fields: {
      date: "string",
      identifier: "string",
      type: "string",
    },
    primaryIndex: {
      partitionKey: "date",
      sortKey: "identifier",
    },
    globalIndexes: {
      "typeAndDate": {
        partitionKey: "type",
        sortKey: "date",
      },
    },
    timeToLiveAttribute: "expiresAt",
    cdk: {
      table: {
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    }
  });

  const bucket = new Bucket(stack, "downloads", {
    defaults: {
      function: {
        timeout: 20,
        environment: {
          tableName: table.tableName,
        },
        permissions: [table],
      },
    },
    
    // we can use either this for a direct event that triggers a function,
    // or we can use EVB to, and listen to events from that, this would 
    // simplify the separation of buckets & tables and lambdas
    // notifications: {
    //   created: {
    //     function: {
    //       handler: "packages/functions/src/trigger.handler",
    //       environment: { 
    //         TABLE: table.tableName,
    //       },
    //       permissions: [table],
    //     },
    //     events: ["object_created"],
    //   },
    // },
    // if this is not provided, it ends up with a lot of 
    // orphan buckets :(
    cdk: {
      bucket: {
        autoDeleteObjects: true,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        eventBridgeEnabled: true,
      },
    },
  });

  // need to re-visit, will this give us full permissions to S3? :|
  // no longer needed if we use EVB ...
  //bucket.attachPermissions(["s3"]);
  
  //
  //
  // API
  //

  const api = new Api(stack, "api", {
    // defaults: {
    //   function: {
    //     environment: {
    //       TABLE: table.tableName
    //     }
    //   }
    // },
    // routes: {
    //   "GET /": "packages/functions/src/api.get",
    // }
  });

  // api.attachPermissionsToRoute("GET /", ["dynamodb"]);

  //
  //
  // FUNCTIONS
  //

  const apiGet = new Function(stack, "api-get", {
    handler: "packages/functions/src/api.get",
    environment: {
      TABLE: table.tableName,
    },
  });

  const apiGetFixtures = new Function(stack, "api-get-fixtures", {
    handler: "packages/functions/src/api.fixtures",
    environment: {
      TABLE: table.tableName,
    },
  })

  apiGet.bind([table]);
  apiGetFixtures.bind([table]);
  api.addRoutes(stack, {
    "GET /": { function: apiGet },
    "GET /fixtures": { function: apiGetFixtures },
  });
  

  const downloaderV2 = new Function(stack, "downloader", {
    handler: "packages/functions/src/downloader.handler",
    environment: {
      BUCKET: bucket.bucketName,
    },
  });

  downloaderV2.bind([bucket]);

  const scheduleRole = new cdk.aws_iam.Role(stack, "schedule-role", {
    assumedBy: new cdk.aws_iam.ServicePrincipal("scheduler.amazonaws.com"),
  });

  const schedulePolicy = new cdk.aws_iam.Policy(stack, "schedule-policy", {
    roles: [scheduleRole],
    statements: [
      new cdk.aws_iam.PolicyStatement({
        effect: cdk.aws_iam.Effect.ALLOW,
        actions: ["lambda:InvokeFunction"],
        resources: [downloaderV2.functionArn]
      }),
    ],
  });

  const schedule = new cdk.aws_scheduler.CfnSchedule(stack, "schedule", {
    scheduleExpression: "cron(0 0 * * ? *)",
    flexibleTimeWindow: {
      mode: "OFF",
    },
    target: {
      arn: downloaderV2.functionArn,
      roleArn: scheduleRole.roleArn,
    }
  });

  // const downloader = new Cron(stack, "downloader", {
  //   schedule: "cron(0 0 * * ? *)",
  //   job: "packages/functions/src/downloader.handler",
  // });

  // downloader.bind([bucket]);
  // downloader.jobFunction.addEnvironment("BUCKET", bucket.bucketName);


  // version 2, listen on EventBridge events instead ...
  const triggerV2 = new Function(stack, "triggerV2", {
    handler: "packages/functions/src/trigger.handler",
    environment: {
      TABLE: table.tableName,
      BUCKET: bucket.bucketName,
    },
    permissions: [table, bucket],
  });

  const rule = new cdk.aws_events.Rule(stack, "rule", {
    eventPattern: {
      source: ["aws.s3"],
      detailType: [ "Object Created" ],
      detail: {
        bucket: {
          name: [ bucket.bucketName ]
        }
      }
    },
  });

  rule.addTarget(new cdk.aws_events_targets.LambdaFunction(triggerV2, {
    maxEventAge: cdk.Duration.hours(2),
    retryAttempts: 3
  }));

  //
  //
  // WEBSITE
  //
  const web = new NextjsSite(stack, "web", {
    path: "./packages/web",
    environment: {
      NEXT_PUBLIC_API: api.url,
    },
    // dev: {
    //   deploy: false,
    //   url: "http://localhost:3000",
    // },
  });

  stack.addOutputs({
    ApiEndpoint: api.customDomainUrl || api.url,
    WebEndpoint: web.customDomainUrl || web.url,
  });

  
  return { api, table, bucket };
}
