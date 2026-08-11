import { IsInt, Max, Min } from 'class-validator';

export class ConfigureTeamsDto {
  @IsInt()
  @Min(1)
  @Max(100)
  teamCount!: number;

  @IsInt()
  @Min(1)
  @Max(100)
  maxPlayersPerTeam!: number;
}
