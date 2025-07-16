// lib/messageSender.ts - 메시지 전송 시스템

import axios, { AxiosResponse } from 'axios';
import { Article, MessagePlatform } from '@/types';
import { DEFAULT_CONFIG, MESSAGE_TEMPLATES } from '@/config/sites';

interface DiscordWebhookPayload {
  content: string;
  username?: string;
  avatar_url?: string;
}

interface SlackBlock {
  type: string;
  text?: {
    type: string;
    text: string;
  };
}

interface SlackWebhookPayload {
  text: string;
  blocks?: SlackBlock[];
}

interface KakaoWebhookPayload {
  text: string;
  username?: string;
}

interface MessageSendResult {
  platform: MessagePlatform;
  success: boolean;
  error?: string;
}

export class MessageSender {
  private webhookUrl?: string;
  private discordWebhook?: string;
  private slackWebhook?: string;

  constructor() {
    this.webhookUrl = process.env.KAKAO_WEBHOOK_URL;
    this.discordWebhook = process.env.DISCORD_WEBHOOK_URL;
    this.slackWebhook = process.env.SLACK_WEBHOOK_URL;
  }

  // 메시지 포맷팅
  private formatMessage(articles: Article[]): string | null {
    if (articles.length === 0) {
      return null;
    }

    const today = new Date().toLocaleDateString('ko-KR');
    let message =
      MESSAGE_TEMPLATES.NEW_ARTICLES.replace('{date}', today) + '\n\n';

    const displayArticles = articles.slice(
      0,
      DEFAULT_CONFIG.MAX_MESSAGE_ARTICLES,
    );

    displayArticles.forEach((article, index) => {
      message += `**${index + 1}. ${article.title}**\n`;
      message += `📌 ${article.source}\n`;
      message += `🔗 ${article.url}\n`;

      if (article.description) {
        const shortDesc =
          article.description.length > 100
            ? article.description.substring(0, 100) + '...'
            : article.description;
        message += `💬 ${shortDesc}\n`;
      }
      message += '\n';
    });

    if (articles.length > DEFAULT_CONFIG.MAX_MESSAGE_ARTICLES) {
      message += `\n... 외 **${articles.length - DEFAULT_CONFIG.MAX_MESSAGE_ARTICLES}개** 문서 더 있습니다.`;
    }

    return message;
  }

  // 디스코드 웹훅 전송
  private async sendToDiscord(articles: Article[]): Promise<MessageSendResult> {
    if (!this.discordWebhook) {
      return {
        platform: 'discord',
        success: false,
        error: '디스코드 웹훅 URL이 설정되지 않았습니다.',
      };
    }

    const message = this.formatMessage(articles);
    if (!message) {
      return {
        platform: 'discord',
        success: false,
        error: '전송할 메시지가 없습니다.',
      };
    }

    try {
      const payload: DiscordWebhookPayload = {
        content: message,
        username: '프론트엔드 뉴스봇',
        avatar_url: 'https://cdn-icons-png.flaticon.com/512/2111/2111646.png',
      };

      await axios.post<void>(this.discordWebhook, payload);

      console.log('✅ 디스코드 전송 성공');
      return { platform: 'discord', success: true };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ 디스코드 전송 실패:', errorMessage);
      return {
        platform: 'discord',
        success: false,
        error: errorMessage,
      };
    }
  }

  // 슬랙 웹훅 전송
  private async sendToSlack(articles: Article[]): Promise<MessageSendResult> {
    if (!this.slackWebhook) {
      return {
        platform: 'slack',
        success: false,
        error: '슬랙 웹훅 URL이 설정되지 않았습니다.',
      };
    }

    try {
      // 슬랙용 포맷 (Block Kit 사용)
      const blocks: SlackBlock[] = [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: `🚀 프론트엔드 신규 문서 ${articles.length}개 발견!`,
          },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `${new Date().toLocaleDateString('ko-KR')} 수집 결과`,
          },
        },
        {
          type: 'divider',
        },
      ];

      // 문서 목록 추가 (최대 10개)
      const displayArticles = articles.slice(
        0,
        DEFAULT_CONFIG.MAX_MESSAGE_ARTICLES,
      );
      displayArticles.forEach((article, index) => {
        blocks.push({
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*${index + 1}. ${article.title}*\n📌 ${article.source}\n🔗 <${article.url}|링크보기>`,
          },
        });
      });

      if (articles.length > DEFAULT_CONFIG.MAX_MESSAGE_ARTICLES) {
        blocks.push({
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `... 외 *${articles.length - DEFAULT_CONFIG.MAX_MESSAGE_ARTICLES}개* 문서 더 있습니다.`,
          },
        });
      }

      const payload: SlackWebhookPayload = {
        text: `🚀 프론트엔드 신규 문서 ${articles.length}개 발견!`,
        blocks: blocks,
      };

      await axios.post<void>(this.slackWebhook, payload);

      console.log('✅ 슬랙 전송 성공');
      return { platform: 'slack', success: true };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ 슬랙 전송 실패:', errorMessage);
      return {
        platform: 'slack',
        success: false,
        error: errorMessage,
      };
    }
  }

  // 카카오 웹훅 전송
  private async sendToKakao(articles: Article[]): Promise<MessageSendResult> {
    if (!this.webhookUrl) {
      return {
        platform: 'kakao',
        success: false,
        error: '카카오 웹훅 URL이 설정되지 않았습니다.',
      };
    }

    const message = this.formatMessage(articles);
    if (!message) {
      return {
        platform: 'kakao',
        success: false,
        error: '전송할 메시지가 없습니다.',
      };
    }

    try {
      const payload: KakaoWebhookPayload = {
        text: message,
        username: '프론트엔드 문서봇',
      };

      await axios.post<void>(this.webhookUrl, payload);

      console.log('✅ 카카오 웹훅 전송 성공');
      return { platform: 'kakao', success: true };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ 카카오 웹훅 전송 실패:', errorMessage);
      return {
        platform: 'kakao',
        success: false,
        error: errorMessage,
      };
    }
  }

  // 콘솔 출력 (개발용)
  private async sendToConsole(articles: Article[]): Promise<MessageSendResult> {
    console.log('\n📺 콘솔 출력 (개발 모드)');
    console.log('='.repeat(60));

    const message = this.formatMessage(articles);
    if (message) {
      console.log(message);
    } else {
      console.log('전송할 메시지가 없습니다.');
    }

    console.log('='.repeat(60));
    console.log('✅ 콘솔 출력 완료\n');
    return { platform: 'console', success: true };
  }

  // 사용 가능한 플랫폼 확인
  private getAvailablePlatforms(): MessagePlatform[] {
    const platforms: MessagePlatform[] = [];

    if (this.discordWebhook) platforms.push('discord');
    if (this.slackWebhook) platforms.push('slack');
    if (this.webhookUrl) platforms.push('kakao');

    // 개발 환경에서는 항상 콘솔 사용 가능
    if (process.env.NODE_ENV === 'development') {
      platforms.push('console');
    }

    return platforms;
  }

  // 통합 전송 메서드
  public async sendNotification(articles: Article[]): Promise<boolean> {
    if (!articles || articles.length === 0) {
      console.log('📭 전송할 새로운 문서가 없습니다.');
      return false;
    }

    console.log(`📤 ${articles.length}개 문서 전송 시작...`);

    const availablePlatforms = this.getAvailablePlatforms();

    if (availablePlatforms.length === 0) {
      console.log('⚠️ 설정된 메시지 플랫폼이 없습니다.');
      return false;
    }

    // 모든 플랫폼에 전송 시도
    const sendResults: MessageSendResult[] = [];

    for (const platform of availablePlatforms) {
      try {
        let result: MessageSendResult;

        switch (platform) {
          case 'discord':
            result = await this.sendToDiscord(articles);
            break;
          case 'slack':
            result = await this.sendToSlack(articles);
            break;
          case 'kakao':
            result = await this.sendToKakao(articles);
            break;
          case 'console':
            result = await this.sendToConsole(articles);
            break;
          default:
            continue;
        }

        sendResults.push(result);
      } catch (error) {
        console.log(
          `❌ ${platform} 전송 중 예외 발생:`,
          error instanceof Error ? error.message : 'Unknown error',
        );
        sendResults.push({
          platform,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // 결과 분석
    const successfulSends = sendResults.filter((result) => result.success);
    const failedSends = sendResults.filter((result) => !result.success);

    if (successfulSends.length > 0) {
      console.log(`🎉 ${successfulSends.length}개 플랫폼으로 전송 완료:`);
      successfulSends.forEach((result) => {
        console.log(`  ✅ ${result.platform}`);
      });
    }

    if (failedSends.length > 0) {
      console.log(`❌ ${failedSends.length}개 플랫폼 전송 실패:`);
      failedSends.forEach((result) => {
        console.log(`  ❌ ${result.platform}: ${result.error}`);
      });
    }

    return successfulSends.length > 0;
  }

  // 테스트 메시지 전송
  public async sendTestMessage(): Promise<boolean> {
    const testArticles: Article[] = [
      {
        title: 'React 19 새로운 기능들',
        url: 'https://example.com/react-19',
        description: 'React 19에서 새롭게 추가된 기능들을 살펴봅니다.',
        tags: ['react', 'javascript'],
        source: '테스트 사이트',
        publishedAt: new Date().toISOString(),
      },
      {
        title: 'Next.js 15 업데이트 소식',
        url: 'https://example.com/nextjs-15',
        description: 'Next.js 15의 주요 변경사항과 개선점들을 정리했습니다.',
        tags: ['nextjs', 'react'],
        source: '테스트 사이트',
        publishedAt: new Date().toISOString(),
      },
    ];

    console.log('🧪 테스트 메시지 전송...');
    return await this.sendNotification(testArticles);
  }

  // 플랫폼별 전송 결과 반환 (디버깅용)
  public async sendWithDetailedResults(
    articles: Article[],
  ): Promise<MessageSendResult[]> {
    if (!articles || articles.length === 0) {
      return [];
    }

    const availablePlatforms = this.getAvailablePlatforms();
    const results: MessageSendResult[] = [];

    for (const platform of availablePlatforms) {
      switch (platform) {
        case 'discord':
          results.push(await this.sendToDiscord(articles));
          break;
        case 'slack':
          results.push(await this.sendToSlack(articles));
          break;
        case 'kakao':
          results.push(await this.sendToKakao(articles));
          break;
        case 'console':
          results.push(await this.sendToConsole(articles));
          break;
      }
    }

    return results;
  }
}

export default MessageSender;
