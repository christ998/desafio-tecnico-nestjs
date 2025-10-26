import { ApiProperty } from '@nestjs/swagger';

export class ProfileResponseDto {
  @ApiProperty({
    description: 'Nombre de usuario de GitHub',
    example: 'octocat',
  })
  username: string;

  @ApiProperty({
    description: 'Nombre completo del usuario',
    example: 'The Octocat',
    nullable: true,
  })
  fullName: string | null;

  @ApiProperty({
    description: 'URL del avatar del usuario',
    example: 'https://avatars.githubusercontent.com/u/583231',
  })
  avatar: string;

  @ApiProperty({
    description: 'Biografía del usuario',
    example: 'GitHub mascot and friendly octopus',
    nullable: true,
  })
  bio: string | null;

  @ApiProperty({
    description: 'Número de repositorios públicos',
    example: 8,
    minimum: 0,
  })
  publicRepos: number;

  @ApiProperty({
    description: 'Número de seguidores',
    example: 9000,
    minimum: 0,
  })
  followers: number;

  @ApiProperty({
    description: 'URL del perfil de GitHub',
    example: 'https://github.com/octocat',
  })
  profileUrl: string;
}
