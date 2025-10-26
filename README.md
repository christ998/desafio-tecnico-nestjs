# GitHub Metrics API

Microservicio REST para calcular métricas de perfiles de GitHub construido con NestJS y arquitectura hexagonal.

## Setup

### Prerrequisitos

- Node.js >= 18
- npm >= 9

### Instalación

```bash
# Instalar dependencias
npm install
```

### Variables de Entorno

Crear archivo .env en la raíz del proyecto:

```bash
# Puerto del servidor (opcional, default: 3000)
PORT=3000

# Token de GitHub (opcional pero recomendado para evitar rate limits)
GITHUB_TOKEN=ghp_your_github_personal_access_token_here

# User Agent para requests a GitHub API (opcional)
USER_AGENT=github-metrics-service
```

### Ejecutar

```bash
# Desarrollo
npm run start:dev

# Producción
npm run build
npm run start:prod
```

El servidor estará en `http://localhost:3000`

## Ejemplos cURL

### Health Check

```bash
curl http://localhost:3000/health
```

### Obtener Perfil

```bash
curl http://localhost:3000/profiles/christ998
```

**Response:**
```json
{
  "login": "christ998",
  "fullName": null,
  "avatar_url": "https://avatars.githubusercontent.com/u/37342630?v=4",
  "bio": "Ingeniero Civil Informático",
  "public_repos": 17,
  "followers": 1,
  "following": 3,
  "profile_url": "https://github.com/christ998",
  "created_at": "2018-03-13T16:03:27Z",
  "updated_at": "2025-05-08T18:27:02Z"
}
```

### Obtener Métricas

```bash
curl http://localhost:3000/metrics/christ998
```

**Response:**
```json
{
  "username": "christ998",
  "metrics": {
    "totalStars": 1,
    "followersToReposRatio": 0.06,
    "lastPushDaysAgo": 0
  }
}
```

### Más ejemplos

```bash
# Usuario con muchos repos
curl http://localhost:3000/metrics/torvalds

# Usuario con guiones
curl http://localhost:3000/profiles/user-123

# Con headers verbose
curl -v http://localhost:3000/metrics/octocat

# Usuario no encontrado (404)
curl http://localhost:3000/metrics/userdoesntexist

# Username inválido (400)
curl http://localhost:3000/profiles/user@invalid!
```

## Testing

### Ejecutar

```bash
# Test unitarios
npm run test

# Test E2E
npm run test:e2e
```

## Documentación

Swagger UI disponible en: `http://localhost:3000/api/docs`