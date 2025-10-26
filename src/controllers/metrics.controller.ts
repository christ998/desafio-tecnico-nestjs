import { MetricsResponseDto } from '@application/dto/metrics-response.dto';
import { ApiGitHubEndpoint } from '@decorators/api-github-endpoint.decorator';
import { GitHubMetrics } from '@domain/models/github-metrics.model';
import { Controller, Get, Param, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { UsernameDto } from '@dto/username.dto';
import { GetMetricsUseCase } from '@application/use-cases/get-metrics.usecase';

@ApiTags('metrics')
@Controller('metrics')
export class MetricsController {
  constructor(private readonly getMetricsUseCase: GetMetricsUseCase) {}

  @Get(':username')
  @ApiGitHubEndpoint({
    summary: 'Calcular métricas de usuario de GitHub',
    description:
      'Calcula totalStars, followersToReposRatio y lastPushDaysAgo. Cache de 5 minutos.',
    responseType: MetricsResponseDto,
  })
  async getMetrics(
    @Param() params: UsernameDto,
    @Req() req: Request,
  ): Promise<GitHubMetrics> {
    const signal = req.signal;
    return this.getMetricsUseCase.getMetrics(params.username, signal);
  }
}
