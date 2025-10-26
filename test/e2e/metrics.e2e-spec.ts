import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { Server } from 'http';

describe('MetricsController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /metrics/:username', () => {
    it('debe retornar métricas para un usuario válido (octocat)', () => {
      return request(app.getHttpServer() as Server)
        .get('/metrics/octocat')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('username', 'octocat');
          expect(res.body).toHaveProperty('metrics');
          expect(res.body.metrics).toHaveProperty('totalStars');
          expect(res.body.metrics).toHaveProperty('followersToReposRatio');
          expect(res.body.metrics).toHaveProperty('lastPushDaysAgo');

          expect(typeof res.body.metrics.totalStars).toBe('number');
          expect(typeof res.body.metrics.followersToReposRatio).toBe('number');
          expect(res.body.metrics.totalStars).toBeGreaterThanOrEqual(0);
          expect(res.body.metrics.followersToReposRatio).toBeGreaterThanOrEqual(
            0,
          );

          // lastPushDaysAgo puede ser null o number
          if (res.body.metrics.lastPushDaysAgo !== null) {
            expect(typeof res.body.metrics.lastPushDaysAgo).toBe('number');
            expect(res.body.metrics.lastPushDaysAgo).toBeGreaterThanOrEqual(0);
          }
        });
    }, 10000);

    it('debe retornar 404 para un usuario que no existe', () => {
      return request(app.getHttpServer() as Server)
        .get('/metrics/usuarioquenoexiste9999xyz')
        .expect(404)
        .expect((res) => {
          expect(res.body).toHaveProperty('statusCode', 404);
          expect(res.body).toHaveProperty('message');
          expect(res.body.message).toContain('not found');
        });
    }, 10000);

    it('debe retornar 400 para un username con formato inválido', () => {
      return request(app.getHttpServer() as Server)
        .get('/metrics/user@invalid!')
        .expect(400)
        .expect((res) => {
          expect(res.body).toHaveProperty('statusCode', 400);
          expect(res.body).toHaveProperty('message');
        });
    });

    it('debe cachear resultados (segunda llamada debe ser más rápida)', async () => {
      // Primera llamada (sin caché)
      const start1 = Date.now();
      await request(app.getHttpServer() as Server)
        .get('/metrics/octocat')
        .expect(200);
      const duration1 = Date.now() - start1;

      // Segunda llamada (con caché)
      const start2 = Date.now();
      await request(app.getHttpServer() as Server)
        .get('/metrics/octocat')
        .expect(200);
      const duration2 = Date.now() - start2;

      // La segunda debe ser significativamente más rápida
      expect(duration2).toBeLessThan(duration1);
      expect(duration2).toBeLessThan(100); // Menos de 100ms con caché
    }, 15000);

    it('debe retornar métricas con estructura correcta', () => {
      return request(app.getHttpServer() as Server)
        .get('/metrics/torvalds')
        .expect(200)
        .expect((res) => {
          const { body } = res;

          expect(body).toMatchObject({
            username: expect.any(String),
            metrics: {
              totalStars: expect.any(Number),
              followersToReposRatio: expect.any(Number),
              lastPushDaysAgo: expect.anything(), // null o number
            },
          });

          const ratio = body.metrics.followersToReposRatio;
          const decimals = ratio.toString().split('.')[1]?.length || 0;
          expect(decimals).toBeLessThanOrEqual(2);
        });
    }, 10000);
  });

  describe('Validación de parámetros', () => {
    it('debe rechazar usernames vacíos', () => {
      return request(app.getHttpServer() as Server)
        .get('/metrics/')
        .expect(404); // Not Found (ruta no existe)
    });

    it('debe aceptar usernames con guiones', () => {
      return request(app.getHttpServer() as Server)
        .get('/metrics/test-user')
        .expect((res) => {
          // Puede ser 200 (si existe) o 404 (si no existe)
          // pero no debe ser 400 (validación)
          expect([200, 404, 429, 503]).toContain(res.status);
        });
    });

    it('debe aceptar usernames con números', () => {
      return request(app.getHttpServer() as Server)
        .get('/metrics/user123')
        .expect((res) => {
          expect([200, 404, 429, 503]).toContain(res.status);
        });
    });
  });
});
