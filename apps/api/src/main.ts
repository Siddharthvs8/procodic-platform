import "./config/env";
import "reflect-metadata";
import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { resolve } from "node:path";
import express from "express";
import { AppModule } from "./app.module";

async function bootstrap() {
  if (process.env.NODE_ENV === "production" && (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32)) {
    throw new Error("JWT_SECRET must contain at least 32 characters in production.");
  }
  const app = await NestFactory.create(AppModule, { bodyParser: false });
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true, limit: "1mb" }));
  app.setGlobalPrefix("api");
  if ((process.env.MEDIA_STORAGE ?? "local") === "local") app.use("/media", express.static(resolve(process.env.MEDIA_LOCAL_DIR ?? "./uploads"), { index: false, maxAge: "1d", immutable: true }));
  app.enableCors({ origin: process.env.WEB_ORIGIN ?? "http://localhost:3000", credentials: true });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }));
  const openApi = new DocumentBuilder().setTitle("PROCODIC Content API").setDescription("Public content and private administration API").setVersion("1.0").build();
  SwaggerModule.setup("api/docs", app, SwaggerModule.createDocument(app, openApi));
  await app.listen(Number(process.env.PORT ?? process.env.API_PORT ?? 4000), "0.0.0.0");
}

void bootstrap();
