export interface GitHubProfile {
  login: string;
  fullName: string | null;
  avatar_url: string;
  bio: string | null;
  public_repos: number;
  followers: number;
  following: number;
  profile_url: string;
  created_at: string;
  updated_at: string;
}
