import { ApiPropertyOptional } from "@nestjs/swagger";
import { SpaceStatus } from "@prisma/client";
import { Type } from "class-transformer";
import { IsEnum, IsInt, IsOptional, Max, Min } from "class-validator";

export class FindSpacesQueryDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page = 1;

  @ApiPropertyOptional({ example: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit = 20;

  @ApiPropertyOptional({ enum: SpaceStatus })
  @IsOptional()
  @IsEnum(SpaceStatus)
  status?: SpaceStatus;
}
