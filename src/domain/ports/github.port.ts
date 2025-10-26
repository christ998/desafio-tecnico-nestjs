import { GitHubProfile } from '../models/github-profile.model';
import { GitHubRepository } from '../models/github-repo.model';

export interface GitHubPort {
  getUserProfile(
    username: string,
    signal?: AbortSignal,
  ): Promise<GitHubProfile>;
  getUserRepositories(
    username: string,
    signal?: AbortSignal,
  ): Promise<GitHubRepository[]>;
}

export const GITHUB_PORT = Symbol('GITHUB_PORT');
