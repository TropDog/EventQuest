import {
  Equals,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class JoinPlayerDto {
  @IsString()
  @IsNotEmpty()
  nickname!: string;

  @IsBoolean()
  @Equals(true, { message: 'Terms must be accepted' })
  termsAccepted!: boolean;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  avatarUrl?: string;
}
