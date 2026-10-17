import { GetObjectCommand, HeadObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { createWriteStream } from "node:fs";
import { readFile } from "node:fs/promises";
import type { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";

/*
 * S3-совместимое хранилище: локально SeaweedFS (docker-compose), в проде R2.
 * Браузер получает подписанные ссылки и ходит в бакет напрямую — трафик не идёт через сервер.
 */

function env(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`${name} не задан (см. .env.example)`);
  return v;
}

let client: S3Client | undefined;

function s3() {
  client ??= new S3Client({
    endpoint: env("S3_ENDPOINT"),
    region: process.env.S3_REGION ?? "auto",
    credentials: { accessKeyId: env("S3_ACCESS_KEY"), secretAccessKey: env("S3_SECRET_KEY") },
    // SeaweedFS и MinIO понимают только path-style: http://host/bucket/key
    forcePathStyle: true,
    // Иначе SDK вшивает в подписанный PUT контрольную сумму, которую браузер не пришлёт (так же нужно для R2)
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
  });
  return client;
}

const bucket = () => env("S3_BUCKET");

/** Ссылки на чтение живут сутки: страница редактора может быть открыта долго */
const READ_TTL = 24 * 60 * 60;
const WRITE_TTL = 15 * 60;

export function signedGetUrl(key: string, expiresIn = READ_TTL) {
  return getSignedUrl(s3(), new GetObjectCommand({ Bucket: bucket(), Key: key }), { expiresIn });
}

/** Ссылка для загрузки файла из браузера (PUT) */
export function signedPutUrl(key: string, contentType: string, expiresIn = WRITE_TTL) {
  return getSignedUrl(s3(), new PutObjectCommand({ Bucket: bucket(), Key: key, ContentType: contentType }), { expiresIn });
}

export async function putObject(key: string, body: Uint8Array, contentType: string) {
  await s3().send(new PutObjectCommand({ Bucket: bucket(), Key: key, Body: body, ContentType: contentType }));
}

/** Размер и тип загруженного объекта; undefined — объекта нет */
export async function headObject(key: string) {
  try {
    const r = await s3().send(new HeadObjectCommand({ Bucket: bucket(), Key: key }));
    return { size: r.ContentLength ?? 0, contentType: r.ContentType };
  } catch (e) {
    if ((e as { name?: string }).name === "NotFound") return undefined;
    throw e;
  }
}

/** Скачивает объект в локальный файл (воркерам нужен файл для ffmpeg) */
export async function downloadToFile(key: string, file: string) {
  const r = await s3().send(new GetObjectCommand({ Bucket: bucket(), Key: key }));
  await pipeline(r.Body as Readable, createWriteStream(file));
}

export async function putFile(key: string, file: string, contentType: string) {
  await putObject(key, await readFile(file), contentType);
}
