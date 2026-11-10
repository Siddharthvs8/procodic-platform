import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { ContentType, Prisma, PublishStatus } from "@procodic/db/client";
import { PrismaService } from "../../database/prisma.module";
import { SaveContentDto } from "./content.dto";
import { SafeUser } from "../auth/security";

const ALIASES: Record<string, ContentType> = {
  products: ContentType.PRODUCT, product: ContentType.PRODUCT,
  categories: ContentType.PRODUCT_CATEGORY, "product-categories": ContentType.PRODUCT_CATEGORY,
  industries: ContentType.INDUSTRY, research: ContentType.RESEARCH_PROJECT, "ai-research": ContentType.RESEARCH_PROJECT, "research-projects": ContentType.RESEARCH_PROJECT,
  training: ContentType.TRAINING_PROGRAM, programs: ContentType.TRAINING_PROGRAM, "training-programs": ContentType.TRAINING_PROGRAM,
  "case-studies": ContentType.CASE_STUDY, "testimonials": ContentType.TESTIMONIAL, "collaborations": ContentType.COLLABORATION,
  "team-members": ContentType.TEAM_MEMBER, articles: ContentType.ARTICLE, insights: ContentType.ARTICLE, faqs: ContentType.FAQ,
  navigation: ContentType.NAVIGATION_ITEM, sections: ContentType.HOMEPAGE_SECTION,
};

@Injectable()
export class ContentService {
  constructor(private readonly prisma: PrismaService) {}

  resolveType(input: string) {
    const type = ALIASES[input.toLowerCase()] ?? ALIASES[input.toLowerCase().replaceAll("_", "-")];
    if (!type) throw new BadRequestException("Unknown content collection.");
    return type;
  }

  listPublic(input: string, page = 1, pageSize = 24) {
    const type = this.resolveType(input);
    return this.prisma.contentItem.findMany({ where: { type, status: PublishStatus.PUBLISHED }, orderBy: [{ displayOrder: "asc" }, { publishedAt: "desc" }], skip: (page - 1) * pageSize, take: Math.min(pageSize, 60) });
  }

  async publicBySlug(input: string, slug: string) {
    const item = await this.prisma.contentItem.findFirst({ where: { type: this.resolveType(input), slug, status: PublishStatus.PUBLISHED } });
    if (!item) throw new NotFoundException("Published content was not found.");
    return item;
  }

  listAdmin(input: string, query = "", status?: string) {
    const type = this.resolveType(input);
    const statusValue = status && Object.values(PublishStatus).includes(status as PublishStatus) ? status as PublishStatus : undefined;
    return this.prisma.contentItem.findMany({ where: { type, ...(statusValue ? { status: statusValue } : {}), ...(query ? { OR: [{ title: { contains: query, mode: "insensitive" } }, { slug: { contains: query, mode: "insensitive" } }] } : {}) }, orderBy: [{ displayOrder: "asc" }, { updatedAt: "desc" }] });
  }

  private async audit(actor: SafeUser, action: string, entityType: string, entityId: string | null, metadata: object = {}) {
    await this.prisma.auditLog.create({ data: { actorId: actor.id, action, entityType, entityId, metadata } });
  }

  async create(input: string, dto: SaveContentDto, actor: SafeUser) {
    const type = this.resolveType(input);
    const status = this.status(dto.status);
    const item = await this.prisma.contentItem.create({ data: { type, title: dto.title.trim(), slug: this.slug(dto.slug), data: dto.data as Prisma.InputJsonObject, status, featured: dto.featured ?? false, displayOrder: dto.displayOrder ?? 0, seoTitle: dto.seoTitle, seoDescription: dto.seoDescription, publishedAt: status === PublishStatus.PUBLISHED ? new Date() : null } });
    await this.audit(actor, "content.created", type, item.id, { slug: item.slug });
    return item;
  }

  async update(id: string, dto: SaveContentDto, actor: SafeUser) {
    const current = await this.prisma.contentItem.findUnique({ where: { id } });
    if (!current) throw new NotFoundException("Content record was not found.");
    const status = this.status(dto.status ?? current.status);
    const item = await this.prisma.contentItem.update({ where: { id }, data: { title: dto.title.trim(), slug: this.slug(dto.slug), data: dto.data as Prisma.InputJsonObject, status, featured: dto.featured ?? current.featured, displayOrder: dto.displayOrder ?? current.displayOrder, seoTitle: dto.seoTitle, seoDescription: dto.seoDescription, publishedAt: status === PublishStatus.PUBLISHED ? current.publishedAt ?? new Date() : null } });
    await this.audit(actor, "content.updated", current.type, item.id, { slug: item.slug, status });
    return item;
  }

  async archive(id: string, actor: SafeUser) {
    const current = await this.prisma.contentItem.findUnique({ where: { id } });
    if (!current) throw new NotFoundException("Content record was not found.");
    const item = await this.prisma.contentItem.update({ where: { id }, data: { status: PublishStatus.ARCHIVED, publishedAt: null } });
    await this.audit(actor, "content.archived", current.type, item.id);
    return item;
  }

  async dashboard() {
    const [leads, newLeads, products, drafts, testimonials, collaborations, articles, latestLeads, activity] = await Promise.all([
      this.prisma.lead.count(), this.prisma.lead.count({ where: { status: "NEW" } }),
      this.prisma.contentItem.count({ where: { type: ContentType.PRODUCT, status: PublishStatus.PUBLISHED } }),
      this.prisma.contentItem.count({ where: { type: ContentType.PRODUCT, status: PublishStatus.DRAFT } }),
      this.prisma.contentItem.count({ where: { type: ContentType.TESTIMONIAL } }),
      this.prisma.contentItem.count({ where: { type: ContentType.COLLABORATION } }),
      this.prisma.contentItem.count({ where: { type: ContentType.ARTICLE, status: PublishStatus.PUBLISHED } }),
      this.prisma.lead.findMany({ take: 6, orderBy: { createdAt: "desc" }, select: { id: true, name: true, email: true, category: true, status: true, createdAt: true } }),
      this.prisma.auditLog.findMany({ take: 8, orderBy: { createdAt: "desc" }, include: { actor: { select: { name: true } } } }),
    ]);
    return { totals: { leads, newLeads, products, drafts, testimonials, collaborations, articles }, latestLeads, activity };
  }

  private status(value?: string): PublishStatus {
    const normalized = (value ?? "DRAFT").toUpperCase();
    if (!Object.values(PublishStatus).includes(normalized as PublishStatus)) throw new BadRequestException("Status must be DRAFT, PUBLISHED or ARCHIVED.");
    return normalized as PublishStatus;
  }
  private slug(value: string) {
    const slug = value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    if (!slug) throw new BadRequestException("Enter a valid URL slug.");
    return slug;
  }
}
