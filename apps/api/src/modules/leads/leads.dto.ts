import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class CreateLeadDto {
  @IsString() @MinLength(2) @MaxLength(120) name!: string;
  @IsEmail() @MaxLength(254) email!: string;
  @IsOptional() @IsString() @MaxLength(40) phone?: string;
  @IsOptional() @IsString() @MaxLength(160) company?: string;
  @IsOptional() @IsString() @MaxLength(120) designation?: string;
  @IsString() @MaxLength(80) category!: string;
  @IsOptional() @IsString() @MaxLength(100) productSlug?: string;
  @IsString() @MinLength(15) @MaxLength(4000) message!: string;
  @IsOptional() @IsString() @MaxLength(160) website?: string;
}

export class UpdateLeadDto {
  @IsOptional() @IsString() @MaxLength(40) status?: string;
  @IsOptional() @IsString() assigneeId?: string;
  @IsOptional() @IsString() @MaxLength(3000) note?: string;
}
