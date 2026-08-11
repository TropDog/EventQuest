import { Module } from '@nestjs/common';
import { PackagesController, PackagePurchasesController } from './packages.controller';
import { PackagesService } from './packages.service';
import { PackagesRepository } from './packages.repository';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [PackagesController, PackagePurchasesController],
  providers: [PackagesService, PackagesRepository],
  exports: [PackagesService, PackagesRepository],
})
export class PackagesModule {}
