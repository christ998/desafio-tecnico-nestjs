import { CachePort } from '@domain/ports/cache.port';
import { Injectable, Logger } from '@nestjs/common';

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

@Injectable()
export class MemoryCacheAdapter implements CachePort {
  private readonly logger = new Logger(MemoryCacheAdapter.name);
  private readonly cache = new Map<string, CacheEntry<any>>();

  /**
   * ¿Por qué retorna Promise?
   * - El puerto CachePort está diseñado para poder usar backends remotos (ej Redis) que son asíncronos.
   * - Mantener una API async permite cambiar esta implementación in-memory por una remota sin tocar a los consumidores.
   * - Resolvemos de inmediato con Promise.resolve para respetar la implementación del puerto.
   */
  get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key);

    if (!entry) {
      return Promise.resolve(null);
    }

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.logger.debug(`Cache expired for key: ${key}`);
      return Promise.resolve(null);
    }

    this.logger.debug(`Cache hit for key: ${key}`);
    return Promise.resolve(entry.value);
  }

  set<T>(key: string, value: T, ttl: number): Promise<void> {
    if (ttl <= 0) {
      this.cache.delete(key);
      this.logger.debug(`Cache delete for key: ${key} (ttl<=0)`);
      return Promise.resolve();
    }
    const expiresAt = Date.now() + ttl * 1000;
    this.cache.set(key, { value, expiresAt });
    this.logger.debug(`Cache set for key: ${key}, TTL: ${ttl}s`);
    return Promise.resolve();
  }
}
