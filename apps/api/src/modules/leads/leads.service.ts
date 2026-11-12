import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { LeadStatus } from "../../generated/client";
import { PrismaService } from "../../database/prisma.module";
import { SafeUser } from "../auth/security";
import { CreateLeadDto, UpdateLeadDto } from "./leads.dto";

@Injectable()
export class LeadsService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateLeadDto) {
    return this.prisma.lead.create({ data: { name: dto.name.trim(), email: dto.email.toLowerCase().trim(), phone: dto.phone?.trim(), company: dto.company?.trim(), designation: dto.designation?.trim(), category: dto.category.trim(), productSlug: dto.productSlug, message: dto.message.trim() }, select: { id: true, createdAt: true } });
  }

  async list(q = "", status?: string, category?: string) {
    const valid = status && Object.values(LeadStatus).includes(status.toUpperCase() as LeadStatus) ? status.toUpperCase() as LeadStatus : undefined;
    return this.prisma.lead.findMany({ where: { ...(valid ? { status: valid } : {}), ...(category ? { category } : {}), ...(q ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }, { company: { contains: q, mode: "insensitive" } }] } : {}) }, include: { assignee: { select: { id: true, name: true } }, notes: { orderBy: { createdAt: "desc" } } }, orderBy: { createdAt: "desc" }, take: 250 });
  }

  async update(id: string, dto: UpdateLeadDto, actor: SafeUser) {
    const current = await this.prisma.lead.findUnique({ where: { id } });
    if (!current) throw new NotFoundException("Enquiry was not found.");
    if (dto.status && !Object.values(LeadStatus).includes(dto.status.toUpperCase() as LeadStatus)) throw new BadRequestException("Choose a valid enquiry status.");
    const result = await this.prisma.lead.update({ where: { id }, data: { ...(dto.status ? { status: dto.status.toUpperCase() as LeadStatus } : {}), ...(dto.assigneeId !== undefined ? { assigneeId: dto.assigneeId || null } : {}), ...(dto.note?.trim() ? { notes: { create: { authorId: actor.id, content: dto.note.trim() } } } : {}) }, include: { assignee: { select: { id: true, name: true } }, notes: { orderBy: { createdAt: "desc" } } } });
    await this.prisma.auditLog.create({ data: { actorId: actor.id, action: "lead.updated", entityType: "LEAD", entityId: id, metadata: { status: result.status } } });
    return result;
  }

  async csv() {
    const rows = await this.prisma.lead.findMany({ orderBy: { createdAt: "desc" }, take: 10000 });
    const fields = ["id", "name", "email", "phone", "company", "designation", "category", "productSlug", "status", "createdAt", "message"] as const;
    const quote = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`;
    return [fields.join(","), ...rows.map((row) => fields.map((field) => quote(row[field])).join(","))].join("\r\n");
  }
}
