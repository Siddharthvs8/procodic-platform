import { Module } from "@nestjs/common";
import { PrismaModule } from "./database/prisma.module";
import { AuthModule } from "./modules/auth/auth.module";
import { ContentModule } from "./modules/content/content.module";
import { LeadsModule } from "./modules/leads/leads.module";
import { MediaModule } from "./modules/media/media.module";
import { HealthController } from "./modules/health.controller";

@Module({
  imports: [PrismaModule, AuthModule, ContentModule, LeadsModule, MediaModule],
  controllers: [HealthController],
})
export class AppModule {}
