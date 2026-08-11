import {
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  RawBodyRequest,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { PaymentsService } from './payments.service';
import { CheckoutDto } from './dto/checkout.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentOrganizer } from '../../common/decorators/current-organizer.decorator';
import type { OrganizerJwtPayload } from '../auth/strategies/jwt.strategy';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('checkout')
  @UseGuards(JwtAuthGuard)
  createCheckout(
    @CurrentOrganizer() organizer: OrganizerJwtPayload,
    @Body() dto: CheckoutDto,
  ) {
    return this.paymentsService.createCheckout(organizer.sub, dto.packageType);
  }

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  processWebhook(
    @Req() request: RawBodyRequest<Request>,
    @Headers('stripe-signature') stripeSignature: string | undefined,
    @Headers('x-payment-webhook-signature') placeholderSignature: string | undefined,
  ) {
    const rawBody = request.rawBody;

    if (!rawBody) {
      throw new Error('Raw request body is required for payment webhooks');
    }

    return this.paymentsService.processWebhook(
      rawBody,
      stripeSignature ?? placeholderSignature,
    );
  }
}
