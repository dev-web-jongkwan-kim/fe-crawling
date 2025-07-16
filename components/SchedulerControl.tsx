import React, { useState, useEffect } from 'react';
import { SchedulerControlProps } from '@/types';

interface SchedulerStatus {
  isSchedulerActive: boolean;
  scheduledJobsCount: number;
}

const SchedulerControl: React.FC<SchedulerControlProps> = ({
  onStatusChange,
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [schedulerActive, setSchedulerActive] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const startScheduler = async (): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/scheduler/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        setSchedulerActive(true);
        alert(
          '✅ 스케줄러가 시작되었습니다!\n\n자동 실행 일정:\n' +
            data.schedules?.map((s: string) => `• ${s}`).join('\n'),
        );
        onStatusChange?.();
      } else {
        setError('스케줄러 시작 실패: ' + data.error);
        alert('❌ 스케줄러 시작 실패: ' + data.error);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      setError('스케줄러 시작 요청 실패: ' + errorMessage);
      console.error('스케줄러 시작 실패:', error);
      alert('❌ 스케줄러 시작 요청 실패');
    }

    setLoading(false);
  };

  const stopScheduler = async (): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/scheduler/stop', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        setSchedulerActive(false);
        alert('⏹️ 스케줄러가 정지되었습니다.');
        onStatusChange?.();
      } else {
        setError('스케줄러 정지 실패: ' + data.error);
        alert('❌ 스케줄러 정지 실패: ' + data.error);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      setError('스케줄러 정지 요청 실패: ' + errorMessage);
      console.error('스케줄러 정지 실패:', error);
      alert('❌ 스케줄러 정지 요청 실패');
    }

    setLoading(false);
  };

  const checkSchedulerStatus = async (): Promise<SchedulerStatus | null> => {
    try {
      const response = await fetch('/api/scheduler/status');
      const data = await response.json();
      setSchedulerActive(data.isSchedulerActive || false);
      return data as SchedulerStatus;
    } catch (error) {
      console.error('스케줄러 상태 확인 실패:');
      // console.error('스케줄러 상태 확인 실패:', error);
      return null;
    }
  };

  useEffect(() => {
    checkSchedulerStatus();
  }, []);

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        🕐 자동 스케줄러 제어
      </h3>

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <div
            className={`w-3 h-3 rounded-full ${
              schedulerActive ? 'bg-green-500' : 'bg-red-500'
            }`}
          />
          <span className="text-sm font-medium text-gray-700">
            {schedulerActive ? '실행 중' : '정지됨'}
          </span>
        </div>

        <button
          onClick={checkSchedulerStatus}
          className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
          disabled={loading}
        >
          🔄 상태 확인
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={startScheduler}
          disabled={loading || schedulerActive}
          className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? '⏳ 처리중...' : '▶️ 시작'}
        </button>

        <button
          onClick={stopScheduler}
          disabled={loading || !schedulerActive}
          className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? '⏳ 처리중...' : '⏹️ 정지'}
        </button>
      </div>

      <div className="mt-4 text-xs text-gray-500">
        <div className="font-medium mb-1">자동 실행 일정:</div>
        <div>• 매 30분마다 크롤링</div>
        <div>• 매일 오전 9시, 오후 6시</div>
      </div>
    </div>
  );
};

export default SchedulerControl;
