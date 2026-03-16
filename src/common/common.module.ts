import { Global, Module } from '@nestjs/common';
import { HttpExceptionFilter } from './filters';
import { StorageService } from './services';

@Global()
@Module({
    providers: [HttpExceptionFilter, StorageService],
    exports: [HttpExceptionFilter, StorageService],
})
export class CommonModule {}
