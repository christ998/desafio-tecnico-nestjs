export interface GitHubUserResponse {
  login: string;
  name: string | null;
  avatar_url: string;
  bio: string | null;
  public_repos: number;
  followers: number;
  following: number;
  html_url: string;
  created_at: string;
  updated_at: string;
}
export interface GitHubRepoResponse {
  name: string;
  stargazers_count: number;
  pushed_at: string | null;
}
