import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { MongoDBModule } from './module/mongodb/mongodb.module';
import { BookModule } from './module/book/book.module';
import { UploadModule } from './module/upload/upload.module';
import { AuthModule } from './module/auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRoot(process.env.MONGODB_URL || 'mongodb://localhost:27017/book-library'),
    MongoDBModule,
    BookModule,
    UploadModule,
    AuthModule,
  ],
})
export class AppModule {}
