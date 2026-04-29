import { promises as fs } from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

const LOCAL_BACKUP_ROOT = path.join(process.cwd(), "backups", "schools");

type StorageProvider = "local" | "s3";

function getProvider(): StorageProvider {
  if (process.env.BACKUP_STORAGE_PROVIDER === "s3" || process.env.BACKUP_S3_BUCKET) {
    return "s3";
  }
  return "local";
}

function getBucket(): string {
  const bucket = process.env.BACKUP_S3_BUCKET;
  if (!bucket) {
    throw new Error("BACKUP_S3_BUCKET is required for S3/R2 backup storage");
  }
  return bucket;
}

function getS3Key(schoolId: string, backupId: string): string {
  const prefix = (process.env.BACKUP_S3_PREFIX || "backups/schools").replace(/\/+$/, "");
  return `${prefix}/${schoolId}/${backupId}.json.gz`;
}

function toBuffer(payload: unknown): Buffer {
  if (Buffer.isBuffer(payload)) return payload;
  if (payload instanceof Uint8Array) return Buffer.from(payload);
  return Buffer.from([]);
}

async function streamToBuffer(stream: Readable): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

function createS3Client() {
  return new S3Client({
    region: process.env.BACKUP_S3_REGION || "auto",
    endpoint: process.env.BACKUP_S3_ENDPOINT || undefined,
    forcePathStyle: process.env.BACKUP_S3_FORCE_PATH_STYLE === "true",
    credentials:
      process.env.BACKUP_S3_ACCESS_KEY_ID && process.env.BACKUP_S3_SECRET_ACCESS_KEY
        ? {
            accessKeyId: process.env.BACKUP_S3_ACCESS_KEY_ID,
            secretAccessKey: process.env.BACKUP_S3_SECRET_ACCESS_KEY,
          }
        : undefined,
  });
}

export function getBackupStorageProvider(): StorageProvider {
  return getProvider();
}

export async function writeBackupArtifact(input: {
  schoolId: string;
  backupId: string;
  body: Buffer;
}): Promise<string> {
  const provider = getProvider();
  if (provider === "local") {
    const schoolDir = path.join(LOCAL_BACKUP_ROOT, input.schoolId);
    await fs.mkdir(schoolDir, { recursive: true });
    const filePath = path.join(schoolDir, `${input.backupId}.json.gz`);
    await fs.writeFile(filePath, input.body);
    return filePath;
  }

  const bucket = getBucket();
  const key = getS3Key(input.schoolId, input.backupId);
  const s3 = createS3Client();
  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: input.body,
      ContentType: "application/gzip",
    })
  );
  return `s3://${bucket}/${key}`;
}

export async function checkBackupStorageHealth(): Promise<{
  ok: boolean;
  provider: StorageProvider;
  details: string;
}> {
  const provider = getProvider();
  try {
    if (provider === "local") {
      await fs.mkdir(LOCAL_BACKUP_ROOT, { recursive: true });
      const probePath = path.join(LOCAL_BACKUP_ROOT, ".healthcheck");
      await fs.writeFile(probePath, "ok");
      await fs.rm(probePath, { force: true });
      return { ok: true, provider, details: "Local backup storage is writable." };
    }

    const bucket = getBucket();
    const s3 = createS3Client();
    const key = `${(process.env.BACKUP_S3_PREFIX || "backups/schools").replace(/\/+$/, "")}/.healthcheck-${Date.now()}.txt`;
    await s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: Buffer.from("ok"),
        ContentType: "text/plain",
      })
    );
    await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
    return { ok: true, provider, details: `S3/R2 storage reachable (bucket: ${bucket}).` };
  } catch (error) {
    return {
      ok: false,
      provider,
      details: error instanceof Error ? error.message : "Unknown storage error",
    };
  }
}

export async function readBackupArtifact(storagePath: string): Promise<Buffer> {
  if (!storagePath.startsWith("s3://")) {
    return fs.readFile(storagePath);
  }

  const withoutScheme = storagePath.slice("s3://".length);
  const slashIndex = withoutScheme.indexOf("/");
  if (slashIndex === -1) {
    throw new Error("Invalid S3 storagePath format");
  }
  const bucket = withoutScheme.slice(0, slashIndex);
  const key = withoutScheme.slice(slashIndex + 1);
  const s3 = createS3Client();
  const response = await s3.send(
    new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    })
  );
  if (!response.Body) return Buffer.from([]);
  if (response.Body instanceof Readable) return streamToBuffer(response.Body);
  return toBuffer(response.Body);
}

export async function deleteBackupArtifact(storagePath: string): Promise<void> {
  if (!storagePath.startsWith("s3://")) {
    await fs.rm(storagePath, { force: true });
    return;
  }

  const withoutScheme = storagePath.slice("s3://".length);
  const slashIndex = withoutScheme.indexOf("/");
  if (slashIndex === -1) return;
  const bucket = withoutScheme.slice(0, slashIndex);
  const key = withoutScheme.slice(slashIndex + 1);
  const s3 = createS3Client();
  await s3.send(
    new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    })
  );
}
