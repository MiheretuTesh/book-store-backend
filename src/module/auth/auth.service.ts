import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { Role } from './role.enum';
import { Book } from '../book/entities/book.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Book.name) private bookModel: Model<Book>,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { email, password, name, role } = registerDto;

    // Check if user exists
    const existingUser = await this.userModel.findOne({ email });
    if (existingUser) {
      throw new UnauthorizedException('Email already registered');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const user = await this.userModel.create({
      email,
      password: hashedPassword,
      name,
      role: role || Role.User,
      bookmarks: [], // Initialize bookmarks as an empty array
    });

    // Generate JWT token
    const token = this.jwtService.sign({ userId: user._id, role: user.role });

    return {
      success: true,
      message: 'User registered successfully',
      data: {
        user,
        token,
      },
    };
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // Find user
    const user = await this.userModel.findOne({ email });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate JWT token
    const token = this.jwtService.sign({ userId: user._id });

    return {
      success: true,
      message: 'Login successful',
      data: {
        user,
        token,
      },
    };
  }

  async validateUser(userId: string) {
    return this.userModel.findById(userId);
  }

  async getUserWithBookmarks(userId: string) {
    return this.userModel.findById(userId).populate({
      path: 'bookmarks',
      select: 'title author isbn read_status description imageUrl',
      model: 'Book',
    });
  }

  async addBookmark(userId: string, bookId: string) {
    if (!userId) {
      throw new NotFoundException('User ID is required');
    }

    console.log(`Adding bookmark for userId: ${userId}, bookId: ${bookId}`);

    const user = await this.userModel.findById(userId);
    if (!user) {
      console.log(`User not found: ${userId}`);
      throw new NotFoundException('User not found');
    }

    const book = await this.bookModel.findById(bookId);
    if (!book) {
      throw new NotFoundException('Book not found');
    }

    user.bookmarks.push(book._id as Types.ObjectId);
    await user.save();

    return {
      success: true,
      message: 'Book added to bookmarks',
      data: {
        user,
        bookmarks: user.bookmarks,
      },
    };
  }

  async removeBookmark(userId: string, bookId: string): Promise<any> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    user.bookmarks = user.bookmarks.filter((id) => id.toString() !== bookId);
    await user.save();
    return user;
  }
}
