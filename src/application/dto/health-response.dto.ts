import { ApiProperty } from '@nestjs/swagger';

export class HealthResponseDto {
  @ApiProperty({
    description: 'Estado del servicio',
    example: 'ok',
    enum: ['ok', 'error'],
  })
  status: string;

  @ApiProperty({
    description: 'Timestamp de la verificación',
    example: '2025-10-22T15:30:00.000Z',
  })
  timestamp: string;
}
