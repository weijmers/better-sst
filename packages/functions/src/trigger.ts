import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { ConditionalCheckFailedException, DynamoDB } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";
import { GameEntity, TeamEntity, gameTypes } from "@better/core/types";
import {
  slugify,
  extractCountryCode,
  convertToDate,
  convertToDateTime,
  extractDivision,
  dateToExpiration,
  tryParseFloat,
  convertToTime
} from "@better/core/utils";

const s3Client = new S3Client({ region: "eu-north-1" });
const client = new DynamoDB({ region: "eu-north-1" });
const documentClient = DynamoDBDocument.from(client, {
  marshallOptions: {
    removeUndefinedValues: true,
  }
});

export const handler = async (event: any) => {
  console.log(JSON.stringify(event, null, 2));
  
  // const bucket = event.Records[0].s3.bucket.name;
  const bucket = event.detail.bucket.name;
  console.log(`BUCKET: ${bucket}`);

  // const file = event.Records[0].s3.object.key;
  const file = event.detail.object.key;
  console.log(`FILE: ${file}`);
  
  const response = await s3Client.send(new GetObjectCommand({
    Bucket: bucket,
    Key: file,
  }));

  const body = await response.Body?.transformToString("utf8") || "";
  const lines = body.split("\n")
    .filter((line) => line.trim().length > 0)
    .map((line) => line.split(","));
  for (const line of lines.slice(1)) {
    const homeTeam: TeamEntity = {
      identifier: slugify(line[3]),
      name: line[3],
    };

    const awayTeam: TeamEntity = {
      identifier: slugify(line[4]),
      name: line[4],
    };
    
    const game: GameEntity = {
      identifier: `${extractCountryCode(`${line[0]}`)}#${homeTeam.identifier}#${awayTeam.identifier}`,
      date: convertToDate(`${line[1]}`),
      type: gameTypes.FIXTURE,
      time: convertToTime(`${line[2]}`),
      dateTime: convertToDateTime(`${line[1]}`, `${line[2]}`),
      countryCode: extractCountryCode(`${line[0]}`),
      division: extractDivision(`${line[0]}`),
      homeTeam,
      awayTeam,
      odds: [
        {
          identifier: "b365",
          home: tryParseFloat(line[11]),
          draw: tryParseFloat(line[12]),
          away: tryParseFloat(line[13]),
        }
      ],
      lastUpdatedAt: new Date().toISOString(),
      expiresAt: dateToExpiration(`${line[1]}`),
    };
    
    try {
      await documentClient.put({
        TableName: process.env.TABLE,
        Item: game,
        ConditionExpression: "(#type = :fixture OR attribute_not_exists(#type)) AND (#lastUpdatedAt < :lastUpdatedAt or attribute_not_exists(#lastUpdatedAt))",
        ExpressionAttributeNames: {
          "#type": "type",
          "#lastUpdatedAt": "lastUpdatedAt",
        },
        ExpressionAttributeValues: {
          ":fixture": gameTypes.FIXTURE,
          ":lastUpdatedAt": game.lastUpdatedAt,
        },
      });
    } catch (error) {
      if (error instanceof ConditionalCheckFailedException) {
        console.log("Just us checking some stuff, please move on!");
        console.log(error);
      }
      throw error;
    }
  }
}