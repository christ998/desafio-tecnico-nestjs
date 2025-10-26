import { ApiProperty } from '@nestjs/swagger';

class MetricsDataDto {
  @ApiProperty({
    description:
      'Total de estrellas acumuladas en todos los repositorios públicos',
    example: 1340,
    minimum: 0,
  })
  totalStars: number;

  @ApiProperty({
    description: 'Relación entre seguidores y repositorios públicos',
    example: 21.5,
    minimum: 0,
  })
  followersToReposRatio: number;

  @ApiProperty({
    description: 'Días desde el último push en cualquier repositorio',
    example: 12,
    nullable: true,
    minimum: 0,
  })
  lastPushDaysAgo: number | null;
}

export class MetricsResponseDto {
  @ApiProperty({
    description: 'Nombre de usuario de GitHub',
    example: 'octocat',
  })
  username: string;

  @ApiProperty({
    description: 'Métricas calculadas del usuario',
    type: MetricsDataDto,
  })
  metrics: MetricsDataDto;
}
