import { Body, Controller, Get, Header, Param, Patch, Post, Query, Req, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { UserRole } from "../../generated/client";
import { AuthGuard, RequestWithUser, Roles, RolesGuard } from "../auth/security";
import { CreateLeadDto, UpdateLeadDto } from "./leads.dto";
import { LeadsService } from "./leads.service";

@ApiTags("leads")
@Controller()
export class LeadsController {
  constructor(private readonly leads: LeadsService) {}

  @Post("leads")
  async create(@Body() dto: CreateLeadDto) {
    if (dto.website?.trim()) return { data: { accepted: true } };
    return { data: await this.leads.create(dto) };
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMINISTRATOR, UserRole.SALES_MANAGER)
  @Get("admin/leads")
  async list(@Query("q") q = "", @Query("status") status?: string, @Query("category") category?: string) { return { data: await this.leads.list(q, status, category) }; }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMINISTRATOR, UserRole.SALES_MANAGER)
  @Get("admin/leads/export.csv")
  @Header("Content-Type", "text/csv; charset=utf-8")
  @Header("Content-Disposition", "attachment; filename=procodic-enquiries.csv")
  async export() { return this.leads.csv(); }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMINISTRATOR, UserRole.SALES_MANAGER)
  @Patch("admin/leads/:id")
  async update(@Param("id") id: string, @Body() dto: UpdateLeadDto, @Req() req: RequestWithUser) { return { data: await this.leads.update(id, dto, req.user) }; }
}
