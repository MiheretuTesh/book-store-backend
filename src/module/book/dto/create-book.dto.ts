import {
  IsString,
  IsNumber,
  IsOptional,
  Min,
  Max,
  IsBoolean,
  Matches,
  // Transform,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class CreateBookDto {
  @ApiProperty({ description: 'The title of the book' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'The author of the book' })
  @IsString()
  author: string;

  @ApiProperty({ description: 'The ISBN of the book' })
  @IsString()
  @Matches(/^(?=(?:\D*\d){10}(?:(?:\D*\d){3})?$)[\d-]+$/, {
    message: 'Invalid ISBN format',
  })
  isbn: string;

  @ApiProperty({
    description: 'Whether the book has been read',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  read_status: boolean = false;

  @ApiProperty({
    description: 'User rating of the book (1-5)',
    minimum: 1,
    maximum: 5,
  })
  @IsNumber()
  @Min(1)
  @Max(5)
  @IsOptional()
  user_rating?: number;

  @ApiProperty({ description: 'URL of the book cover image' })
  @IsString()
  @IsOptional()
  file_url?: string;

  @ApiProperty({ description: 'Additional notes about the book' })
  @IsString()
  @IsOptional()
  notes?: string;
}
