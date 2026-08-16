import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectsCommand } from "@aws-sdk/client-s3";
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

export function swingVideoKey(userId: string, swingId: string, ext = "webm") {
  return `users/${userId}/swings/${swingId}/video.${ext}`;
}

export function swingFrameKey(userId: string, swingId: string, phase: string, angle = "FACE_ON") {
  return `users/${userId}/swings/${swingId}/frames/${angle}/${phase}.jpg`;
}

export function proReferenceKey(proSlug: string, clubType: string, phase: string, angle = "FACE_ON") {
  return `pros/${proSlug}/${clubType}/${angle}/${phase}.jpg`;
}

export async function getUploadUrl(key: string, contentType: string) {
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: contentType,
  });
  return getSignedUrl(r2, command, { expiresIn: 300 });
}

export async function uploadBuffer(key: string, buffer: Buffer, contentType: string) {
  await r2.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  }));
}

export async function getDownloadUrl(key: string, expiresIn = 300) {
  const command = new GetObjectCommand({ Bucket: BUCKET, Key: key });
  return getSignedUrl(r2, command, { expiresIn });
}

export async function deleteObjects(keys: string[]) {
  if (keys.length === 0) return;
  await r2.send(new DeleteObjectsCommand({
    Bucket: BUCKET,
    Delete: { Objects: keys.map((k) => ({ Key: k })), Quiet: true },
  }));
}
