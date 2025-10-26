import { HealthResponseDto } from '@application/dto/health-response.dto';
import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse } from '@nestjs/swagger';

@ApiTags('health')
@Controller('health')
export class HealthController {
  @Get()
  @ApiOperation({
    summary: 'Verificar estado del servicio',
    description: 'Endpoint para verificar que el servicio está funcionando',
  })
  @ApiOkResponse({
    description: 'El servicio está funcionando correctamente',
    type: HealthResponseDto,
  })
  check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
