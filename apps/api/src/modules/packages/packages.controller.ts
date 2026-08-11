import { Controller, Get, UseGuards } from '@nestjs/common';
import { PackagesService } from './packages.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentOrganizer } from '../../common/decorators/current-organizer.decorator';
import type { OrganizerJwtPayload } from '../auth/strategies/jwt.strategy';

@Controller('packages')
export class PackagesController {
  constructor(private readonly packagesService: PackagesService) {}

  @Get()
  listPackages() {
    return this.packagesService.listPackageDefinitions();
  }
}

@Controller('package-purchases')
export class PackagePurchasesController {
  constructor(private readonly packagesService: PackagesService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  listPurchases(@CurrentOrganizer() organizer: OrganizerJwtPayload) {
    return this.packagesService.listOrganizerPurchases(organizer.sub);
  }
}
