import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class ChangeTeamNameDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;
}
