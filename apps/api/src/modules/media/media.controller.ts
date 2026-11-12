import { Body, Controller, Delete, Get, Param, Post, Query, Req, UploadedFile, UseGuards, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiBody, ApiConsumes, ApiTags } from "@nestjs/swagger";
import { UserRole } from "../../generated/client";
import { memoryStorage } from "multer";
import { AuthGuard, RequestWithUser, Roles, RolesGuard } from "../auth/security";
import { MediaMetadataDto } from "./media.dto";
import { MediaService } from "./media.service";

const MAX_REQUEST_BYTES = 80 * 1024 * 1024;

@ApiTags("media")
@UseGuards(AuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ADMINISTRATOR, UserRole.CONTENT_MANAGER, UserRole.MARKETING_MANAGER)
@Controller("admin/media")
export class MediaController {
  constructor(private readonly media: MediaService) {}

  @Get()
  async list(@Query("q") q = "", @Query("category") category = "") { return { data: await this.media.list(q, category) }; }

  @Post()
  @ApiConsumes("multipart/form-data")
  @ApiBody({ schema: { type: "object", properties: { file: { type: "string", format: "binary" }, category: { type: "string" }, altText: { type: "string" } }, required: ["file"] } })
  @UseInterceptors(FileInterceptor("file", { storage: memoryStorage(), limits: { fileSize: MAX_REQUEST_BYTES } }))
  async upload(@UploadedFile() file: Express.Multer.File, @Body() metadata: MediaMetadataDto, @Req() req: RequestWithUser) { return { data: await this.media.upload(file, metadata, req.user) }; }

  @Delete(":id")
  async remove(@Param("id") id: string, @Req() req: RequestWithUser) { return { data: await this.media.remove(id, req.user) }; }
}
