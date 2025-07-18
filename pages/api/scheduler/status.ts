import type { NextApiRequest, NextApiResponse } from 'next';
import FrontendNewsScheduler from '@/lib/scheduler';
import { SchedulerStatus } from '@/types';

// start.ts와 동일한 전역 스케줄러 인스턴스 참조
declare global {
  var globalScheduler: FrontendNewsScheduler | undefined;
}

interface SchedulerStatusResponse {
  success: boolean;
  message: string;
  timestamp: string;
  status: SchedulerStatus;
  memoryUsage?: {
    rss: number;
    heapUsed: number;
    heapTotal: number;
  };
  scheduledJobs?: Array<{
    name: string;
    schedule: string;
    isActive: boolean;
  }>;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<
    SchedulerStatusResponse | { error: string; details?: string }
  >,
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('📊 스케줄러 상태 조회 요청');
    console.log('전역 스케줄러 존재 여부:', !!globalThis.globalScheduler);

    // 전역 스케줄러가 없는 경우
    if (!globalThis.globalScheduler) {
      console.log('❌ 전역 스케줄러 인스턴스가 없음');
      return res.status(404).json({
        error: '스케줄러가 시작되지 않음',
        details: '먼저 /api/start를 호출하여 스케줄러를 시작해주세요.',
      });
    }

    const scheduler = globalThis.globalScheduler;

    // 스케줄러 상태 조회
    const status = await scheduler.getStatus();
    const memoryUsage = scheduler.getMemoryUsage();
    const scheduledJobs = scheduler.getScheduledJobs().map((job) => ({
      name: job.name,
      schedule: job.schedule,
      isActive: job.isActive,
    }));

    const response: SchedulerStatusResponse = {
      success: true,
      message: '스케줄러 상태 조회 완료',
      timestamp: new Date().toISOString(),
      status: status,
      memoryUsage: memoryUsage,
      scheduledJobs: scheduledJobs,
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('스케줄러 상태 조회 실패:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      error: '스케줄러 상태 조회 실패',
      details: errorMessage,
    });
  }
}
