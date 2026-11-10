const assert = require("node:assert/strict");
const test = require("node:test");
const { plainToInstance } = require("class-transformer");
const { validate } = require("class-validator");
const { ContentType, PublishStatus } = require("@procodic/db/client");
const { ContentService } = require("../dist/modules/content/content.service.js");
const { LoginDto } = require("../dist/modules/auth/auth.dto.js");
const { AuthGuard } = require("../dist/modules/auth/security.js");
const { MediaService } = require("../dist/modules/media/media.service.js");

test("public content queries are limited to published records", async () => {
  let query;
  const service = new ContentService({ contentItem: { findMany: async (value) => { query = value; return []; } } });
  await service.listPublic("products", 2, 100);
  assert.equal(query.where.type, ContentType.PRODUCT);
  assert.equal(query.where.status, PublishStatus.PUBLISHED);
  assert.equal(query.skip, 100);
  assert.equal(query.take, 60);
});

test("unknown public content collections are rejected", () => {
  const service = new ContentService({});
  assert.throws(() => service.resolveType("admin-users"), (error) => error.getStatus() === 400);
});

test("login input requires a valid email and a 12-character password", async () => {
  const invalid = plainToInstance(LoginDto, { email: "not-an-email", password: "short" });
  const invalidErrors = await validate(invalid);
  assert.deepEqual(new Set(invalidErrors.map((error) => error.property)), new Set(["email", "password"]));

  const valid = plainToInstance(LoginDto, { email: "admin@example.com", password: "long-enough-password" });
  assert.deepEqual(await validate(valid), []);
});

test("admin guard rejects requests without a session token", async () => {
  const guard = new AuthGuard({}, {});
  const context = { switchToHttp: () => ({ getRequest: () => ({ headers: {} }) }) };
  await assert.rejects(guard.canActivate(context), (error) => error.getStatus() === 401);
});

test("media validation recognizes signatures and rejects unsupported bytes", () => {
  const media = new MediaService({});
  const png = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10, 0]);
  const jpeg = Buffer.from([255, 216, 255, 0]);
  assert.equal(media.detect(png).mime, "image/png");
  assert.equal(media.detect(jpeg).mime, "image/jpeg");
  assert.equal(media.detect(Buffer.from("not an image")), null);
});
