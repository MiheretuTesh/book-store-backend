import { Body, Controller, Post, Get, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Request } from 'express';
import { JwtService } from '@nestjs/jwt';
import { Types } from 'mongoose';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly jwtService: JwtService,
  ) {}

  @Post('/register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User successfully registered' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('/login')
  @ApiOperation({ summary: 'Login user' })
  @ApiResponse({ status: 200, description: 'User successfully logged in' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  private extractUserIdFromToken(req: Request): string {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
      throw new Error('Token not found');
    }
    const decoded = this.jwtService.decode(token) as { userId: string };
    return decoded.userId;
  }

  @UseGuards(JwtAuthGuard)
  @Get('user/bookmarks')
  async getUserWithBookmarks(@Req() req: Request) {
    const userId = this.extractUserIdFromToken(req);
    return this.authService.getUserWithBookmarks(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('user/bookmarks')
  @ApiOperation({ summary: 'Add or remove a book from user bookmarks' })
  @ApiResponse({
    status: 200,
    description: 'Book added or removed from bookmarks',
  })
  @ApiResponse({ status: 404, description: 'User or Book not found' })
  async addBookmark(@Req() req: Request, @Body('bookId') bookId: string) {
    const userId = this.extractUserIdFromToken(req);
    const user = await this.authService.getUserWithBookmarks(userId);
    const bookmarks = user.bookmarks.map((id) => id.toString());
    if (bookmarks.includes(bookId)) {
      return this.authService.removeBookmark(userId, bookId);
    } else {
      return this.authService.addBookmark(userId, bookId);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('user/bookmarks/add')
  @ApiOperation({
    summary: 'Add or remove a book from user bookmarks using JSON body',
  })
  @ApiResponse({
    status: 200,
    description: 'Book added or removed from bookmarks',
  })
  @ApiResponse({ status: 404, description: 'User or Book not found' })
  async addBookmarkWithJson(
    @Req() req: Request,
    @Body() body: { bookId: string },
  ) {
    const userId = this.extractUserIdFromToken(req);
    const user = await this.authService.getUserWithBookmarks(userId);
    const bookmarks = user.bookmarks.map((id) => id.toString());
    if (bookmarks.includes(body.bookId)) {
      return this.authService.removeBookmark(userId, body.bookId);
    } else {
      return this.authService.addBookmark(userId, body.bookId);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('user/bookmarks/get')
  @ApiOperation({ summary: 'Get user bookmarks using JSON body' })
  @ApiResponse({ status: 200, description: 'User bookmarks retrieved' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserBookmarksWithJson(@Req() req: Request) {
    const userId = this.extractUserIdFromToken(req);
    return this.authService.getUserWithBookmarks(userId);
  }
}
