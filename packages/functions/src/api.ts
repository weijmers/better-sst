import { ApiHandler } from "sst/node/api";
import { DynamoDB } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";
import { GameDTO, GameEntity, gameTypes } from "@better/core/types";
import { mapGameEntityToGameDTO } from "@better/core/mappers";

const client = new DynamoDB({ region: "eu-north-1" });
const documentClient = DynamoDBDocument.from(client, {});

export const get = ApiHandler(async (_evt) => {
  const games = await documentClient.scan({
    TableName: process.env.TABLE,
  });

  return {
    statusCode: 200,
    body: JSON.stringify((games.Items as GameEntity[])?.map(mapGameEntityToGameDTO) ?? [])
  };
});

export const fixtures = ApiHandler(async (_evt) => {
  const today = "2023-12-01";//new Date().toISOString().split("T")[0];
  const response = await documentClient.query({
    TableName: process.env.TABLE,
    IndexName: "typeAndDate",
    KeyConditionExpression: "#type = :type AND #date >= :date",
    ExpressionAttributeNames: {
      "#type": "type",
      "#date": "date",
    },
    ExpressionAttributeValues: {
      ":type": gameTypes.FIXTURE,
      ":date": today,
    },
  });

  const games = (response.Items as GameEntity[])?.map(mapGameEntityToGameDTO) ?? [];
  const gamesByDate = games.sort((a, b) => a.dateTime < b.dateTime ? -1 : 1).reduce<Record<string, GameDTO[]>>((group, game) => {
    const { date } = game;
    group[date] = group[date] ?? [];
    group[date].push(game);
    return group;
  }, {});

  return {
    statusCode: 200,
    body: JSON.stringify(gamesByDate)
  };
});

