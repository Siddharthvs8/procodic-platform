import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { UserRole } from "@procodic/db/client";
import { AuthGuard, RequestWithUser, Roles, RolesGuard } from "../auth/security";
import { SaveContentDto } from "./content.dto";
import { ContentService } from "./content.service";

@ApiTags("content")
@Controller()
export class ContentController {
  constructor(private readonly content: ContentService) {}

  @Get("content/:type")
  async publicList(@Param("type") type: string, @Query("page") page = "1", @Query("pageSize") pageSize = "24") {
    return { data: await this.content.listPublic(type, Math.max(1, Number(page) || 1), Math.min(60, Math.max(1, Number(pageSize) || 24))) };
  }
  @Get("content/:type/:slug")
  async publicDetail(@Param("type") type: string, @Param("slug") slug: string) { return { data: await this.content.publicBySlug(type, slug) }; }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMINISTRATOR, UserRole.SALES_MANAGER)
  @Get("admin/dashboard")
  async dashboard() { return { data: await this.content.dashboard() }; }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMINISTRATOR, UserRole.CONTENT_MANAGER, UserRole.MARKETING_MANAGER)
  @Get("admin/content/:type")
  async list(@Param("type") type: string, @Query("q") q = "", @Query("status") status?: string) { return { data: await this.content.listAdmin(type, q, status) }; }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMINISTRATOR, UserRole.CONTENT_MANAGER, UserRole.MARKETING_MANAGER)
  @Post("admin/content/:type")
  async create(@Param("type") type: string, @Body() dto: SaveContentDto, @Req() req: RequestWithUser) { return { data: await this.content.create(type, dto, req.user) }; }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMINISTRATOR, UserRole.CONTENT_MANAGER, UserRole.MARKETING_MANAGER)
  @Patch("admin/content/:type/:id")
  async update(@Param("id") id: string, @Body() dto: SaveContentDto, @Req() req: RequestWithUser) { return { data: await this.content.update(id, dto, req.user) }; }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMINISTRATOR, UserRole.CONTENT_MANAGER, UserRole.MARKETING_MANAGER)
  @Delete("admin/content/:type/:id")
  async archive(@Param("id") id: string, @Req() req: RequestWithUser) { return { data: await this.content.archive(id, req.user) }; }
}
