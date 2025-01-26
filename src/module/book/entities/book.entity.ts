import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({
  timestamps: true,
  toJSON: {
    transform: (_, ret) => {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  },
})
export class Book extends Document {
  @Prop({ required: true, index: true })
  title: string;

  @Prop({ required: true, index: true })
  author: string;

  @Prop({ required: true, unique: true })
  isbn: string;

  @Prop({ default: false })
  read_status: boolean;

  @Prop({ min: 1, max: 5 })
  user_rating: number;

  @Prop()
  notes: string;

  @Prop()
  file_url: string;

  @Prop({
    required: true,
    default: () => new Date(),
    set: (value: any) => String(value),
  })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export const BookSchema = SchemaFactory.createForClass(Book);

BookSchema.index({ title: 'text', author: 'text', notes: 'text' });
