import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  UploadedFile,
  Query,
  BadRequestException,
  // UseGuards,
  Request,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes } from '@nestjs/swagger';
import { BookService } from './book.service';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';
import { UploadService } from '../upload/upload.service';
// import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('books')
@Controller('books')
// @UseGuards(JwtAuthGuard)
export class BookController {
  constructor(
    private readonly booksService: BookService,
    private readonly uploadService: UploadService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new book' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      fileFilter: (req, file, callback) => {
        const allowedMimeTypes = [
          'application/pdf', // PDF
          'application/epub+zip', // EPUB
          'application/x-mobipocket-ebook', // MOBI
          'application/vnd.amazon.ebook', // AZW, AZW3
          'text/plain', // TXT
          'application/rtf', // RTF
          'application/msword', // DOC
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // DOCX
        ];

        if (!allowedMimeTypes.includes(file.mimetype)) {
          return callback(
            new BadRequestException(
              'Only book file formats are allowed (PDF, EPUB, MOBI, AZW, TXT, RTF, DOC, DOCX)',
            ),
            false,
          );
        }
        callback(null, true);
      },
      limits: {
        fileSize: 100 * 1024 * 1024,
      },
    }),
  )
  async create(
    @Request() req,
    @Body() createBookDto: CreateBookDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Book file is required');
    }
    const fileUrl = await this.uploadService.uploadFile(file);

    return this.booksService.create({
      ...createBookDto,
      file_url: fileUrl,
    });
  }

  @Get()
  @ApiOperation({ summary: 'Get all books' })
  findAll() {
    return this.booksService.findAll({});
  }

  @Get('search-books')
  @ApiOperation({ summary: 'Search books by title or author' })
  async searchBooks(
    @Query('query') query: string,
    @Query('searchBy') searchBy: 'title' | 'author' | 'all' = 'all',
  ) {
    return this.booksService.searchBooks(query, searchBy);
  }

  @Get('filter-books')
  @ApiOperation({ summary: 'Filter books by various parameters' })
  async filterBooks(
    @Query('author') author?: string,
    @Query('read') read?: boolean,
    @Query('sortBy') sortBy?: 'title' | 'author' | 'createdAt',
    @Query('order') order?: 'asc' | 'desc',
  ) {
    return this.booksService.filterBooks({
      author,
      read:
        read !== undefined ? String(read).toLowerCase() === 'true' : undefined,
      sortBy,
      order: order || 'asc',
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a book by id' })
  findOne(@Param('id') id: string) {
    return this.booksService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a book' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async update(
    @Param('id') id: string,
    @Body() updateBookDto: UpdateBookDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    let fileUrl: string | undefined;

    if (file) {
      fileUrl = await this.uploadService.uploadFile(file);
      updateBookDto.file_url = fileUrl;
    }

    return this.booksService.update(id, updateBookDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a book' })
  remove(@Param('id') id: string) {
    return this.booksService.remove(id);
  }
}
