import type { NextConfig } from 'next';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,

  // TypeScript 설정
  typescript: {
    // 프로덕션 빌드시 타입 체크 무시 (별도로 체크)
    ignoreBuildErrors: false,
  },

  // 환경 변수 설정
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },

  // API 라우트 설정
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
    responseLimit: '8mb',
  },

  // 크롤링을 위한 외부 이미지 도메인 허용
  images: {
    domains: [
      'dev.to',
      'css-tricks.com',
      'smashingmagazine.com',
      'tech.kakao.com',
      'techblog.woowahan.com',
      'engineering.linecorp.com',
    ],
  },

  // 보안 헤더 설정
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization',
          },
        ],
      },
    ];
  },

  // 리다이렉트 설정
  async redirects() {
    return [
      {
        source: '/',
        destination: '/dashboard',
        permanent: false,
      },
    ];
  },

  // 웹팩 설정 커스터마이징
  webpack: (
    config: { externals: { puppeteer: string }[] },
    { buildId, dev, isServer, defaultLoaders, webpack }: any,
  ) => {
    // Puppeteer 관련 설정
    if (isServer) {
      config.externals.push({
        puppeteer: 'commonjs puppeteer',
      });
    }

    return config;
  },

  // 실험적 기능
  experimental: {
    // 서버 컴포넌트 관련 설정
    serverComponentsExternalPackages: ['puppeteer'],
  },
};

module.exports = nextConfig;
