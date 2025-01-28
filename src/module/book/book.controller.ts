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
  Request,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes } from '@nestjs/swagger';
import { BookService } from './book.service';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';
import { UploadService } from '../upload/upload.service';

@ApiTags('books')
@Controller('books')
export class BookController {
  constructor(
    private readonly booksService: BookService,
    private readonly uploadService: UploadService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new book' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async create(
    @Request() req,
    @Body() createBookDto: CreateBookDto,
    @UploadedFile() file?: Express.Multer.File,
    @UploadedFile() coverImage?: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Book file is required');
    }

    const fileUrl = await this.uploadService.uploadFile(file);
    let coverImageUrl: string | undefined;

    if (coverImage) {
      coverImageUrl = await this.uploadService.uploadFile(coverImage);
    }

    return this.booksService.create({
      ...createBookDto,
      file_url: fileUrl,
      coverImageUrl,
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

  @Get('special-books')
  @ApiOperation({
    summary: 'Get special books (new arrivals, best sellers, featured)',
  })
  async getSpecialBooks() {
    return this.booksService.getSpecialBooks();
  }

  @Get('genre/:genre')
  @ApiOperation({ summary: 'Get books by genre' })
  async getBooksByGenre(@Param('genre') genre: string) {
    return this.booksService.getBooksByGenre(genre);
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
    @UploadedFile() coverImage?: Express.Multer.File,
  ) {
    let fileUrl: string | undefined;
    let coverImageUrl: string | undefined;

    if (file) {
      fileUrl = await this.uploadService.uploadFile(file);
      updateBookDto.file_url = fileUrl;
    }

    if (coverImage) {
      coverImageUrl = await this.uploadService.uploadFile(coverImage);
      updateBookDto.coverImageUrl = coverImageUrl;
    }

    return this.booksService.update(id, updateBookDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a book' })
  remove(@Param('id') id: string) {
    return this.booksService.remove(id);
  }
}
