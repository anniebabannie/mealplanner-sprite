import { S3Client, DeleteObjectCommand, DeleteObjectsCommand } from "@aws-sdk/client-s3";

function getClient() {
  return new S3Client({
    region: process.env.AWS_REGION ?? "auto",
    endpoint: process.env.AWS_ENDPOINT_URL_S3!,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  });
}

function urlToKey(imageUrl: string): string | null {
  try {
    return new URL(imageUrl).pathname.replace(/^\//, "");
  } catch {
    return null;
  }
}

export async function deleteImage(imageUrl: string): Promise<void> {
  const key = urlToKey(imageUrl);
  if (!key) return;
  const bucket = process.env.TIGRIS_BUCKET!;
  await getClient().send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}

export async function deleteImages(imageUrls: string[]): Promise<void> {
  const keys = imageUrls.map(urlToKey).filter(Boolean) as string[];
  if (!keys.length) return;
  const bucket = process.env.TIGRIS_BUCKET!;
  await getClient().send(new DeleteObjectsCommand({
    Bucket: bucket,
    Delete: { Objects: keys.map((Key) => ({ Key })) },
  }));
}
