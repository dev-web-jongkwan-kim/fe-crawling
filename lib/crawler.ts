// lib/crawler.ts - 웹 크롤링 엔진

import axios, { AxiosResponse } from 'axios';
import Parser from 'rss-parser';
import {
  CRAWLING_SITES,
  FRONTEND_KEYWORDS,
  DEFAULT_CONFIG,
} from '@/config/sites';
import { Article, CrawlingSite, CrawlerMetrics } from '@/types';

interface DevToArticle {
  title: string;
  url?: string;
  canonical_url?: string;
  description?: string;
  published_at?: string;
  created_at?: string;
  tag_list?: string[];
}

interface RSSItem {
  title?: string;
  link?: string;
  contentSnippet?: string;
  content?: string;
  pubDate?: string;
  isoDate?: string;
  categories?: string[];
}

export class WebCrawler {
  private parser: Parser;
  private timeout: number;
  private metrics: CrawlerMetrics;

  constructor() {
    this.parser = new Parser();
    this.timeout = DEFAULT_CONFIG.CRAWLING_TIMEOUT;
    this.metrics = {
      crawlDuration: 0,
      sitesProcessed: 0,
      sitesSucceeded: 0,
      sitesFailed: 0,
      articlesFound: 0,
      articlesFiltered: 0,
      memoryUsed: 0,
    };
  }

  // API 기반 크롤링 (Dev.to 등)
  private async crawlAPI(site: CrawlingSite): Promise<Article[]> {
    try {
      console.log(`📡 API 크롤링 시작: ${site.name}`);

      const response: AxiosResponse<DevToArticle[]> = await axios.get(
        site.url,
        {
          params: site.params,
          timeout: this.timeout,
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
        },
      );

      const articles: Article[] = response.data.map(
        (article: DevToArticle) => ({
          title: article.title,
          url: article.url || article.canonical_url || '',
          description: article.description || '',
          publishedAt:
            article.published_at ||
            article.created_at ||
            new Date().toISOString(),
          tags: article.tag_list || [],
          source: site.name,
        }),
      );

      console.log(`✅ ${site.name}: ${articles.length}개 문서 수집`);
      return articles;
    } catch (error) {
      console.error(
        `❌ API 크롤링 실패 - ${site.name}:`,
        error instanceof Error ? error.message : 'Unknown error',
      );
      return [];
    }
  }

  // RSS 피드 크롤링
  private async crawlRSS(site: CrawlingSite): Promise<Article[]> {
    try {
      console.log(`📡 RSS 크롤링 시작: ${site.name}`);

      const feed = await this.parser.parseURL(site.url);

      const articles: Article[] = feed.items.map((item: RSSItem) => ({
        title: item.title || '',
        url: item.link || '',
        description: this.truncateDescription(
          item.contentSnippet || item.content || '',
        ),
        publishedAt: item.pubDate || item.isoDate || new Date().toISOString(),
        tags: item.categories || [],
        source: site.name,
      }));

      console.log(`✅ ${site.name}: ${articles.length}개 문서 수집`);
      return articles;
    } catch (error) {
      console.error(
        `❌ RSS 크롤링 실패 - ${site.name}:`,
        error instanceof Error ? error.message : 'Unknown error',
      );
      return [];
    }
  }

  // 설명 텍스트 길이 제한
  private truncateDescription(description: string): string {
    if (description.length <= DEFAULT_CONFIG.MAX_DESCRIPTION_LENGTH) {
      return description;
    }
    return (
      description.substring(0, DEFAULT_CONFIG.MAX_DESCRIPTION_LENGTH) + '...'
    );
  }

  // 프론트엔드 관련 문서 필터링
  public isFrontendRelated(article: Article): boolean {
    const text =
      `${article.title} ${article.description} ${article.tags?.join(' ')}`.toLowerCase();

    return FRONTEND_KEYWORDS.some((keyword) =>
      text.includes(keyword.toLowerCase()),
    );
  }

  // 중복 제거 (URL과 제목 기준)
  public removeDuplicates(articles: Article[]): Article[] {
    const seen = new Set<string>();
    return articles.filter((article) => {
      const key = article.url || article.title;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  // URL 유효성 검사
  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  // 아티클 유효성 검사
  private isValidArticle(article: Article): boolean {
    return !!(
      article.title &&
      article.title.trim().length > 0 &&
      article.url &&
      this.isValidUrl(article.url)
    );
  }

  // 메모리 사용량 측정
  private measureMemoryUsage(): number {
    const used = process.memoryUsage();
    return Math.round(used.rss / 1024 / 1024); // MB 단위
  }

  // 전체 사이트 크롤링 실행
  public async crawlAllSites(): Promise<Article[]> {
    const startTime = Date.now();
    const allArticles: Article[] = [];
    const allSites = [
      ...CRAWLING_SITES.international,
      ...CRAWLING_SITES.domestic,
    ];

    console.log(`🚀 ${allSites.length}개 사이트 크롤링 시작...`);
    console.log(`🕐 시작 시간: ${new Date().toLocaleString('ko-KR')}`);

    // 메트릭 초기화
    this.metrics = {
      crawlDuration: 0,
      sitesProcessed: 0,
      sitesSucceeded: 0,
      sitesFailed: 0,
      articlesFound: 0,
      articlesFiltered: 0,
      memoryUsed: this.measureMemoryUsage(),
    };

    for (const site of allSites) {
      this.metrics.sitesProcessed++;

      try {
        let articles: Article[] = [];

        switch (site.type) {
          case 'api':
            articles = await this.crawlAPI(site);
            break;
          case 'rss':
            articles = await this.crawlRSS(site);
            break;
          default:
            console.log(`⚠️ 지원하지 않는 크롤링 타입: ${site.type}`);
            continue;
        }

        // 유효한 아티클만 필터링
        const validArticles = articles.filter((article) =>
          this.isValidArticle(article),
        );
        this.metrics.articlesFound += validArticles.length;

        // 프론트엔드 관련 문서만 필터링
        const frontendArticles = validArticles.filter((article) =>
          this.isFrontendRelated(article),
        );
        this.metrics.articlesFiltered += frontendArticles.length;

        console.log(
          `🎯 ${site.name}: ${frontendArticles.length}개 프론트엔드 문서 발견`,
        );
        allArticles.push(...frontendArticles);

        this.metrics.sitesSucceeded++;

        // 요청 간 딜레이 (차단 방지)
        await new Promise((resolve) =>
          setTimeout(resolve, DEFAULT_CONFIG.REQUEST_DELAY),
        );
      } catch (error) {
        console.error(
          `❌ ${site.name} 크롤링 실패:`,
          error instanceof Error ? error.message : 'Unknown error',
        );
        this.metrics.sitesFailed++;
      }
    }

    // 중복 제거 및 최신순 정렬
    const uniqueArticles = this.removeDuplicates(allArticles);
    uniqueArticles.sort(
      (a, b) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
    );

    // 메트릭 완료
    this.metrics.crawlDuration = Date.now() - startTime;
    this.metrics.memoryUsed = this.measureMemoryUsage();

    console.log(`🎉 크롤링 완료!`);
    console.log(`📊 총 ${uniqueArticles.length}개 프론트엔드 문서 수집`);
    console.log(
      `⏱️ 소요시간: ${Math.round(this.metrics.crawlDuration / 1000)}초`,
    );
    console.log(`💾 메모리 사용량: ${this.metrics.memoryUsed}MB`);
    console.log(`🕐 완료 시간: ${new Date().toLocaleString('ko-KR')}`);

    return uniqueArticles;
  }

  // 단일 사이트 테스트용
  public async testSite(siteName: string): Promise<Article[]> {
    const allSites = [
      ...CRAWLING_SITES.international,
      ...CRAWLING_SITES.domestic,
    ];
    const site = allSites.find((s) => s.name === siteName);

    if (!site) {
      console.error(`❌ 사이트를 찾을 수 없습니다: ${siteName}`);
      return [];
    }

    console.log(`🧪 테스트 크롤링: ${site.name}`);

    let articles: Article[] = [];
    switch (site.type) {
      case 'api':
        articles = await this.crawlAPI(site);
        break;
      case 'rss':
        articles = await this.crawlRSS(site);
        break;
    }

    const validArticles = articles.filter((article) =>
      this.isValidArticle(article),
    );
    const frontendArticles = validArticles.filter((article) =>
      this.isFrontendRelated(article),
    );

    console.log(`📋 테스트 결과:`);
    console.log(`   전체 문서: ${articles.length}개`);
    console.log(`   유효한 문서: ${validArticles.length}개`);
    console.log(`   프론트엔드 관련: ${frontendArticles.length}개`);

    if (frontendArticles.length > 0) {
      console.log(`📰 샘플 문서:`);
      frontendArticles.slice(0, 3).forEach((article, index) => {
        console.log(`   ${index + 1}. ${article.title}`);
        console.log(`      🔗 ${article.url}`);
      });
    }

    return frontendArticles;
  }

  // 크롤링 메트릭 조회
  public getMetrics(): CrawlerMetrics {
    return { ...this.metrics };
  }

  // 특정 키워드로 필터링 (커스텀 필터링용)
  public filterByKeywords(articles: Article[], keywords: string[]): Article[] {
    return articles.filter((article) => {
      const text =
        `${article.title} ${article.description} ${article.tags?.join(' ')}`.toLowerCase();
      return keywords.some((keyword) => text.includes(keyword.toLowerCase()));
    });
  }

  // 날짜 범위로 필터링
  public filterByDateRange(
    articles: Article[],
    startDate: Date,
    endDate: Date,
  ): Article[] {
    return articles.filter((article) => {
      const articleDate = new Date(article.publishedAt);
      return articleDate >= startDate && articleDate <= endDate;
    });
  }
}

export default WebCrawler;
