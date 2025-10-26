import {
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
  HttpException,
  HttpStatus,
  Logger,
  RequestTimeoutException,
} from '@nestjs/common';
import { AxiosError } from 'axios';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { catchError, firstValueFrom, throwError, timeout } from 'rxjs';
import { GitHubRepository } from '@domain/models/github-repo.model';
import { GitHubPort } from '@domain/ports/github.port';
import { GitHubProfile } from '@domain/models/github-profile.model';
import {
  GitHubRepoResponse,
  GitHubUserResponse,
} from './interfaces/github-api.interface';

@Injectable()
export class GitHubHttpAdapter implements GitHubPort {
  private readonly logger = new Logger(GitHubHttpAdapter.name);
  private readonly baseUrl = 'https://api.github.com';
  private readonly headers: Record<string, string>;
  private readonly requestTimeout = 5000;
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    const token = this.configService.get<string>('GITHUB_TOKEN');
    const userAgent = this.configService.get<string>(
      'USER_AGENT',
      'github-metrics-service',
    );

    this.headers = {
      'User-Agent': userAgent,
      Accept: 'application/vnd.github.v3+json',
    };

    if (token) {
      this.headers['Authorization'] = `token ${token}`;
    }
  }

  async getUserProfile(
    username: string,
    signal?: AbortSignal,
  ): Promise<GitHubProfile> {
    try {
      const { data } = await firstValueFrom(
        this.httpService
          .get<GitHubUserResponse>(`${this.baseUrl}/users/${username}`, {
            headers: this.headers,
            signal,
          })
          .pipe(
            timeout(this.requestTimeout),
            catchError((error: unknown) => {
              // Detectar si es timeout de rxjs
              if (error && typeof error === 'object' && 'name' in error) {
                const err = error as { name: string };
                if (err.name === 'TimeoutError') {
                  this.logger.error(
                    `Request timeout for user: ${username} (${this.requestTimeout}ms)`,
                  );
                  throw new RequestTimeoutException(
                    `Request timeout after ${this.requestTimeout}ms`,
                  );
                }
              }
              return throwError(() => error);
            }),
          ),
      );

      return {
        login: data.login,
        fullName: data.name,
        avatar_url: data.avatar_url,
        bio: data.bio,
        public_repos: data.public_repos,
        followers: data.followers,
        following: data.following,
        profile_url: data.html_url,
        created_at: data.created_at,
        updated_at: data.updated_at,
      };
    } catch (error: any) {
      this.handleError(error, username);
    }
  }

  async getUserRepositories(
    username: string,
    signal?: AbortSignal,
  ): Promise<GitHubRepository[]> {
    try {
      const response = await firstValueFrom(
        this.httpService.get<GitHubRepoResponse[]>(
          `${this.baseUrl}/users/${username}/repos?per_page=100`,
          {
            headers: this.headers,
            signal,
          },
        ),
      );

      return response.data.map((repo: GitHubRepoResponse) => ({
        name: repo.name,
        stars: repo.stargazers_count,
        pushedAt: repo.pushed_at,
      }));
    } catch (error: any) {
      this.handleError(error, username);
    }
  }

  private handleError(error: any, username: string): never {
    if (this.isCancelError(error)) {
      this.logger.warn(`Request cancelled for user: ${username}`);
      throw new HttpException('Request was cancelled', 499); // 499 = Client Closed Request
    }

    if (error instanceof RequestTimeoutException) {
      throw error;
    }

    if (error.response) {
      const status = error.response.status;

      if (status === 404) {
        this.logger.warn(`User not found: ${username}`);
        throw new NotFoundException(`GitHub user '${username}' not found`);
      }

      if (status === 403 || status === 429) {
        this.logger.error('GitHub rate limit exceeded');
        throw new HttpException(
          'GitHub API rate limit exceeded',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
    }

    this.logger.error(`GitHub API error for user ${username}:`, error.message);
    throw new ServiceUnavailableException('GitHub API is unavailable');
  }

  private isAxiosError(error: unknown): error is AxiosError {
    return (
      typeof error === 'object' &&
      error !== null &&
      'isAxiosError' in error &&
      (error as Record<string, unknown>).isAxiosError === true
    );
  }

  private isCancelError(error: unknown): boolean {
    if (this.isAxiosError(error) && error.code === 'ERR_CANCELED') {
      return true;
    }

    if (error instanceof Error && error.name === 'AbortError') {
      return true;
    }

    if (
      error &&
      typeof error === 'object' &&
      'name' in error &&
      error.name === 'AbortError'
    ) {
      return true;
    }

    return false;
  }
}
