import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
    IsArray,
    IsInt,
    IsPositive,
    IsString,
    ValidateNested,
} from 'class-validator';

class ReplacementItemDto {
    @ApiProperty({ example: 'clabc123' })
    @IsString()
    id: string;

    @ApiProperty({ example: 1 })
    @IsInt()
    @IsPositive()
    order: number;
}

export class ReplaceSpaceFilesDto {
    @ApiProperty({ type: [ReplacementItemDto] })
    @Transform(({ value }) =>
        typeof value === 'string' ? JSON.parse(value) : value,
    )
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ReplacementItemDto)
    imageReplacementData: ReplacementItemDto[];

    @ApiProperty({ type: [ReplacementItemDto] })
    @Transform(({ value }) =>
        typeof value === 'string' ? JSON.parse(value) : value,
    )
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ReplacementItemDto)
    pdfReplacementData: ReplacementItemDto[];
}
