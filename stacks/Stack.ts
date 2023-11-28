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
    // running into issues removing the stack and setting it 
    // up again, as the tablename is fixed with the prefix etc.
    // I.e., not having the appended jibberish-suffix that 
    // AWS SAM/CFN is adding.
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
    // this will basically create a separate lambda that will 
    // trigger on the S3 event and send out a custom message ...
    // with this we can't use the actual event sent from S3?
    // see: https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-s3-bucket-notificationconfiguration.html
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
    defaults: {
      function: {
        environment: {
          TABLE: table.tableName
        }
      }
    },
    routes: {
      "GET /": "packages/functions/src/api.handler",
    },
  });

  api.attachPermissionsToRoute("GET /", ["dynamodb"]);

  
  //
  //
  // FUNCTIONS
  //

  // const downloader = new Function(stack, "downloader", {
  //   handler: "packages/functions/src/downloader.handler",
  //   bind: [bucket],
  //   environment: {
  //     BUCKET: bucket.bucketName,
  //   },
  //   // why isn't this a part of the documentation?
  //   // https://docs.sst.dev/constructs/Function
  //   // it also looks like it's only possible to specify an 
  //   // eventsource for the following resources:
  //   // - api,
  //   // - dynamodb,
  //   // - kafka,
  //   // - kinesis,
  //   // - s3,
  //   // - sns (+ dlq),
  //   // - sqs (+ dlq),
  //   // - stream
  //   // I.e., it's missing eventbridge rules and schedule expressions.
  //   events: []
  // });

  const downloader = new Cron(stack, "downloader", {
    schedule: "cron(0 0 * * ? *)",
    job: "packages/functions/src/downloader.handler",
  });

  downloader.bind([bucket]);
  downloader.jobFunction.addEnvironment("BUCKET", bucket.bucketName);

  stack.addOutputs({
    ApiEndpoint: api.url,
  });

  
  return { api, table, bucket };
}
