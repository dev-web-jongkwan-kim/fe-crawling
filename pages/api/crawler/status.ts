import type { NextApiRequest, NextApiResponse } from 'next';
import { promises as fs } from 'fs';
import path from 'path';
import { DashboardStatus, LastRunData, ArticlesData } from '@/types';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<DashboardStatus | { error: string; details?: string }>,
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const dataDir = path.join(process.cwd(), 'data');

    // 기본 상태
    const status: DashboardStatus = {
      isRunning: false,
      lastRunTime: null,
      totalSentArticles: 0,
      lastSentCount: 0,
      recentArticles: [],
      totalArticles: 0,
      webhookStatus: {
        discord: !!process.env.DISCORD_WEBHOOK_URL,
        slack: !!process.env.SLACK_WEBHOOK_URL,
        kakao: !!process.env.KAKAO_WEBHOOK_URL,
      },
    };

    // 마지막 실행 정보
    try {
      const lastRunPath = path.join(dataDir, 'last-run.json');
      const lastRunData = await fs.readFile(lastRunPath, 'utf8');
      const parsed = JSON.parse(lastRunData) as LastRunData;

      status.lastRunTime = parsed.lastRunTime;
      status.totalSentArticles = parsed.sentArticles?.length || 0;
      status.lastSentCount = parsed.totalSent || 0;
    } catch (error) {
      console.log('마지막 실행 정보 없음', error);
    }

    // 최근 문서 정보
    try {
      const articlesPath = path.join(dataDir, 'articles.json');
      const articlesData = await fs.readFile(articlesPath, 'utf8');
      const parsed = JSON.parse(articlesData) as ArticlesData;

      // status.recentArticles = parsed.articles?.slice(0, 20) || [];
      status.recentArticles = parsed.articles || [];
      status.totalArticles = parsed.totalCount || 0;
      status.lastUpdated = parsed.lastUpdated;
    } catch (error) {
      console.log('문서 정보 없음', error);
    }

    res.status(200).json(status);
  } catch (error) {
    console.error('상태 확인 실패:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      error: '상태 확인 실패',
      details: errorMessage,
    });
  }
}
