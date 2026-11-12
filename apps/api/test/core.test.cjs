const assert = require("node:assert/strict");
const test = require("node:test");
const { plainToInstance } = require("class-transformer");
const { validate } = require("class-validator");
const { ContentType, PublishStatus } = require("@procodic/db/client");
const { ContentService } = require("../dist/modules/content/content.service.js");
const { LoginDto } = require("../dist/modules/auth/auth.dto.js");
const { AuthGuard } = require("../dist/modules/auth/security.js");
const { MediaService } = require("../dist/modules/media/media.service.js");
const { ContentController } = require("../dist/modules/content/content.controller.js");

test("logo settings default correctly and expose only the logo", async () => {
  const empty = new ContentService({ siteSetting: { findUnique: async () => null } });
  assert.deepEqual(await empty.brand(), { logoUrl: "/brand/procodic-logo.png" });
  const saved = new ContentService({ siteSetting: { findUnique: async () => ({ value: { logoUrl: "saved-logo", internal: "private" } }) } });
  assert.deepEqual(await saved.brand(), { logoUrl: "saved-logo" });
});

test("logo writes reject unsafe, mismatched and oversized images before persistence", async () => {
  const service = new ContentService({});
  for (const input of ["javascript:alert(1)", "https://example.com/logo.svg", "data:image/png;base64,aGVsbG8=", `data:image/jpeg;base64,${Buffer.alloc(256 * 1024 + 1, 255).toString("base64")}`]) {
    await assert.rejects(service.saveBrand(input, { id: "admin" }), error => error.getStatus() === 400);
  }
});

test("logo updates and resets persist and audit in one transaction", async () => {
  const writes = [];
  const audits = [];
  const service = new ContentService({ $transaction: async callback => callback({ siteSetting: { upsert: async value => writes.push(value) }, auditLog: { create: async value => audits.push(value) } }) });
  const logoUrl = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aRZkAAAAASUVORK5CYII=";
  await service.saveBrand(logoUrl, { id: "admin" });
  assert.deepEqual(writes[0].update.value, { logoUrl });
  await service.saveBrand("/brand/procodic-logo.png", { id: "admin" });
  assert.equal(writes[1].update.value.logoUrl, "/brand/procodic-logo.png");
  assert.equal(audits.length, 2);
  assert.equal(audits[0].data.actorId, "admin");
});

test("only Super Admin can update logo settings", () => {
  assert.deepEqual(Reflect.getMetadata("allowed_roles", ContentController.prototype.saveBrand), ["SUPER_ADMIN"]);
  assert.equal(Reflect.getMetadata("__guards__", ContentController.prototype.saveBrand).length, 2);
});

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

test("authenticated sessions include the display name without exposing credentials", async () => {
  const user = { id: "admin-1", name: "PROCODIC Administrator", email: "admin@example.com", role: "SUPER_ADMIN", active: true };
  const guard = new AuthGuard(
    { verifyAsync: async () => ({ sub: user.id }) },
    { adminUser: { findUnique: async ({ select }) => Object.fromEntries(Object.entries(user).filter(([key]) => select[key])) } },
  );
  const request = { headers: { cookie: "procodic_admin=valid-session" } };
  const context = { switchToHttp: () => ({ getRequest: () => request }) };
  assert.equal(await guard.canActivate(context), true);
  assert.deepEqual(request.user, { id: user.id, name: user.name, email: user.email, role: user.role });
});

test("media validation recognizes signatures and rejects unsupported bytes", () => {
  const media = new MediaService({});
  const png = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10, 0]);
  const jpeg = Buffer.from([255, 216, 255, 0]);
  assert.equal(media.detect(png).mime, "image/png");
  assert.equal(media.detect(jpeg).mime, "image/jpeg");
  assert.equal(media.detect(Buffer.from("not an image")), null);
});
