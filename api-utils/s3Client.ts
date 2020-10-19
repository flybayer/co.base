import { Client } from "minio";

export let s3Client: null | Client = null;

export const S3_BUCKET = process.env.S3_BUCKET;

if (
  process.env.S3_HOST &&
  process.env.S3_PORT &&
  process.env.S3_ACCESS_KEY &&
  process.env.S3_SECRET_KEY
) {
  s3Client = new Client({
    endPoint: process.env.S3_HOST,
    port: Number(process.env.S3_PORT),
    useSSL: !!process.env.S3_SSL,
    accessKey: process.env.S3_ACCESS_KEY,
    secretKey: process.env.S3_SECRET_KEY,
  });
}

export async function createGetURL(fileName: string) {
  if (!s3Client || !S3_BUCKET) {
    throw new Error("S3 not configured");
  }
  const downloadURI = await s3Client.presignedGetObject(
    S3_BUCKET,
    fileName,
    60 * 60 * 24 * 2 // 2 days
  );
  return downloadURI;
}
