import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Role } from '../role.enum';
import { Book } from '../../book/entities/book.entity';

@Schema({
  timestamps: true,
  toJSON: {
    transform: (_, ret) => {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      delete ret.password;
      return ret;
    },
  },
})
export class User extends Document {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true, enum: Role, default: Role.User })
  role: Role;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Book' }] })
  bookmarks: Types.ObjectId[]; // Ensure bookmarks is an array of ObjectId
}

export const UserSchema = SchemaFactory.createForClass(User);
