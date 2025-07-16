import MessageSender from '../lib/messageSender';
import { Article } from '../types';

async function testMessage(): Promise<void> {
  console.log('📤 메시지 전송 시스템 테스트\n');

  const sender = new MessageSender();

  try {
    // 1. 테스트 메시지 전송
    console.log('=== 1. 테스트 메시지 전송 ===');
    const success = await sender.sendTestMessage();

    if (success) {
      console.log('✅ 테스트 메시지 전송 성공');
    } else {
      console.log('❌ 테스트 메시지 전송 실패');
    }
    console.log('');

    // 2. 환경 설정 확인
    console.log('=== 2. 웹훅 설정 상태 ===');
    console.log(
      `디스코드 웹훅: ${process.env.DISCORD_WEBHOOK_URL ? '✅ 설정됨' : '❌ 미설정'}`,
    );
    console.log(
      `슬랙 웹훅: ${process.env.SLACK_WEBHOOK_URL ? '✅ 설정됨' : '❌ 미설정'}`,
    );
    console.log(
      `카카오 웹훅: ${process.env.KAKAO_WEBHOOK_URL ? '✅ 설정됨' : '❌ 미설정'}`,
    );
    console.log('');

    // 3. 상세 테스트 (플랫폼별 결과)
    console.log('=== 3. 플랫폼별 전송 테스트 ===');
    const testArticles: Article[] = [
      {
        title: 'TypeScript 5.3 새로운 기능들',
        url: 'https://example.com/typescript-5-3',
        description: 'TypeScript 5.3에서 새롭게 추가된 기능들을 살펴봅니다.',
        tags: ['typescript', 'javascript'],
        source: '테스트 사이트',
        publishedAt: new Date().toISOString(),
      },
      {
        title: 'React Server Components 실전 가이드',
        url: 'https://example.com/rsc-guide',
        description:
          'React Server Components를 실제 프로젝트에 적용하는 방법을 알아봅니다.',
        tags: ['react', 'server-components'],
        source: '테스트 사이트',
        publishedAt: new Date().toISOString(),
      },
    ];

    const results = await sender.sendWithDetailedResults(testArticles);

    results.forEach((result) => {
      const status = result.success ? '✅' : '❌';
      console.log(
        `${status} ${result.platform}: ${result.success ? '성공' : result.error}`,
      );
    });

    if (
      !process.env.DISCORD_WEBHOOK_URL &&
      !process.env.SLACK_WEBHOOK_URL &&
      !process.env.KAKAO_WEBHOOK_URL
    ) {
      console.log('\n💡 웹훅 설정 방법:');
      console.log('');
      console.log('📌 디스코드 웹훅 설정:');
      console.log('1. 디스코드 서버 > 채널 설정 > 연동');
      console.log('2. 웹후크 생성 > URL 복사');
      console.log('3. .env.local에 DISCORD_WEBHOOK_URL=복사한URL 추가');
      console.log('');
      console.log('📌 슬랙 웹훅 설정:');
      console.log('1. https://api.slack.com/apps 접속');
      console.log('2. Create New App > Incoming Webhooks 활성화');
      console.log('3. Webhook URL 복사');
      console.log('4. .env.local에 SLACK_WEBHOOK_URL=복사한URL 추가');
    }
  } catch (error) {
    console.error(
      '❌ 테스트 실패:',
      error instanceof Error ? error.message : 'Unknown error',
    );
  }
}

// 스크립트 실행
if (require.main === module) {
  testMessage().catch(console.error);
}

export default testMessage;
