// lib/types.ts
export type PathChoice = 'help_hospitals' | 'post_disaster' | 'green_workforce';

export interface RiskSnapshot {
  country: string;
  flood: number;    // 0..1
  cyclone: number;  // 0..1
  heat: number;     // 0..1
  source: string;   // "ASDI/NOAA"
}

export interface Role {
  id: string;
  title: string;
  path: PathChoice;
  skills: string[];
  hazard_fit: { flood: number; cyclone: number; heat: number };
  microlearning: { title: string; link: string }[];
}

export interface RecommendRequest {
  path: PathChoice;
  country: string;
  age: number;
  skills: string[];
  language?: string;
  equityFlag?: boolean;
}

export interface Recommendation {
  id: string;
  title: string;
  score: number;
  microlearning: { title: string; link: string }[];
  why: string;
}

export interface RecommendResponse {
  countryRisk: Omit<RiskSnapshot, 'country'> & { source: string };
  recommendations: Recommendation[];
}

export interface RoleClickEvent {
  roleId: string;
  path: PathChoice;
  country?: string;
  timestamp: string;
  userAgent?: string;
}

export interface NewsItem {
  title: string;
  source: string;
  url: string;
  publishedAt: string;
}
