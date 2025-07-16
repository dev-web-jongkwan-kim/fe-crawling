// types/index.ts - 전역 타입 정의

export interface Article {
  title: string;
  url: string;
  description: string;
  publishedAt: string;
  tags: string[];
  source: string;
}

export interface CrawlingSite {
  name: string;
  url: string;
  type: 'api' | 'rss' | 'scraping';
  params?: Record<string, any>;
  selector?: string | null;
  rssUrl?: string;
}

export interface CrawlingSiteConfig {
  international: CrawlingSite[];
  domestic: CrawlingSite[];
}

export interface KakaoConfig {
  openChannelUrl?: string;
  botToken?: string;
  channelId?: string;
}

export interface LastRunData {
  lastRunTime: string | null;
  sentArticles: Article[];
  totalSent?: number;
  jobType?: string;
}

export interface ArticlesData {
  lastUpdated: string;
  totalCount: number;
  articles: Article[];
}

export interface CrawlingResult {
  success: boolean;
  totalArticles?: number;
  newArticles?: number;
  messageSent?: boolean;
  duration?: number;
  timestamp?: string;
  error?: string;
  message?: string;
}

export interface SchedulerStatus {
  isRunning: boolean;
  lastRunTime: string | null;
  totalSentArticles: number;
  lastSentCount: number;
  lastJobType?: string;
  scheduledJobsCount: number;
  isSchedulerActive: boolean;
}

export interface DashboardStatus {
  isRunning: boolean;
  lastRunTime: string | null;
  totalSentArticles: number;
  lastSentCount: number;
  recentArticles: Article[];
  totalArticles: number;
  lastUpdated?: string;
  webhookStatus: {
    discord: boolean;
    slack: boolean;
    kakao: boolean;
  };
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp?: string;
}

export interface PaginatedResponse<T> {
  articles: T[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface MessageSenderOptions {
  webhookUrl?: string;
  discordWebhook?: string;
  slackWebhook?: string;
}

export interface TrendData {
  keyword: string;
  count: number;
  percentage: number;
  trend: 'up' | 'down' | 'stable';
}

export interface TeamConfig {
  keywords: string[];
  webhook: string;
  schedule: string;
}

export interface ScheduledJob {
  name: string;
  schedule: string;
  isActive: boolean;
}

// React 컴포넌트 Props 타입들
export interface SchedulerControlProps {
  onStatusChange?: () => void;
}

export interface DashboardProps {
  initialStatus?: DashboardStatus;
}

// API Request/Response 타입들
export interface ManualCrawlResponse {
  success: boolean;
  message: string;
  totalArticles: number;
  newArticles: number;
  messageSent: boolean;
  timestamp: string;
}

export interface TestMessageResponse {
  success: boolean;
  message: string;
  timestamp: string;
}

export interface ArticlesQueryParams {
  page?: number;
  limit?: number;
  source?: string;
  keyword?: string;
}

// 환경 변수 타입
export interface EnvironmentVariables {
  KAKAO_WEBHOOK_URL?: string;
  KAKAO_BOT_TOKEN?: string;
  KAKAO_CHANNEL_ID?: string;
  DISCORD_WEBHOOK_URL?: string;
  SLACK_WEBHOOK_URL?: string;
  NODE_ENV: 'development' | 'production' | 'test';
  NEXT_PUBLIC_APP_URL?: string;
  CRAWLING_INTERVAL?: string;
  MAX_ARTICLES_PER_SITE?: string;
}

// Utility 타입들
export type JobType =
  | 'manual'
  | '30min-auto'
  | 'morning-daily'
  | 'evening-daily'
  | 'initial';

export type MessagePlatform = 'discord' | 'slack' | 'kakao' | 'console';

export type CrawlingSiteType = CrawlingSite['type'];

// 확장 가능한 인터페이스들
export interface ExtendedArticle extends Article {
  sentiment?: 'positive' | 'negative' | 'neutral';
  relevanceScore?: number;
  readTime?: number;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
}

export interface CrawlerMetrics {
  crawlDuration: number;
  sitesProcessed: number;
  sitesSucceeded: number;
  sitesFailed: number;
  articlesFound: number;
  articlesFiltered: number;
  memoryUsed: number;
}
