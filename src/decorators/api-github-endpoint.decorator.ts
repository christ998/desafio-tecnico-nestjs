import { applyDecorators, Type } from '@nestjs/common';
import {
  ApiOperation,
  ApiParam,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiTooManyRequestsResponse,
  ApiServiceUnavailableResponse,
} from '@nestjs/swagger';

interface ApiGitHubEndpointOptions {
  summary: string;
  description: string;
  responseType: Type<unknown>;
}

export function ApiGitHubEndpoint(options: ApiGitHubEndpointOptions) {
  return applyDecorators(
    ApiOperation({
      summary: options.summary,
      description: options.description,
    }),
    ApiParam({
      name: 'username',
      description: 'Nombre de usuario de GitHub',
      example: 'christ998',
    }),
    ApiOkResponse({
      description: 'Operación exitosa',
      type: options.responseType,
    }),
    ApiBadRequestResponse({
      description: 'Username inválido',
      schema: {
        type: 'object',
        properties: {
          statusCode: { type: 'number', example: 400 },
          timestamp: { type: 'string', example: '2025-10-22T15:30:00.000Z' },
          path: { type: 'string', example: '/metrics/user@invalid' },
          method: { type: 'string', example: 'GET' },
          message: {
            type: 'array',
            items: { type: 'string' },
            example: [
              'Username can only contain alphanumeric characters and hyphens',
            ],
          },
        },
      },
    }),
    ApiNotFoundResponse({
      description: 'Usuario no encontrado',
      schema: {
        type: 'object',
        properties: {
          statusCode: { type: 'number', example: 404 },
          timestamp: { type: 'string', example: '2025-10-22T15:30:00.000Z' },
          path: { type: 'string', example: '/metrics/usuarionoexiste' },
          method: { type: 'string', example: 'GET' },
          message: {
            type: 'string',
            example: "GitHub user 'usuarionoexiste' not found",
          },
        },
      },
    }),
    ApiTooManyRequestsResponse({
      description: 'Rate limit excedido',
      schema: {
        type: 'object',
        properties: {
          statusCode: { type: 'number', example: 429 },
          timestamp: { type: 'string', example: '2025-10-22T15:30:00.000Z' },
          path: { type: 'string', example: '/metrics/christ998' },
          method: { type: 'string', example: 'GET' },
          message: {
            type: 'string',
            example: 'GitHub API rate limit exceeded',
          },
        },
      },
    }),
    ApiServiceUnavailableResponse({
      description: 'GitHub API no disponible',
      schema: {
        type: 'object',
        properties: {
          statusCode: { type: 'number', example: 503 },
          timestamp: { type: 'string', example: '2025-10-22T15:30:00.000Z' },
          path: { type: 'string', example: '/metrics/christ998' },
          method: { type: 'string', example: 'GET' },
          message: { type: 'string', example: 'GitHub API is unavailable' },
        },
      },
    }),
  );
}
