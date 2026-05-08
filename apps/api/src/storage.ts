import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing env var: ${key}`);
  return value;
}

let client: S3Client | null = null;

function getClient(): S3Client {
  client ??= new S3Client({
    endpoint: process.env.S3_ENDPOINT ?? (console.warn("S3_ENDPOINT not set — falling back to AWS default endpoint"), undefined),
    region: process.env.S3_REGION ?? "us-east-1",
    credentials: {
      accessKeyId: requireEnv("S3_ACCESS_KEY"),
      secretAccessKey: requireEnv("S3_SECRET_KEY"),
    },
    forcePathStyle: true,
  });
  return client;
}

const bucket = () => requireEnv("S3_BUCKET");
const publicUrl = () => requireEnv("S3_PUBLIC_URL");

export async function uploadImage(
  key: string,
  data: Buffer,
  contentType: string,
): Promise<string> {
  await getClient().send(
    new PutObjectCommand({
      Bucket: bucket(),
      Key: key,
      Body: data,
      ContentType: contentType,
    }),
  );
  return `${publicUrl().replace(/\/$/, "")}/${key}`;
}

export async function deleteImage(key: string): Promise<void> {
  // capture-ref keys are shared photo objects owned by capture_photos — never delete them here
  if (key.startsWith("capture-ref/")) return;
  await getClient().send(new DeleteObjectCommand({ Bucket: bucket(), Key: key })).catch((err: unknown) => {
    console.error(`deleteImage failed for key "${key}":`, err);
  });
}
