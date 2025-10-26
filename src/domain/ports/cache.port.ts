export interface CachePort {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttl: number): Promise<void>;
}

export const CACHE_PORT = Symbol('CACHE_PORT');
