import { Global, Module } from '@nestjs/common';
import { HttpExceptionFilter } from './filters';
import { StorageService, TimezoneService } from './services';

@Global()
@Module({
    providers: [HttpExceptionFilter, StorageService, TimezoneService],
    exports: [HttpExceptionFilter, StorageService, TimezoneService],
})
export class CommonModule {}
