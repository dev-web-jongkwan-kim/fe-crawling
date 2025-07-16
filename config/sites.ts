// config/sites.ts - 크롤링 대상 사이트 설정

import { CrawlingSiteConfig, KakaoConfig } from '@/types';

export const CRAWLING_SITES: CrawlingSiteConfig = {
  // 해외 사이트
  international: [
    {
      name: 'Dev.to',
      url: 'https://dev.to/api/articles',
      type: 'api',
      params: { tag: 'frontend,javascript,react,vue,nextjs', per_page: 20 },
      selector: null,
    },
    {
      name: 'CSS-Tricks',
      url: 'https://css-tricks.com/feed/',
      type: 'rss',
      selector: null,
    },
    {
      name: 'Smashing Magazine',
      url: 'https://www.smashingmagazine.com/feed/',
      type: 'rss',
      selector: null,
    },
    {
      name: 'Frontend Focus',
      url: 'https://frontendfoc.us/rss',
      type: 'rss',
      selector: null,
    },
    {
      name: 'A List Apart',
      url: 'https://alistapart.com/feed/',
      type: 'rss',
      selector: null,
    },
  ],

  // 국내 사이트
  domestic: [
    {
      name: '카카오 기술 블로그',
      url: 'https://tech.kakao.com/feed/',
      type: 'rss',
      selector: null,
    },
    {
      name: '우아한형제들 기술블로그',
      url: 'https://techblog.woowahan.com/feed/',
      type: 'rss',
      selector: null,
    },
    {
      name: '라인 기술블로그',
      url: 'https://engineering.linecorp.com/ko/feed/',
      type: 'rss',
      selector: null,
    },
    {
      name: 'NHN 기술블로그',
      url: 'https://meetup.nhncloud.com/rss',
      type: 'rss',
      selector: null,
    },
    {
      name: '토스 기술블로그',
      url: 'https://toss.tech/rss.xml',
      type: 'rss',
      selector: null,
    },
  ],
};

// 프론트엔드 관련 키워드 필터
export const FRONTEND_KEYWORDS: string[] = [
  // 기술 스택
  'react',
  'vue',
  'angular',
  'svelte',
  'nextjs',
  'nuxt',
  'gatsby',
  'typescript',
  'javascript',
  'css',
  'scss',
  'tailwind',
  'styled-components',

  // 도구 & 라이브러리
  'webpack',
  'vite',
  'rollup',
  'babel',
  'eslint',
  'prettier',
  'jest',
  'cypress',
  'testing-library',
  'storybook',

  // 개념 & 패턴
  'frontend',
  'ui',
  'ux',
  'responsive',
  'accessibility',
  'performance',
  'seo',
  'ssr',
  'spa',
  'pwa',
  'web-components',
  'micro-frontend',

  // 상태 관리
  'redux',
  'zustand',
  'recoil',
  'context',
  'state management',

  // 스타일링
  'emotion',
  'chakra',
  'material-ui',
  'ant-design',

  // 한국어 키워드
  '프론트엔드',
  '리액트',
  '뷰',
  '타입스크립트',
  '웹개발',
  'UI',
  '사용자경험',
];

export const KAKAO_CONFIG: KakaoConfig = {
  openChannelUrl: process.env.KAKAO_OPEN_CHANNEL_URL,
  botToken: process.env.KAKAO_BOT_TOKEN,
  channelId: process.env.KAKAO_CHANNEL_ID,
};

// 기본 설정값들
export const DEFAULT_CONFIG = {
  MAX_ARTICLES_PER_SITE: parseInt(process.env.MAX_ARTICLES_PER_SITE || '20'),
  CRAWLING_TIMEOUT: 10000, // 10초
  REQUEST_DELAY: 1000, // 1초
  MAX_RETRY_ATTEMPTS: 3,
  MAX_STORED_ARTICLES: 1000,
  MAX_DESCRIPTION_LENGTH: 200,
  MAX_MESSAGE_ARTICLES: 10,
} as const;

// 스케줄 설정
export const SCHEDULE_CONFIG = {
  EVERY_30_MINUTES: '*/30 * * * *',
  MORNING_DAILY: '0 9 * * *',
  EVENING_DAILY: '0 18 * * *',
  WEEKLY_REPORT: '0 9 * * 1', // 매주 월요일 오전 9시
} as const;

// 팀별 설정 (확장용)
export const TEAM_CONFIGS = {
  frontend: {
    keywords: ['react', 'vue', 'angular', 'typescript', 'css'],
    webhook: process.env.FRONTEND_TEAM_WEBHOOK,
    schedule: SCHEDULE_CONFIG.MORNING_DAILY,
  },
  backend: {
    keywords: ['nodejs', 'python', 'java', 'spring', 'api'],
    webhook: process.env.BACKEND_TEAM_WEBHOOK,
    schedule: SCHEDULE_CONFIG.EVENING_DAILY,
  },
} as const;

// 메시지 템플릿
export const MESSAGE_TEMPLATES = {
  NEW_ARTICLES: '🚀 **프론트엔드 신규 문서 알림** ({date})',
  NO_ARTICLES: '📭 오늘은 새로운 문서가 없습니다.',
  ERROR_OCCURRED: '❌ 크롤링 중 오류가 발생했습니다: {error}',
  CRAWLING_COMPLETED:
    '✅ 크롤링 완료: {totalArticles}개 수집, {newArticles}개 신규',
} as const;

// URL 검증을 위한 정규식
export const URL_PATTERNS = {
  HTTP_HTTPS: /^https?:\/\/.+/,
  VALID_DOMAIN: /^https?:\/\/([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/.*)?$/,
} as const;
