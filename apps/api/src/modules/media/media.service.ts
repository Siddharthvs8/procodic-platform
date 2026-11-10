import { BadRequestException, Injectable, NotFoundException, ServiceUnavailableException } from "@nestjs/common";
import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { PrismaService } from "../../database/prisma.module";
import { SafeUser } from "../auth/security";
import { MediaMetadataDto } from "./media.dto";

const MAX_IMAGE = 15 * 1024 * 1024;
const MAX_DOCUMENT = 20 * 1024 * 1024;
const MAX_VIDEO = 80 * 1024 * 1024;
const MAX_REQUEST_BYTES = 80 * 1024 * 1024;
type Accepted = { mime: string; extension: string; max: number; category: string };

@Injectable()
export class MediaService {
  private readonly storage = process.env.MEDIA_STORAGE ?? "local";
  private readonly directory = resolve(process.env.MEDIA_LOCAL_DIR ?? "./uploads");
  private readonly bucket = process.env.S3_BUCKET;
  private readonly publicBase = process.env.MEDIA_PUBLIC_URL?.replace(/\/$/, "");
  private readonly endpoint = process.env.S3_ENDPOINT;
  private readonly s3 = new S3Client({
    region: process.env.S3_REGION || "us-east-1",
    ...(this.endpoint ? { endpoint: this.endpoint, forcePathStyle: true } : {}),
    ...(process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY
      ? { credentials: { accessKeyId: process.env.S3_ACCESS_KEY_ID, secretAccessKey: process.env.S3_SECRET_ACCESS_KEY } }
      : {}),
  });

  constructor(private readonly prisma: PrismaService) {}

  async list(q = "", category = "") {
    const assets = await this.prisma.mediaAsset.findMany({ where: { ...(category ? { category } : {}), ...(q ? { filename: { contains: q, mode: "insensitive" } } : {}) }, orderBy: { createdAt: "desc" }, take: 250 });
    return assets.map((asset) => ({ ...asset, url: this.publicUrl(asset.storageKey) }));
  }

  async upload(file: Express.Multer.File | undefined, metadata: MediaMetadataDto, actor: SafeUser) {
    if (!file?.buffer?.length) throw new BadRequestException("Choose a file to upload.");
    const accepted = this.detect(file.buffer);
    if (!accepted) throw new BadRequestException("Supported files are PNG, JPEG, WebP, PDF and MP4.");
    if (file.size > accepted.max) throw new BadRequestException(`This file exceeds the ${Math.round(accepted.max / 1024 / 1024)} MB limit.`);
    if (this.storage === "s3" && !this.bucket) throw new ServiceUnavailableException("S3_BUCKET is not configured.");
    const key = `${randomUUID()}.${accepted.extension}`;
    await this.put(key, accepted.mime, file.buffer);
    try {
      const saved = await this.prisma.mediaAsset.create({ data: { filename: file.originalname.replace(/[\\/]/g, "_").slice(0, 240), storageKey: key, mimeType: accepted.mime, sizeBytes: file.size, altText: metadata.altText?.trim() || null, category: metadata.category?.trim().slice(0, 80) || accepted.category } });
      await this.prisma.auditLog.create({ data: { actorId: actor.id, action: "media.uploaded", entityType: "MEDIA_ASSET", entityId: saved.id, metadata: { mimeType: accepted.mime, sizeBytes: file.size } } });
      return { ...saved, url: this.publicUrl(key) };
    } catch (error) {
      await this.removeObject(key).catch(() => undefined);
      throw error;
    }
  }

  async remove(id: string, actor: SafeUser) {
    const asset = await this.prisma.mediaAsset.findUnique({ where: { id } });
    if (!asset) throw new NotFoundException("Media item was not found.");
    await this.removeObject(asset.storageKey);
    await this.prisma.mediaAsset.delete({ where: { id } });
    await this.prisma.auditLog.create({ data: { actorId: actor.id, action: "media.deleted", entityType: "MEDIA_ASSET", entityId: id, metadata: { filename: asset.filename } } });
    return { id };
  }

  private async put(key: string, mime: string, buffer: Buffer) {
    if (this.storage === "s3") {
      await this.s3.send(new PutObjectCommand({ Bucket: this.bucket, Key: key, Body: buffer, ContentType: mime, CacheControl: "public, max-age=31536000, immutable" }));
      return;
    }
    await mkdir(this.directory, { recursive: true });
    await writeFile(join(this.directory, key), buffer, { flag: "wx" });
  }

  private async removeObject(key: string) {
    if (this.storage === "s3") {
      if (!this.bucket) throw new ServiceUnavailableException("S3_BUCKET is not configured.");
      await this.s3.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
      return;
    }
    try { await unlink(join(this.directory, key)); } catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; }
  }

  private publicUrl(key: string) {
    if (this.publicBase) return `${this.publicBase}/${key}`;
    if (this.storage === "s3" && this.bucket) return this.endpoint ? `${this.endpoint.replace(/\/$/, "")}/${this.bucket}/${key}` : `https://${this.bucket}.s3.${process.env.S3_REGION || "us-east-1"}.amazonaws.com/${key}`;
    return `${process.env.API_PUBLIC_URL ?? `http://localhost:${process.env.API_PORT ?? 4000}`}/media/${key}`;
  }

  private detect(buffer: Buffer): Accepted | null {
    if (buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) return { mime:"image/png", extension:"png", max:MAX_IMAGE, category:"image" };
    if (buffer.length >= 3 && buffer[0]===255 && buffer[1]===216 && buffer[2]===255) return { mime:"image/jpeg", extension:"jpg", max:MAX_IMAGE, category:"image" };
    if (buffer.length >= 12 && buffer.toString("ascii",0,4)==="RIFF" && buffer.toString("ascii",8,12)==="WEBP") return { mime:"image/webp", extension:"webp", max:MAX_IMAGE, category:"image" };
    if (buffer.length >= 5 && buffer.toString("ascii",0,5)==="%PDF-") return { mime:"application/pdf", extension:"pdf", max:MAX_DOCUMENT, category:"document" };
    if (buffer.length >= 12 && buffer.toString("ascii",4,8)==="ftyp") return { mime:"video/mp4", extension:"mp4", max:MAX_VIDEO, category:"video" };
    return null;
  }
}
