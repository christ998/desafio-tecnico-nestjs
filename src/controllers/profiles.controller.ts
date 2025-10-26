import { ProfileResponseDto } from '@application/dto/profile-response.dto';
import { GetProfileUseCase } from '@application/use-cases/get-profile.usecase';
import { ApiGitHubEndpoint } from '@decorators/api-github-endpoint.decorator';
import { UsernameDto } from '@dto/username.dto';
import { Controller, Get, Param, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('users')
@Controller('users')
export class ProfilesController {
  constructor(private readonly getProfileUseCase: GetProfileUseCase) {}

  @Get(':username')
  @ApiGitHubEndpoint({
    summary: 'Obtener perfil de usuario de GitHub',
    description: 'Devuelve información básica del perfil. Cache de 5 minutos.',
    responseType: ProfileResponseDto,
  })
  async getProfile(@Param() params: UsernameDto, @Req() req: Request) {
    const signal = req.signal;
    return this.getProfileUseCase.getProfile(params.username, signal);
  }
}
