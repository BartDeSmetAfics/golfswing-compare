import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const r2 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const BUCKET = process.env.R2_BUCKET_NAME!;

export function swingVideoKey(userId: string, swingId: string) {
  return `users/${userId}/swings/${swingId}/video.webm`;
}

export function swingFrameKey(userId: string, swingId: string, phase: string) {
  return `users/${userId}/swings/${swingId}/frames/${phase}.jpg`;
}

export function proReferenceKey(proSlug: string, clubType: string, phase: string) {
  return `pros/${proSlug}/${clubType}/${phase}.jpg`;
}

export async function getUploadUrl(key: string, contentType: string) {
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: contentType,
  });
  return getSignedUrl(r2, command, { expiresIn: 300 });
}

export async function getDownloadUrl(key: string, expiresIn = 300) {
  const command = new GetObjectCommand({ Bucket: BUCKET, Key: key });
  return getSignedUrl(r2, command, { expiresIn });
}
