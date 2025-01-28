import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';
import { Book } from './entities/book.entity';
import { UploadService } from '../upload/upload.service';

@Injectable()
export class BookService {
  constructor(
    @InjectModel(Book.name) private readonly bookModel: Model<Book>,
    private readonly uploadService: UploadService,
  ) {}

  async create(createBookDto: CreateBookDto): Promise<{
    success: boolean;
    message: string;
    data?: Book;
    error?: string;
  }> {
    try {
      const createdBook = new this.bookModel(createBookDto);
      const savedBook = await createdBook.save();
      return {
        success: true,
        message: 'Book added successfully',
        data: savedBook,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to add book',
          error: error.message || 'An unexpected error occurred',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findAll(filters: {
    search?: string;
    author?: string;
    read?: boolean;
    minRating?: number;
  }): Promise<{
    success: boolean;
    message: string;
    data?: Book[];
    error?: string;
  }> {
    try {
      let query = this.bookModel.find();

      if (filters.search) {
        query = query.find({ $text: { $search: filters.search } });
      }

      if (filters.author) {
        query = query.find({ author: new RegExp(filters.author, 'i') });
      }

      if (filters.read !== undefined) {
        query = query.find({ read_status: filters.read });
      }

      if (filters.minRating) {
        query = query.find({ user_rating: { $gte: filters.minRating } });
      }

      const books = await query.exec();
      return {
        success: true,
        message: 'Books retrieved successfully',
        data: books,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to retrieve books',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findOne(id: string): Promise<{
    success: boolean;
    message: string;
    data?: Book;
    error?: string;
  }> {
    try {
      const book = await this.bookModel.findById(id).exec();
      if (!book) {
        throw new HttpException(
          {
            success: false,
            message: 'Book not found',
            error: 'No book exists with this ID',
          },
          HttpStatus.NOT_FOUND,
        );
      }
      return {
        success: true,
        message: 'Book found successfully',
        data: book,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        {
          success: false,
          message: 'Failed to fetch book',
          error: error.message || 'An unexpected error occurred',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async update(
    id: string,
    updateBookDto: UpdateBookDto,
  ): Promise<{
    success: boolean;
    message: string;
    data?: Book;
    error?: string;
  }> {
    try {
      const book = await this.bookModel.findById(id).exec();
      if (!book) {
        throw new HttpException(
          {
            success: false,
            message: 'Book not found',
            error: 'No book exists with this ID',
          },
          HttpStatus.NOT_FOUND,
        );
      }

      if (updateBookDto.file_url) {
        if (book.file_url) {
          try {
            await this.uploadService.deleteFile(book.file_url);
          } catch (error) {
            console.warn('Failed to delete old file:', error.message);
          }
        }
      } else {
        // If no new file_url, keep the existing one
        delete updateBookDto.file_url;
      }

      const updatedBook = await this.bookModel
        .findByIdAndUpdate(id, updateBookDto, { new: true })
        .exec();

      return {
        success: true,
        message: 'Book updated successfully',
        data: updatedBook,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        {
          success: false,
          message: 'Failed to update book',
          error: error.message || 'An unexpected error occurred',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async remove(id: string): Promise<{ success: boolean; message: string }> {
    try {
      const book = await this.bookModel.findById(id).exec();
      if (!book) {
        throw new HttpException(
          {
            success: false,
            message: 'Book not found',
            error: 'No book exists with this ID',
          },
          HttpStatus.NOT_FOUND,
        );
      }

      // Delete the associated file if it exists
      if (book.file_url) {
        await this.uploadService.deleteFile(book.file_url);
      }

      await this.bookModel.findByIdAndDelete(id).exec();
      return {
        success: true,
        message: 'Book deleted successfully',
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        {
          success: false,
          message: 'Failed to delete book',
          error: error.message || 'An unexpected error occurred',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async searchBooks(
    query: string,
    searchBy: 'title' | 'author' | 'all' = 'all',
  ): Promise<{
    success: boolean;
    message: string;
    data?: Book[];
    error?: string;
  }> {
    try {
      let searchQuery = {};

      switch (searchBy) {
        case 'title':
          searchQuery = { title: new RegExp(query, 'i') };
          break;
        case 'author':
          searchQuery = { author: new RegExp(query, 'i') };
          break;
        case 'all':
        default:
          searchQuery = {
            $or: [
              { title: new RegExp(query, 'i') },
              { author: new RegExp(query, 'i') },
            ],
          };
      }

      const books = await this.bookModel.find(searchQuery).exec();

      return {
        success: true,
        message: 'Search completed successfully',
        data: books,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to search books',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async filterBooks(filters: {
    author?: string;
    read?: boolean;
    sortBy?: string;
    order?: 'asc' | 'desc';
  }): Promise<{
    success: boolean;
    message: string;
    data?: Book[];
    error?: string;
  }> {
    try {
      let query = this.bookModel.find();

      // Apply filters
      if (filters.author) {
        // Escape special characters and create a case-insensitive regex
        const escapedAuthor = filters.author.replace(
          /[.*+?^${}()|[\]\\]/g,
          '\\$&',
        );
        query = query.where('author', new RegExp(escapedAuthor, 'i'));
      }

      if (filters.read !== undefined) {
        query = query.where('read_status').equals(filters.read);
      }

      // Apply sorting
      if (filters.sortBy) {
        const sortOrder = filters.order === 'desc' ? -1 : 1;
        query = query.sort({ [filters.sortBy]: sortOrder });
      }

      const books = await query.exec();

      return {
        success: true,
        message: 'Books filtered successfully',
        data: books,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to filter books',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getSpecialBooks(): Promise<{
    success: boolean;
    message: string;
    data: {
      newArrivals: Book[];
      bestSellers: Book[];
      featuredBooks: Book[];
    };
  }> {
    try {
      const newArrivals = await this.bookModel
        .find()
        .sort({ createdAt: -1 })
        .limit(6)
        .exec();

      const bestSellers = await this.bookModel
        .find({ isBestSeller: true })
        .sort({ createdAt: -1 })
        .limit(6)
        .exec();

      const featuredBooks = await this.bookModel
        .find({ isFeatured: true })
        .sort({ createdAt: -1 })
        .limit(6)
        .exec();

      return {
        success: true,
        message: 'Special books retrieved successfully',
        data: {
          newArrivals,
          bestSellers,
          featuredBooks,
        },
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to retrieve special books',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getBooksByGenre(genre: string): Promise<{
    success: boolean;
    message: string;
    data?: Book[];
    error?: string;
  }> {
    try {
      const books = await this.bookModel.find({ genre }).exec();
      return {
        success: true,
        message: 'Books retrieved successfully',
        data: books,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to retrieve books by genre',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
