import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { AuthGuard, RolesGuard } from "./security";

@Module({ imports: [JwtModule.register({ secret: process.env.JWT_SECRET ?? "development-only-secret-change-before-deploy", signOptions: { expiresIn: "8h" } })], controllers: [AuthController], providers: [AuthService, AuthGuard, RolesGuard], exports: [JwtModule, AuthGuard, RolesGuard] })
export class AuthModule {}
