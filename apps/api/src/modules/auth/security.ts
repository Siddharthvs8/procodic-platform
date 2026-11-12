import { CanActivate, createParamDecorator, ExecutionContext, Injectable, SetMetadata, UnauthorizedException, ForbiddenException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { JwtService } from "@nestjs/jwt";
import type { Request } from "express";
import { UserRole } from "../../generated/client";
import { PrismaService } from "../../database/prisma.module";

export type SafeUser = { id: string; name: string; email: string; role: UserRole };
export type RequestWithUser = Request & { user: SafeUser };
const ROLE_KEY = "allowed_roles";
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLE_KEY, roles);

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService, private readonly prisma: PrismaService) {}
  async canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest<RequestWithUser>();
    const cookie = req.headers.cookie?.split(";").map((item) => item.trim()).find((item) => item.startsWith("procodic_admin="));
    const token = cookie?.slice("procodic_admin=".length) ?? req.headers.authorization?.replace(/^Bearer\s+/i, "");
    if (!token) throw new UnauthorizedException();
    try {
      const payload = await this.jwt.verifyAsync<{ sub: string; email: string; role: UserRole }>(token);
      const user = await this.prisma.adminUser.findUnique({ where: { id: payload.sub }, select: { id: true, name: true, email: true, role: true, active: true } });
      if (!user?.active) throw new UnauthorizedException();
      req.user = { id: user.id, name: user.name, email: user.email, role: user.role };
      return true;
    } catch { throw new UnauthorizedException(); }
  }
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}
  canActivate(context: ExecutionContext) {
    const roles = this.reflector.getAllAndOverride<UserRole[]>(ROLE_KEY, [context.getHandler(), context.getClass()]);
    if (!roles?.length) return true;
    const req = context.switchToHttp().getRequest<RequestWithUser>();
    if (!req.user || !roles.includes(req.user.role)) throw new ForbiddenException("Your role cannot perform this action.");
    return true;
  }
}

export const CurrentUser = createParamDecorator((_data: unknown, context: ExecutionContext) => context.switchToHttp().getRequest<RequestWithUser>().user);
