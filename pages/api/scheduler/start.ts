import type { NextApiRequest, NextApiResponse } from 'next';
import FrontendNewsScheduler from '@/lib/scheduler';

// 전역 타입 선언
declare global {
  var globalScheduler: FrontendNewsScheduler | undefined;
}

interface SchedulerStartResponse {
  success: boolean;
  message: string;
  timestamp: string;
  schedules?: string[];
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<
    SchedulerStartResponse | { error: string; details?: string }
  >,
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 기존 스케줄러가 있다면 정지
    if (globalThis.globalScheduler) {
      console.log('🔄 기존 스케줄러 정지 중...');
      await globalThis.globalScheduler.cleanup();
    }

    // 새 스케줄러 인스턴스 생성 및 전역에 할당
    console.log('🚀 새 스케줄러 인스턴스 생성 중...');
    globalThis.globalScheduler = new FrontendNewsScheduler();

    const success = globalThis.globalScheduler.startScheduler();

    if (success) {
      console.log('✅ 스케줄러 시작 완료 - 전역 인스턴스 생성됨');

      const response: SchedulerStartResponse = {
        success: true,
        message: '스케줄러가 시작되었습니다.',
        timestamp: new Date().toISOString(),
        schedules: ['매일 오전 9시 메인 업데이트'],
      };
      res.status(200).json(response);
    } else {
      // 실패 시 전역 인스턴스 제거
      globalThis.globalScheduler = undefined;
      res.status(500).json({
        error: '스케줄러 시작 실패',
      });
    }
  } catch (error) {
    console.error('스케줄러 시작 실패:', error);

    // 에러 발생 시 전역 인스턴스 정리
    globalThis.globalScheduler = undefined;

    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      error: '스케줄러 시작 실패',
      details: errorMessage,
    });
  }
}
