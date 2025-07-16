import WebCrawler from '../lib/crawler';
import MessageSender from '../lib/messageSender';
import { promises as fs } from 'fs';
import path from 'path';
import { LastRunData, ArticlesData } from '../types';

async function sendCrawled(): Promise<void> {
  console.log('🚀 크롤링 + 전송 통합 테스트\n');

  const crawler = new WebCrawler();
  const sender = new MessageSender();

  try {
    // 1. 크롤링 실행
    console.log('=== 1. 문서 수집 중... ===');
    const articles = await crawler.crawlAllSites();

    if (articles.length === 0) {
      console.log('📭 수집된 문서가 없습니다.');
      return;
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
      console.log('📝 이전 전송 기록이 없습니다. 모든 문서를 전송합니다.');
    }

    // 3. 새로운 문서만 필터링
    const sentUrls = new Set(
      (lastRun.sentArticles || []).map((article) => article.url),
    );
    const newArticles = articles.filter(
      (article) => !sentUrls.has(article.url),
    );

    console.log(`📊 전체 문서: ${articles.length}개`);
    console.log(`📨 새로운 문서: ${newArticles.length}개`);

    if (newArticles.length === 0) {
      console.log('📭 전송할 새로운 문서가 없습니다.');
      return;
    }

    // 4. 메시지 전송
    console.log('\n=== 2. 메시지 전송 중... ===');
    const messageSent = await sender.sendNotification(newArticles);

    if (messageSent) {
      // 5. 전송 기록 업데이트
      const updatedSentArticles = [
        ...newArticles,
        ...(lastRun.sentArticles || []),
      ].slice(0, 1000); // 최대 1000개까지만 보관

      await fs.mkdir(dataDir, { recursive: true });

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

      // 전체 문서 데이터도 저장
      const articlesData: ArticlesData = {
        lastUpdated: new Date().toISOString(),
        totalCount: articles.length,
        articles: articles,
      };

      await fs.writeFile(
        path.join(dataDir, 'articles.json'),
        JSON.stringify(articlesData, null, 2),
      );

      console.log(`✅ ${newArticles.length}개 문서 전송 완료 및 기록 저장`);

      // 크롤링 메트릭 출력
      const metrics = crawler.getMetrics();
      console.log('\n📊 크롤링 통계:');
      console.log(
        `  성공률: ${Math.round((metrics.sitesSucceeded / metrics.sitesProcessed) * 100)}%`,
      );
      console.log(
        `  필터링 효율: ${Math.round((metrics.articlesFiltered / metrics.articlesFound) * 100)}%`,
      );
      console.log(
        `  평균 처리 시간: ${Math.round(metrics.crawlDuration / metrics.sitesProcessed)}ms/사이트`,
      );
    } else {
      console.log('❌ 메시지 전송 실패');
    }
  } catch (error) {
    console.error(
      '❌ 통합 테스트 실패:',
      error instanceof Error ? error.message : 'Unknown error',
    );
  }
}

// 스크립트 실행
if (require.main === module) {
  sendCrawled().catch(console.error);
}

export default sendCrawled;
