import type { NextApiRequest, NextApiResponse } from 'next';
import FrontendNewsScheduler from '@/lib/scheduler';

// start.ts와 동일한 전역 스케줄러 인스턴스 참조
declare global {
  var globalScheduler: FrontendNewsScheduler | undefined;
}

interface SchedulerStopResponse {
  success: boolean;
  message: string;
  timestamp: string;
  finalStatus?: {
    totalSentArticles: number;
    lastRunTime: string | null;
    uptime: string;
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<
    SchedulerStopResponse | { error: string; details?: string }
  >,
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🛑 스케줄러 정지 요청');
    console.log('전역 스케줄러 존재 여부:', !!globalThis.globalScheduler);

    // 전역 스케줄러가 없는 경우
    if (!globalThis.globalScheduler) {
      console.log('❌ 정지할 스케줄러 인스턴스가 없음');
      return res.status(404).json({
        error: '실행 중인 스케줄러가 없음',
        details: '이미 정지되었거나 시작되지 않은 상태입니다.',
      });
    }

    const scheduler = globalThis.globalScheduler;

    // 현재 실행 중인지 확인
    const isCurrentlyRunning = scheduler.isCurrentlyRunning();
    if (isCurrentlyRunning) {
      console.log('⚠️ 크롤링 작업이 실행 중입니다. 완료 후 정지합니다.');
    }

    // 정지 전 최종 상태 수집
    const finalStatus = await scheduler.getStatus();

    // 스케줄러 정리 및 정지
    console.log('🧹 스케줄러 정리 작업 시작...');
    await scheduler.cleanup();

    // 전역 인스턴스 제거
    globalThis.globalScheduler = undefined;
    console.log('✅ 전역 스케줄러 인스턴스 제거 완료');

    // 업타임 계산 (대략적)
    const uptime = finalStatus.lastRunTime
      ? `마지막 실행: ${new Date(finalStatus.lastRunTime).toLocaleString('ko-KR')}`
      : '실행 기록 없음';

    const response: SchedulerStopResponse = {
      success: true,
      message: '스케줄러가 정지되었습니다.',
      timestamp: new Date().toISOString(),
      finalStatus: {
        totalSentArticles: finalStatus.totalSentArticles,
        lastRunTime: finalStatus.lastRunTime,
        uptime: uptime,
      },
    };

    console.log('✅ 스케줄러 API 정지 완료');
    res.status(200).json(response);
  } catch (error) {
    console.error('스케줄러 정지 실패:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';

    // 에러가 발생해도 전역 인스턴스는 제거
    globalThis.globalScheduler = undefined;

    res.status(500).json({
      error: '스케줄러 정지 실패',
      details: errorMessage,
    });
  }
}
