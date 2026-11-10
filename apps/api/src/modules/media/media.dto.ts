import { IsOptional, IsString, MaxLength } from "class-validator";

export class MediaMetadataDto {
  @IsOptional() @IsString() @MaxLength(500) altText?: string;
  @IsOptional() @IsString() @MaxLength(80) category?: string;
}
