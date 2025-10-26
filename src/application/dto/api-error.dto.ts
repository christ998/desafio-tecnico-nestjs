import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ApiErrorDto {
  @ApiProperty({
    description: 'Código de estado HTTP',
    example: 404,
  })
  statusCode: number;

  @ApiProperty({
    description: 'Timestamp del error',
    example: '2025-10-22T15:30:00.000Z',
  })
  timestamp: string;

  @ApiProperty({
    description: 'Ruta del endpoint',
    example: '/metrics/octocat',
  })
  path: string;

  @ApiProperty({
    description: 'Método HTTP',
    example: 'GET',
  })
  method: string;

  @ApiProperty({
    description: 'Mensaje del error',
    example: 'GitHub user not found',
  })
  message: string;

  @ApiPropertyOptional({
    description: 'Código de error interno',
    example: 'USER_NOT_FOUND',
  })
  errorCode?: string;

  @ApiPropertyOptional({
    description: 'Tiempo de espera para retry (429)',
    example: 3600,
  })
  retryAfter?: number;

  @ApiPropertyOptional({
    description: 'Sugerencia para resolver el error',
    example: 'Configure GITHUB_TOKEN',
  })
  suggestion?: string;
}
