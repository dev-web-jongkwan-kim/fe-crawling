import { promises as fs } from 'fs';
import path from 'path';
import { LastRunData, ArticlesData } from '../types';

interface SystemStatus {
  lastRunInfo: LastRunData | null;
  articlesInfo: ArticlesData | null;
  environmentConfig: {
    nodeEnv: string;
    webhooks: {
      kakao: boolean;
      discord: boolean;
      slack: boolean;
    };
  };
  dataFiles: {
    lastRunExists: boolean;
    articlesExists: boolean;
    dataDirectoryExists: boolean;
  };
}

async function checkStatus(): Promise<void> {
  console.log('📊 크롤러 상태 확인\n');

  try {
    const dataDir = path.join(process.cwd(), 'data');
    const status: SystemStatus = {
      lastRunInfo: null,
      articlesInfo: null,
      environmentConfig: {
        nodeEnv: process.env.NODE_ENV || 'development',
        webhooks: {
          kakao: !!process.env.KAKAO_WEBHOOK_URL,
          discord: !!process.env.DISCORD_WEBHOOK_URL,
          slack: !!process.env.SLACK_WEBHOOK_URL,
        },
      },
      dataFiles: {
        lastRunExists: false,
        articlesExists: false,
        dataDirectoryExists: false,
      },
    };

    // 데이터 디렉토리 확인
    try {
      await fs.access(dataDir);
      status.dataFiles.dataDirectoryExists = true;
    } catch {
      console.log('📁 데이터 디렉토리가 존재하지 않습니다.');
    }

    // articles.json 확인
    try {
      const articlesPath = path.join(dataDir, 'articles.json');
      const articlesData = await fs.readFile(articlesPath, 'utf8');
      status.articlesInfo = JSON.parse(articlesData) as ArticlesData;
      status.dataFiles.articlesExists = true;

      console.log('📄 수집된 문서 현황:');
      console.log(
        `  마지막 업데이트: ${status.articlesInfo.lastUpdated ? new Date(status.articlesInfo.lastUpdated).toLocaleString('ko-KR') : '없음'}`,
      );
      console.log(`  총 문서 수: ${status.articlesInfo.totalCount || 0}개`);

      if (
        status.articlesInfo.articles &&
        status.articlesInfo.articles.length > 0
      ) {
        // 사이트별 통계
        const sourceStats: Record<string, number> = {};
        status.articlesInfo.articles.forEach((article) => {
          sourceStats[article.source] = (sourceStats[article.source] || 0) + 1;
        });

        console.log('\n📈 사이트별 현황:');
        Object.entries(sourceStats)
          .sort(([, a], [, b]) => b - a) // 내림차순 정렬
          .forEach(([source, count]) => {
            console.log(`  ${source}: ${count}개`);
          });

        // 최신 문서 3개
        console.log('\n📰 최신 문서 3개:');
        status.articlesInfo.articles.slice(0, 3).forEach((article, index) => {
          console.log(`  ${index + 1}. [${article.source}] ${article.title}`);
          console.log(`     🔗 ${article.url}`);
        });
      }
    } catch (error) {
      console.log('📄 수집된 문서: 없음');
    }

    // last-run.json 확인
    try {
      const lastRunPath = path.join(dataDir, 'last-run.json');
      const lastRunData = await fs.readFile(lastRunPath, 'utf8');
      status.lastRunInfo = JSON.parse(lastRunData) as LastRunData;
      status.dataFiles.lastRunExists = true;

      console.log('\n🕐 마지막 실행 정보:');
      console.log(
        `  실행 시간: ${status.lastRunInfo.lastRunTime ? new Date(status.lastRunInfo.lastRunTime).toLocaleString('ko-KR') : '없음'}`,
      );
      console.log(`  작업 유형: ${status.lastRunInfo.jobType || 'unknown'}`);
      console.log(
        `  전송된 문서: ${status.lastRunInfo.sentArticles?.length || 0}개`,
      );
      console.log(`  마지막 전송량: ${status.lastRunInfo.totalSent || 0}개`);
    } catch (error) {
      console.log('\n🕐 마지막 실행: 없음');
    }

    // 환경 변수 확인
    console.log('\n⚙️ 환경 설정:');
    console.log(`  NODE_ENV: ${status.environmentConfig.nodeEnv}`);
    console.log(`  TypeScript: ✅ 활성화됨`);

    console.log('\n🔗 웹훅 연결 상태:');
    console.log(
      `  카카오: ${status.environmentConfig.webhooks.kakao ? '✅ 설정됨' : '❌ 미설정'}`,
    );
    console.log(
      `  디스코드: ${status.environmentConfig.webhooks.discord ? '✅ 설정됨' : '❌ 미설정'}`,
    );
    console.log(
      `  슬랙: ${status.environmentConfig.webhooks.slack ? '✅ 설정됨' : '❌ 미설정'}`,
    );

    const connectedWebhooks = Object.values(
      status.environmentConfig.webhooks,
    ).filter(Boolean).length;
    console.log(`  총 연결된 웹훅: ${connectedWebhooks}개`);

    if (connectedWebhooks === 0) {
      console.log('\n⚠️ 경고: 설정된 웹훅이 없습니다!');
      console.log('   메시지 전송을 위해 최소 하나의 웹훅을 설정해주세요.');
    }

    // 시스템 정보
    console.log('\n💻 시스템 정보:');
    const memoryUsage = process.memoryUsage();
    console.log(
      `  메모리 사용량: ${Math.round(memoryUsage.rss / 1024 / 1024)}MB`,
    );
    console.log(`  Node.js 버전: ${process.version}`);
    console.log(`  플랫폼: ${process.platform}`);

    // 권장사항
    if (!status.dataFiles.articlesExists) {
      console.log('\n💡 권장사항:');
      console.log('  1. "npm run test:crawler" 명령어로 크롤링 테스트 실행');
      console.log('  2. "npm run test:message" 명령어로 메시지 전송 테스트');
      console.log('  3. "npm run crawler:manual" 명령어로 수동 크롤링 실행');
    }
  } catch (error) {
    console.error(
      '❌ 상태 확인 실패:',
      error instanceof Error ? error.message : 'Unknown error',
    );
  }
}

// 스크립트 실행
if (require.main === module) {
  checkStatus().catch(console.error);
}

export default checkStatus;
