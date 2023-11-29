import { StackContext, Api, Table, Bucket, Cron, Function } from "sst/constructs";
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
    },
    primaryIndex: {
      partitionKey: "date",
      sortKey: "identifier",
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
    notifications: {
      created: {
        function: {
          handler: "packages/functions/src/trigger.handler",
          environment: { 
            TABLE: table.tableName,
          },
          permissions: [table],
        },
        events: ["object_created"],
      },
    },
    // if this is not provided, it ends up with a lot of 
    // orphan buckets :(
    cdk: {
      bucket: {
        autoDeleteObjects: true,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      },
    },
  });

  // Need to re-visit, will this give us full permissions 
  // to S3? :|
  bucket.attachPermissions(["s3"]);
  
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

  apiGet.bind([table]);
  api.addRoutes(stack, { "GET /": { function: apiGet } });

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

  stack.addOutputs({
    ApiEndpoint: api.url,
  });

  
  return { api, table, bucket };
}
