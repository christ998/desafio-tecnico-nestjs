import { Test, TestingModule } from '@nestjs/testing';
import { GITHUB_PORT, GitHubPort } from '@domain/ports/github.port';
import { CACHE_PORT, CachePort } from '@domain/ports/cache.port';
import { GitHubProfile } from '@domain/models/github-profile.model';
import { GitHubMetrics } from '@domain/models/github-metrics.model';
import { GetMetricsUseCase } from '@application/use-cases/get-metrics.usecase';
import { GitHubRepository } from '@domain/models/github-repo.model';

describe('GetMetricsUseCase', () => {
  let useCase: GetMetricsUseCase;
  let mockGitHubPort: jest.Mocked<GitHubPort>;
  let mockCachePort: jest.Mocked<CachePort>;

  beforeEach(async () => {
    mockGitHubPort = {
      getUserProfile: jest.fn(),
      getUserRepositories: jest.fn(),
    };

    mockCachePort = {
      get: jest.fn(),
      set: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetMetricsUseCase,
        {
          provide: GITHUB_PORT,
          useValue: mockGitHubPort,
        },
        {
          provide: CACHE_PORT,
          useValue: mockCachePort,
        },
      ],
    }).compile();

    useCase = module.get<GetMetricsUseCase>(GetMetricsUseCase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Cálculo de métricas', () => {
    it('debe calcular métricas correctamente para un usuario válido', async () => {
      const mockProfile: GitHubProfile = {
        login: 'octocat',
        fullName: 'The Octocat',
        avatar_url: 'https://avatars.githubusercontent.com/u/583231',
        bio: 'GitHub mascot',
        public_repos: 8,
        followers: 9000,
        profile_url: 'https://github.com/octocat',
        following: 0,
        created_at: '',
        updated_at: '',
      };

      const mockRepos: GitHubRepository[] = [
        { name: 'Hello-World', stars: 1500, pushedAt: '2025-10-20T10:00:00Z' },
        { name: 'Spoon-Knife', stars: 12000, pushedAt: '2025-10-15T10:00:00Z' },
        {
          name: 'octocat.github.io',
          stars: 150,
          pushedAt: '2025-10-10T10:00:00Z',
        },
      ];

      mockCachePort.get.mockResolvedValue(null);
      mockGitHubPort.getUserProfile.mockResolvedValue(mockProfile);
      mockGitHubPort.getUserRepositories.mockResolvedValue(mockRepos);

      const result = await useCase.getMetrics('octocat');

      expect(result).toEqual({
        username: 'octocat',
        metrics: {
          totalStars: 13650, // 1500 + 12000 + 150
          followersToReposRatio: 1125, // 9000 / 8
          lastPushDaysAgo: expect.any(Number) as unknown,
        },
      });

      expect(typeof result.metrics.lastPushDaysAgo).toBe('number');

      expect(mockGitHubPort.getUserProfile).toHaveBeenCalledWith(
        'octocat',
        undefined,
      );
      expect(mockGitHubPort.getUserRepositories).toHaveBeenCalledWith(
        'octocat',
        undefined,
      );
      expect(mockCachePort.set).toHaveBeenCalledWith(
        'metrics:octocat',
        expect.any(Object),
        300,
      );
    });

    it('debe calcular totalStars como suma de todas las estrellas', async () => {
      const mockProfile: GitHubProfile = {
        login: 'testuser',
        fullName: 'Test User',
        avatar_url: 'https://avatar.url',
        bio: 'Test bio',
        public_repos: 3,
        followers: 100,
        profile_url: 'https://github.com/testuser',
        following: 0,
        created_at: '',
        updated_at: '',
      };

      const mockRepos: GitHubRepository[] = [
        { name: 'repo1', stars: 50, pushedAt: '2025-10-20T10:00:00Z' },
        { name: 'repo2', stars: 30, pushedAt: '2025-10-15T10:00:00Z' },
        { name: 'repo3', stars: 20, pushedAt: '2025-10-10T10:00:00Z' },
      ];

      mockCachePort.get.mockResolvedValue(null);
      mockGitHubPort.getUserProfile.mockResolvedValue(mockProfile);
      mockGitHubPort.getUserRepositories.mockResolvedValue(mockRepos);

      const result = await useCase.getMetrics('testuser');

      expect(result.metrics.totalStars).toBe(100); // 50 + 30 + 20
    });

    it('debe calcular followersToReposRatio con 2 decimales', async () => {
      const mockProfile: GitHubProfile = {
        login: 'testuser',
        fullName: 'Test User',
        avatar_url: 'https://avatar.url',
        bio: 'Test bio',
        public_repos: 3,
        followers: 100,
        profile_url: 'https://github.com/testuser',
        following: 0,
        created_at: '',
        updated_at: '',
      };

      const mockRepos: GitHubRepository[] = [
        { name: 'repo1', stars: 10, pushedAt: '2025-10-20T10:00:00Z' },
      ];

      mockCachePort.get.mockResolvedValue(null);
      mockGitHubPort.getUserProfile.mockResolvedValue(mockProfile);
      mockGitHubPort.getUserRepositories.mockResolvedValue(mockRepos);

      const result = await useCase.getMetrics('testuser');

      expect(result.metrics.followersToReposRatio).toBe(33.33); // 100 / 3 = 33.33
    });

    it('debe retornar 0 en followersToReposRatio cuando publicRepos es 0', async () => {
      const mockProfile: GitHubProfile = {
        login: 'newuser',
        fullName: 'New User',
        avatar_url: 'https://avatar.url',
        bio: null,
        public_repos: 0,
        followers: 50,
        profile_url: 'https://github.com/newuser',
        following: 0,
        created_at: '',
        updated_at: '',
      };

      const mockRepos: GitHubRepository[] = [];

      mockCachePort.get.mockResolvedValue(null);
      mockGitHubPort.getUserProfile.mockResolvedValue(mockProfile);
      mockGitHubPort.getUserRepositories.mockResolvedValue(mockRepos);

      const result = await useCase.getMetrics('newuser');

      expect(result.metrics.followersToReposRatio).toBe(0);
    });

    it('debe retornar null en lastPushDaysAgo cuando no hay repos con push dates', async () => {
      const mockProfile: GitHubProfile = {
        login: 'testuser',
        fullName: 'Test User',
        avatar_url: 'https://avatar.url',
        bio: 'Test bio',
        public_repos: 2,
        followers: 50,
        profile_url: 'https://github.com/testuser',
        following: 0,
        created_at: '',
        updated_at: '',
      };

      const mockRepos: GitHubRepository[] = [
        { name: 'repo1', stars: 10, pushedAt: null },
        { name: 'repo2', stars: 5, pushedAt: null },
      ];

      mockCachePort.get.mockResolvedValue(null);
      mockGitHubPort.getUserProfile.mockResolvedValue(mockProfile);
      mockGitHubPort.getUserRepositories.mockResolvedValue(mockRepos);

      const result = await useCase.getMetrics('testuser');

      expect(result.metrics.lastPushDaysAgo).toBeNull();
    });

    it('debe calcular lastPushDaysAgo basado en el push más reciente', async () => {
      const mockProfile: GitHubProfile = {
        login: 'testuser',
        fullName: 'Test User',
        avatar_url: 'https://avatar.url',
        bio: 'Test bio',
        public_repos: 3,
        followers: 50,
        profile_url: 'https://github.com/testuser',
        following: 0,
        created_at: '',
        updated_at: '',
      };

      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const mockRepos: GitHubRepository[] = [
        { name: 'repo1', stars: 10, pushedAt: sevenDaysAgo.toISOString() },
        { name: 'repo2', stars: 5, pushedAt: threeDaysAgo.toISOString() }, // Más reciente
        { name: 'repo3', stars: 2, pushedAt: null },
      ];

      mockCachePort.get.mockResolvedValue(null);
      mockGitHubPort.getUserProfile.mockResolvedValue(mockProfile);
      mockGitHubPort.getUserRepositories.mockResolvedValue(mockRepos);

      const result = await useCase.getMetrics('testuser');

      expect(result.metrics.lastPushDaysAgo).toBe(3); // Debe ser 3 días
    });
  });

  describe('Caché', () => {
    it('debe retornar datos del caché si existen', async () => {
      const cachedMetrics: GitHubMetrics = {
        username: 'octocat',
        metrics: {
          totalStars: 1000,
          followersToReposRatio: 20.5,
          lastPushDaysAgo: 5,
        },
      };

      mockCachePort.get.mockResolvedValue(cachedMetrics);

      const result = await useCase.getMetrics('octocat');

      expect(result).toEqual(cachedMetrics);
      expect(mockGitHubPort.getUserProfile).not.toHaveBeenCalled();
      expect(mockGitHubPort.getUserRepositories).not.toHaveBeenCalled();
      expect(mockCachePort.set).not.toHaveBeenCalled();
    });

    it('debe guardar en caché con TTL de 300 segundos', async () => {
      const mockProfile: GitHubProfile = {
        login: 'testuser',
        fullName: 'Test User',
        avatar_url: 'https://avatar.url',
        bio: 'Test bio',
        public_repos: 1,
        followers: 10,
        profile_url: 'https://github.com/testuser',
        following: 0,
        created_at: '',
        updated_at: '',
      };

      const mockRepos: GitHubRepository[] = [
        { name: 'repo1', stars: 5, pushedAt: '2025-10-20T10:00:00Z' },
      ];

      mockCachePort.get.mockResolvedValue(null);
      mockGitHubPort.getUserProfile.mockResolvedValue(mockProfile);
      mockGitHubPort.getUserRepositories.mockResolvedValue(mockRepos);

      await useCase.getMetrics('testuser');

      expect(mockCachePort.set).toHaveBeenCalledWith(
        'metrics:testuser',
        expect.any(Object),
        300, // TTL de 5 minutos
      );
    });
  });

  describe('Manejo de errores', () => {
    it('debe propagar errores del GitHubPort', async () => {
      const error = new Error('GitHub API error');
      mockCachePort.get.mockResolvedValue(null);
      mockGitHubPort.getUserProfile.mockRejectedValue(error);

      await expect(useCase.getMetrics('testuser')).rejects.toThrow(
        'GitHub API error',
      );
      expect(mockCachePort.set).not.toHaveBeenCalled();
    });

    it('debe propagar errores del CachePort', async () => {
      const error = new Error('Cache error');
      mockCachePort.get.mockRejectedValue(error);

      await expect(useCase.getMetrics('testuser')).rejects.toThrow(
        'Cache error',
      );
      expect(mockGitHubPort.getUserProfile).not.toHaveBeenCalled();
    });
  });
});
