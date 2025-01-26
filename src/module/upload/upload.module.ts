import { Module } from '@nestjs/common';
import { UploadService } from './upload.service';

@Module({
  providers: [UploadService],
  exports: [UploadService], // Export the service so it can be used in other modules
})
export class UploadModule {}
