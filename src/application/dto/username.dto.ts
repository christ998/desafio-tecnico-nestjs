import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class UsernameDto {
  @ApiProperty({
    description: 'Nombre de usuario de GitHub',
    example: 'christ998',
    minLength: 1,
    maxLength: 39,
  })
  @IsNotEmpty()
  @IsString()
  @Matches(/^[a-zA-Z0-9-]+$/, {
    message: 'Username can only contain alphanumeric characters and hyphens',
  })
  username: string;
}
