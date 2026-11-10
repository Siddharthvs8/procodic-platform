import { Controller, Get } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { PrismaService } from "../database/prisma.module";

@ApiTags("health")
@Controller("health")
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}
  @Get()
  async check() {
    await this.prisma.$queryRaw`SELECT 1`;
    return { data: { status: "ok", service: "procodic-api", timestamp: new Date().toISOString() } };
  }
}
