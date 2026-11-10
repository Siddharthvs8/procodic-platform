import { IsBoolean, IsInt, IsObject, IsOptional, IsString, MaxLength, Min } from "class-validator";

export class SaveContentDto {
  @IsString() @MaxLength(180) title!: string;
  @IsString() @MaxLength(180) slug!: string;
  @IsObject() data!: Record<string, unknown>;
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsBoolean() featured?: boolean;
  @IsOptional() @IsInt() @Min(0) displayOrder?: number;
  @IsOptional() @IsString() @MaxLength(180) seoTitle?: string;
  @IsOptional() @IsString() @MaxLength(320) seoDescription?: string;
}
