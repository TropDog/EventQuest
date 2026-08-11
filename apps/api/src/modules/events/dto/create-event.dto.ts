import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { EventStatus, GameMode } from '@eventquest/shared';

export class CreateEventDto {
  @IsString()
  @IsNotEmpty()
  packagePurchaseId!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  eventType!: string;

  @IsOptional()
  @IsEnum(GameMode)
  gameMode?: GameMode;
}

export class UpdateEventDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  eventType?: string;

  @IsOptional()
  @IsEnum(GameMode)
  gameMode?: GameMode;

  @IsOptional()
  @IsString()
  startsAt?: string;

  @IsOptional()
  @IsEnum(EventStatus)
  status?: EventStatus.CONFIGURED;
}
