// lib/scheduler.ts - 자동 스케줄링 시스템

import cron, { ScheduledTask } from 'node-cron';
import { promises as fs } from 'fs';
import path from 'path';
import WebCrawler from './crawler';
import MessageSender from './messageSender';
import {
  LastRunData,
  ArticlesData,
  CrawlingResult,
  SchedulerStatus,
  Article,
  JobType,
} from '@/types';
import { SCHEDULE_CONFIG } from '@/config/sites';

interface ScheduledJobInfo {
  name: string;
  schedule: string;
  task: ScheduledTask;
  isActive: boolean;
}

export class FrontendNewsScheduler {
  private crawler: WebCrawler;
  private sender: MessageSender;
  private lastRunFile: string;
  private articlesFile: string;
  private isRunning: boolean;
  private scheduledJobs: ScheduledJobInfo[];

  constructor() {
    this.crawler = new WebCrawler();
    this.sender = new MessageSender();
    this.lastRunFile = path.join(process.cwd(), 'data', 'last-run.json');
    this.articlesFile = path.join(process.cwd(), 'data', 'articles.json');
    this.isRunning = false;
    this.scheduledJobs = [];
  }

  // 이전 실행 데이터 로드
  private async loadLastRun(): Promise<LastRunData> {
    try {
      const data = await fs.readFile(this.lastRunFile, 'utf8');
      return JSON.parse(data) as LastRunData;
    } catch (error) {
      console.log(error);
      const defaultData: LastRunData = {
        lastRunTime: null,
        sentArticles: [],
      };
      return defaultData;
    }
  }

  // 실행 데이터 저장
  private async saveLastRun(data: LastRunData): Promise<void> {
    try {
      await fs.mkdir(path.dirname(this.lastRunFile), { recursive: true });
      await fs.writeFile(this.lastRunFile, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error(
        '실행 데이터 저장 실패:',
        error instanceof Error ? error.message : 'Unknown error',
      );
    }
  }

  // 새로운 문서만 필터링
  private filterNewArticles(
    articles: Article[],
    sentArticles: Article[],
  ): Article[] {
    const sentUrls = new Set(sentArticles.map((article) => article.url));
    return articles.filter((article) => !sentUrls.has(article.url));
  }

  // 문서 데이터 저장
  private async saveArticles(articles: Article[]): Promise<void> {
    try {
      await fs.mkdir(path.dirname(this.articlesFile), { recursive: true });

      const articlesData: ArticlesData = {
        lastUpdated: new Date().toISOString(),
        totalCount: articles.length,
        articles: articles,
      };

      await fs.writeFile(
        this.articlesFile,
        JSON.stringify(articlesData, null, 2),
      );
    } catch (error) {
      console.error(
        '문서 데이터 저장 실패:',
        error instanceof Error ? error.message : 'Unknown error',
      );
    }
  }

  // 메인 크롤링 및 전송 로직
  public async runCrawlingJob(
    jobType: JobType = 'manual',
  ): Promise<CrawlingResult> {
    if (this.isRunning) {
      console.log('⏳ 이미 크롤링이 실행 중입니다.');
      return {
        success: false,
        message: '이미 실행 중',
        timestamp: new Date().toISOString(),
      };
    }

    this.isRunning = true;
    const startTime = Date.now();

    console.log(
      `🎯 [${jobType}] 크롤링 작업 시작 - ${new Date().toLocaleString('ko-KR')}`,
    );

    try {
      // 1. 이전 실행 데이터 로드
      const lastRun = await this.loadLastRun();

      // 2. 전체 사이트 크롤링
      const allArticles = await this.crawler.crawlAllSites();

      // 3. 새로운 문서만 필터링
      const newArticles = this.filterNewArticles(
        allArticles,
        lastRun.sentArticles || [],
      );

      console.log(
        `📊 총 ${allArticles.length}개 문서 중 ${newArticles.length}개 신규 문서`,
      );

      // 4. 전체 문서 데이터 저장
      await this.saveArticles(allArticles);

      let messageSent = false;
      if (newArticles.length > 0) {
        // 5. 메시지 전송
        messageSent = await this.sender.sendNotification(newArticles);

        if (messageSent) {
          // 6. 성공시 전송된 문서 기록
          const updatedSentArticles = [
            ...newArticles,
            ...(lastRun.sentArticles || []),
          ].slice(0, 1000); // 최대 1000개까지만 보관

          const newLastRun: LastRunData = {
            lastRunTime: new Date().toISOString(),
            sentArticles: updatedSentArticles,
            totalSent: newArticles.length,
            jobType: jobType,
          };

          await this.saveLastRun(newLastRun);

          console.log(`✅ ${newArticles.length}개 신규 문서 전송 완료`);
        } else {
          console.log('❌ 메시지 전송 실패');
        }
      } else {
        console.log('📭 전송할 신규 문서가 없습니다.');
      }

      const endTime = Date.now();
      const duration = Math.round((endTime - startTime) / 1000);

      console.log(
        `🏁 [${jobType}] 크롤링 작업 완료 - 소요시간: ${duration}초\n`,
      );

      return {
        success: true,
        totalArticles: allArticles.length,
        newArticles: newArticles.length,
        messageSent: messageSent,
        duration: duration,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ [${jobType}] 크롤링 작업 실패:`, errorMessage);
      return {
        success: false,
        error: errorMessage,
        timestamp: new Date().toISOString(),
      };
    } finally {
      this.isRunning = false;
    }
  }

  // 스케줄 시작
  public startScheduler(): boolean {
    console.log('🚀 프론트엔드 뉴스 스케줄러 시작!');
    console.log(`🕐 시작 시간: ${new Date().toLocaleString('ko-KR')}`);

    // 기존 스케줄 모두 정지
    this.stopScheduler();

    try {
      const jobMorning = cron.schedule(
        SCHEDULE_CONFIG.MORNING_DAILY,
        () => {
          console.log('🌅 [오전 9시] 일일 크롤링 실행');
          this.runCrawlingJob('morning-daily');
        },
        {
          scheduled: false,
        } as any,
      );

      // 스케줄 시작
      jobMorning.start();

      // 스케줄 정보 저장
      this.scheduledJobs = [
        {
          name: '오전 9시 일일 크롤링',
          schedule: SCHEDULE_CONFIG.MORNING_DAILY,
          task: jobMorning,
          isActive: true,
        },
      ];

      console.log('📅 스케줄 등록 완료:');
      this.scheduledJobs.forEach((job) => {
        console.log(`  - ${job.name} (${job.schedule})`);
      });

      // 5초 후 초기 크롤링 실행
      setTimeout(() => {
        console.log('🎪 초기 크롤링 실행');
        this.runCrawlingJob('initial');
      }, 5000);

      return true;
    } catch (error) {
      console.error(
        '스케줄러 시작 실패:',
        error instanceof Error ? error.message : 'Unknown error',
      );
      return false;
    }
  }

  // 스케줄 정지
  public stopScheduler(): void {
    if (this.scheduledJobs.length > 0) {
      console.log('⏹️ 기존 스케줄 정지 중...');
      this.scheduledJobs.forEach((jobInfo) => {
        try {
          jobInfo.task.destroy();
          jobInfo.isActive = false;
        } catch (error) {
          console.error(`스케줄 정지 실패: ${jobInfo.name}`);
        }
      });
      this.scheduledJobs = [];
      console.log('✅ 모든 스케줄이 정지되었습니다.');
    }
  }

  // 수동 실행 (API 엔드포인트용)
  public async manualRun(): Promise<CrawlingResult> {
    console.log('🔧 수동 크롤링 실행 요청');
    return await this.runCrawlingJob('manual');
  }

  // 상태 확인
  public async getStatus(): Promise<SchedulerStatus> {
    const lastRun = await this.loadLastRun();
    return {
      isRunning: this.isRunning,
      lastRunTime: lastRun.lastRunTime,
      totalSentArticles: lastRun.sentArticles?.length || 0,
      lastSentCount: lastRun.totalSent || 0,
      lastJobType: lastRun.jobType || 'unknown',
      scheduledJobsCount: this.scheduledJobs.length,
      isSchedulerActive:
        this.scheduledJobs.length > 0 &&
        this.scheduledJobs.some((job) => job.isActive),
    };
  }

  // 스케줄 목록 조회
  public getScheduledJobs(): ScheduledJobInfo[] {
    return this.scheduledJobs.map((job) => ({
      name: job.name,
      schedule: job.schedule,
      task: job.task, // 실제로는 task 객체를 노출하지 않는 것이 좋음
      isActive: job.isActive,
    }));
  }

  // 특정 스케줄만 시작/정지
  public toggleSchedule(jobName: string, enable: boolean): boolean {
    const jobInfo = this.scheduledJobs.find((job) => job.name === jobName);

    if (!jobInfo) {
      console.error(`스케줄을 찾을 수 없습니다: ${jobName}`);
      return false;
    }

    try {
      if (enable && !jobInfo.isActive) {
        jobInfo.task.start();
        jobInfo.isActive = true;
        console.log(`✅ 스케줄 시작: ${jobName}`);
      } else if (!enable && jobInfo.isActive) {
        jobInfo.task.stop();
        jobInfo.isActive = false;
        console.log(`⏹️ 스케줄 정지: ${jobName}`);
      }
      return true;
    } catch (error) {
      console.error(`스케줄 토글 실패: ${jobName}`);
      return false;
    }
  }

  // 크롤링 실행 중인지 확인
  public isCurrentlyRunning(): boolean {
    return this.isRunning;
  }

  // 메모리 사용량 확인
  public getMemoryUsage(): {
    rss: number;
    heapUsed: number;
    heapTotal: number;
  } {
    const usage = process.memoryUsage();
    return {
      rss: Math.round(usage.rss / 1024 / 1024), // MB
      heapUsed: Math.round(usage.heapUsed / 1024 / 1024), // MB
      heapTotal: Math.round(usage.heapTotal / 1024 / 1024), // MB
    };
  }

  // 정리 작업
  public async cleanup(): Promise<void> {
    console.log('🧹 스케줄러 정리 작업 시작...');

    // 모든 스케줄 정지
    this.stopScheduler();

    // 실행 중인 작업이 있다면 완료까지 대기
    let waitCount = 0;
    while (this.isRunning && waitCount < 30) {
      // 최대 30초 대기
      await new Promise((resolve) => setTimeout(resolve, 1000));
      waitCount++;
    }

    if (this.isRunning) {
      console.log('⚠️ 실행 중인 작업이 있지만 강제 종료합니다.');
    }

    console.log('✅ 스케줄러 정리 완료');
  }
}

export default FrontendNewsScheduler;
