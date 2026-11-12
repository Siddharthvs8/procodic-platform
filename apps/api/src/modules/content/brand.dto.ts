import { IsString, MaxLength } from "class-validator";

export class SaveBrandDto {
  @IsString() @MaxLength(360000) logoUrl!: string;
}
