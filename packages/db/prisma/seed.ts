import { config } from "dotenv";
config({ path: process.env.ENV_FILE ?? "../../.env" });
import { PrismaClient, ContentType, PublishStatus, UserRole } from "../generated/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (!email || !password || password.length < 14) {
    throw new Error("Set SEED_ADMIN_EMAIL and a SEED_ADMIN_PASSWORD of at least 14 characters before seeding.");
  }
  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.adminUser.upsert({
    where: { email },
    update: { passwordHash, role: UserRole.SUPER_ADMIN, active: true },
    create: { email, name: "PROCODIC Administrator", passwordHash, role: UserRole.SUPER_ADMIN },
  });

  await prisma.siteSetting.upsert({
    where: { key: "brand" },
    update: {},
    create: { key: "brand", value: { name: "PROCODIC", tagline: "CODE. CREATE. ELEVATE.", primaryColor: "#1265ff", accentColor: "#00d9ff" } },
  });

  const draftProduct = {
    type: ContentType.PRODUCT,
    slug: "your-first-product",
    title: "Your first product",
    status: PublishStatus.DRAFT,
    featured: false,
    data: { tagline: "A flexible starting point", description: "Replace this draft with a verified PROCODIC product before publishing.", category: "Enterprise software", features: [], industries: [], screenshots: [], integrations: [], faqs: [] },
  };
  await prisma.contentItem.upsert({ where: { type_slug: { type: draftProduct.type, slug: draftProduct.slug } }, update: {}, create: draftProduct });
  console.log(`Seeded administrator ${email} and a draft product placeholder.`);
}

main().finally(() => prisma.$disconnect());
