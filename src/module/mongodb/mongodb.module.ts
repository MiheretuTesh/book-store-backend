import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import * as dotenv from 'dotenv';

dotenv.config();

@Module({
  imports: [
    MongooseModule.forRoot(
      process.env.MONGODB_URL || 'mongodb://localhost:27017/book-library',
      {},
    ),
  ],
})
export class MongoDBModule {}
