import { Injectable, BadRequestException } from '@nestjs/common';
import cloudinary from '../../config/cloudinary.config';
import { join } from 'path';
import * as fs from 'fs/promises';

@Injectable()
export class UploadService {
  private readonly uploadDir = join(process.cwd(), 'uploads');

  constructor() {
    this.ensureUploadDir();
  }

  private async ensureUploadDir() {
    try {
      await fs.access(this.uploadDir);
    } catch {
      await fs.mkdir(this.uploadDir, { recursive: true });
    }
  }

  async uploadFile(file: Express.Multer.File): Promise<string | null> {
    if (!file) {
      return null;
    }

    try {

      const b64 = Buffer.from(file.buffer).toString('base64');
      const dataURI = `data:${file.mimetype};base64,${b64}`;
            
      const result = await cloudinary.uploader.upload(dataURI, {
        resource_type: 'auto',
        folder: 'book-library',
      });

      return result.secure_url;
    } catch (error) {
      throw new BadRequestException(`Failed to upload file to Cloudinary: ${error.message}`);
    }
  }

  async uploadToCloudinary(file: Express.Multer.File) {
    try {
      const result = await cloudinary.uploader.upload(file.path, {
        folder: 'book-library',
        resource_type: 'auto',
      });
      
      await fs.unlink(file.path);
      
      return {
        url: result.secure_url,
        publicId: result.public_id,
      };
    } catch (error) {
      throw new BadRequestException('Failed to upload file to Cloudinary');
    }
  }

  async deleteFile(fileUrl: string): Promise<void> {
    if (!fileUrl) return;

    const fileName = fileUrl.split('/').pop();
    const filePath = join(this.uploadDir, fileName);

    try {
      await fs.unlink(filePath);
    } catch (error) {
      if (error.code === 'ENOENT') {
        return;
      }

      throw new BadRequestException(`Failed to delete file: ${error.message}`);
    }
  }
}
