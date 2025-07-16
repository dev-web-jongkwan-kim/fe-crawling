import type { NextApiRequest, NextApiResponse } from 'next';
import WebCrawler from '@/lib/crawler';
import MessageSender from '@/lib/messageSender';
import { promises as fs } from 'fs';
import path from 'path';
import { LastRunData, ArticlesData, ManualCrawlResponse } from '@/types';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<
    ManualCrawlResponse | { error: string; details?: string }
  >,
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🚀 API: 수동 크롤링 시작');

    const crawler = new WebCrawler();
    const sender = new MessageSender();

    // 1. 크롤링 실행
    const articles = await crawler.crawlAllSites();

    if (articles.length === 0) {
      return res.status(200).json({
        success: true,
        message: '수집된 문서가 없습니다.',
        totalArticles: 0,
        newArticles: 0,
        messageSent: false,
        timestamp: new Date().toISOString(),
      });
    }

    // 2. 이전 전송 기록 확인
    const dataDir = path.join(process.cwd(), 'data');
    let lastRun: LastRunData = { lastRunTime: null, sentArticles: [] };

    try {
      const lastRunData = await fs.readFile(
        path.join(dataDir, 'last-run.json'),
        'utf8',
      );
      lastRun = JSON.parse(lastRunData) as LastRunData;
    } catch (error) {
      console.log('이전 전송 기록 없음', error);
    }

    // 3. 새로운 문서만 필터링
    const sentUrls = new Set(
      (lastRun.sentArticles || []).map((article) => article.url),
    );
    const newArticles = articles.filter(
      (article) => !sentUrls.has(article.url),
    );

    // 4. 데이터 저장
    await fs.mkdir(dataDir, { recursive: true });

    const articlesData: ArticlesData = {
      lastUpdated: new Date().toISOString(),
      totalCount: articles.length,
      articles: articles,
    };

    await fs.writeFile(
      path.join(dataDir, 'articles.json'),
      JSON.stringify(articlesData, null, 2),
    );

    let messageSent = false;
    if (newArticles.length > 0) {
      // 5. 메시지 전송
      messageSent = await sender.sendNotification(newArticles);

      if (messageSent) {
        // 6. 전송 기록 업데이트
        const updatedSentArticles = [
          ...newArticles,
          ...(lastRun.sentArticles || []),
        ].slice(0, 1000);

        const newLastRun: LastRunData = {
          lastRunTime: new Date().toISOString(),
          sentArticles: updatedSentArticles,
          totalSent: newArticles.length,
          jobType: 'manual',
        };

        await fs.writeFile(
          path.join(dataDir, 'last-run.json'),
          JSON.stringify(newLastRun, null, 2),
        );
      }
    }

    const response: ManualCrawlResponse = {
      success: true,
      message: '크롤링 완료',
      totalArticles: articles.length,
      newArticles: newArticles.length,
      messageSent: messageSent,
      timestamp: new Date().toISOString(),
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('API 크롤링 실패:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      error: '크롤링 실패',
      details: errorMessage,
    });
  }
}
