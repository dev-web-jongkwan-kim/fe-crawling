import type { NextApiRequest, NextApiResponse } from 'next';
import FrontendNewsScheduler from '@/lib/scheduler';

// 전역 스케줄러 인스턴스 (서버 재시작 전까지 유지)
let globalScheduler: FrontendNewsScheduler | null = null;

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
    if (globalScheduler) {
      // 기존 스케줄러가 있다면 정지
      globalScheduler.stopScheduler();
    }

    // 새 스케줄러 인스턴스 생성 및 시작
    globalScheduler = new FrontendNewsScheduler();
    const success = globalScheduler.startScheduler();

    if (success) {
      const response: SchedulerStartResponse = {
        success: true,
        message: '스케줄러가 시작되었습니다.',
        timestamp: new Date().toISOString(),
        schedules: [
          '매 30분마다 자동 크롤링',
          '매일 오전 9시 메인 업데이트',
          '매일 오후 6시 저녁 업데이트',
        ],
      };
      res.status(200).json(response);
    } else {
      res.status(500).json({
        error: '스케줄러 시작 실패',
      });
    }
  } catch (error) {
    console.error('스케줄러 시작 실패:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      error: '스케줄러 시작 실패',
      details: errorMessage,
    });
  }
}
