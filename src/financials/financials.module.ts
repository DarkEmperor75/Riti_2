import { Module } from '@nestjs/common';
import { FinancialsService } from './services';

@Module({
    providers: [FinancialsService],
    exports: [FinancialsService],
})
export class FinancialsModule {}
