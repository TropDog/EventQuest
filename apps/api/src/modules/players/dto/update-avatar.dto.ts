import { IsOptional, IsString } from 'class-validator';

export class UpdateAvatarDto {
  @IsOptional()
  @IsString()
  avatarUrl?: string | null;
}
