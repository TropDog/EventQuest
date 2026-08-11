import { IsBoolean, IsEmail, IsNotEmpty, IsString, Equals } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email!: string;

  @IsString()
  @IsNotEmpty()
  password!: string;

  @IsBoolean()
  @Equals(true, { message: 'Terms must be accepted' })
  termsAccepted!: boolean;
}
