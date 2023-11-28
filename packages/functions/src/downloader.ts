import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import axios from "axios";

const s3Client = new S3Client({ region: "eu-north-1" });
const fixtureUrl = "https://www.football-data.co.uk/fixtures.csv";

export const handler = async () => {
  const response = await axios.get(fixtureUrl);
  const params: any = {
    Bucket: `${process.env.BUCKET}`,
    Key: "fixtures.csv",
    Body: response.data,
    ContentType: response.headers["content-type"]
  };

  const command = new PutObjectCommand(params);
    const saveResponse = await s3Client.send(command);

    console.log(JSON.stringify(saveResponse));
}