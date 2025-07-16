import WebCrawler from '../lib/crawler';

interface CrawlerTestResult {
  siteName: string;
  totalArticles: number;
  frontendArticles: number;
  success: boolean;
  error?: string;
}

async function testCrawler(): Promise<void> {
  console.log('🧪 크롤링 엔진 테스트 시작\n');

  const crawler = new WebCrawler();
  const testResults: CrawlerTestResult[] = [];

  try {
    // 1. 단일 사이트 테스트들
    const testSites = ['Dev.to', 'CSS-Tricks', '카카오 기술 블로그'];

    for (const siteName of testSites) {
      console.log(`=== ${siteName} 테스트 ===`);
      try {
        const articles = await crawler.testSite(siteName);
        testResults.push({
          siteName,
          totalArticles: articles.length,
          frontendArticles: articles.length,
          success: true,
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        testResults.push({
          siteName,
          totalArticles: 0,
          frontendArticles: 0,
          success: false,
          error: errorMessage,
        });
        console.error(`❌ ${siteName} 테스트 실패:`, errorMessage);
      }
      console.log('');
    }

    // 2. 전체 크롤링 테스트
    console.log('=== 전체 크롤링 테스트 ===');
    const allArticles = await crawler.crawlAllSites();

    if (allArticles.length > 0) {
      console.log('\n📊 수집 결과 요약:');
      console.log(`총 문서 수: ${allArticles.length}개`);

      // 사이트별 통계
      const sourceStats: Record<string, number> = {};
      allArticles.forEach((article) => {
        sourceStats[article.source] = (sourceStats[article.source] || 0) + 1;
      });

      console.log('\n📈 사이트별 수집 현황:');
      Object.entries(sourceStats).forEach(([source, count]) => {
        console.log(`  ${source}: ${count}개`);
      });

      console.log('\n📰 최신 문서 5개:');
      allArticles.slice(0, 5).forEach((article, index) => {
        console.log(`  ${index + 1}. [${article.source}] ${article.title}`);
        console.log(`     🔗 ${article.url}`);
        console.log(`     🕐 ${article.publishedAt}`);
        console.log('');
      });

      // 크롤링 메트릭 출력
      const metrics = crawler.getMetrics();
      console.log('\n📊 크롤링 메트릭:');
      console.log(`  처리된 사이트: ${metrics.sitesProcessed}개`);
      console.log(`  성공한 사이트: ${metrics.sitesSucceeded}개`);
      console.log(`  실패한 사이트: ${metrics.sitesFailed}개`);
      console.log(`  전체 문서 수집: ${metrics.articlesFound}개`);
      console.log(`  필터링된 문서: ${metrics.articlesFiltered}개`);
      console.log(`  소요 시간: ${Math.round(metrics.crawlDuration / 1000)}초`);
      console.log(`  메모리 사용량: ${metrics.memoryUsed}MB`);
    }

    // 테스트 결과 요약
    console.log('\n📋 테스트 결과 요약:');
    const successfulTests = testResults.filter((result) => result.success);
    const failedTests = testResults.filter((result) => !result.success);

    console.log(`✅ 성공: ${successfulTests.length}개 사이트`);
    console.log(`❌ 실패: ${failedTests.length}개 사이트`);

    if (failedTests.length > 0) {
      console.log('\n❌ 실패한 사이트들:');
      failedTests.forEach((result) => {
        console.log(`  ${result.siteName}: ${result.error}`);
      });
    }
  } catch (error) {
    console.error(
      '❌ 테스트 실패:',
      error instanceof Error ? error.message : 'Unknown error',
    );
  }

  console.log('\n🏁 테스트 완료');
}

// 스크립트 실행
if (require.main === module) {
  testCrawler().catch(console.error);
}

export default testCrawler;
