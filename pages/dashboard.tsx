import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import SchedulerControl from '@/components/SchedulerControl';
import {
  DashboardStatus,
  Article,
  ManualCrawlResponse,
  TestMessageResponse,
} from '@/types';

const Dashboard: React.FC = () => {
  const [status, setStatus] = useState<DashboardStatus | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);

  // 상태 조회
  const fetchStatus = async (): Promise<void> => {
    try {
      const response = await fetch('/api/crawler/status');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: DashboardStatus = await response.json();
      setStatus(data);
      setArticles(data.recentArticles || []);
      setLastUpdate(new Date().toLocaleString('ko-KR'));
    } catch (error) {
      console.error('상태 조회 실패:', error);
      alert('상태 조회에 실패했습니다.');
    }
  };

  // 수동 크롤링 실행
  const runManualCrawling = async (): Promise<void> => {
    setLoading(true);

    try {
      const response = await fetch('/api/crawler/manual', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ManualCrawlResponse = await response.json();

      if (data.success) {
        alert(
          `크롤링 완료!\n` +
            `총 ${data.totalArticles}개 문서 수집\n` +
            `새로운 문서 ${data.newArticles}개` +
            `${data.messageSent ? ' (메시지 전송됨)' : ''}`,
        );
        await fetchStatus(); // 상태 새로고침
      } else {
        alert('크롤링 실패: ' + data.message);
      }
    } catch (error) {
      console.error('크롤링 실패:', error);
      alert('크롤링 요청에 실패했습니다.');
    }

    setLoading(false);
  };

  // 테스트 메시지 전송
  const sendTestMessage = async (): Promise<void> => {
    setLoading(true);

    try {
      const response = await fetch('/api/test/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: TestMessageResponse = await response.json();

      if (data.success) {
        alert('테스트 메시지가 전송되었습니다!');
      } else {
        alert('메시지 전송 실패: ' + data.message);
      }
    } catch (error) {
      console.error('테스트 메시지 실패:', error);
      alert('테스트 메시지 전송에 실패했습니다.');
    }

    setLoading(false);
  };

  // 시간 포맷팅 함수
  const formatDate = (dateString: string): string => {
    try {
      return new Date(dateString).toLocaleString('ko-KR');
    } catch {
      return '날짜 없음';
    }
  };

  // 컴포넌트 마운트시 상태 조회
  useEffect(() => {
    fetchStatus();

    // 30초마다 자동 새로고침
    // const interval = setInterval(fetchStatus, 30000);
    // return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gray-100">
      <Head>
        <title>프론트엔드 뉴스 크롤러 대시보드</title>
        <meta name="description" content="프론트엔드 뉴스 자동 수집 시스템" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            🚀 프론트엔드 뉴스 크롤러
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            최신 프론트엔드 기술 문서를 자동으로 수집하고 공유합니다
          </p>
          {lastUpdate && (
            <p className="mt-1 text-xs text-gray-500">
              마지막 업데이트: {lastUpdate}
            </p>
          )}
        </div>

        {/* 상태 카드들 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">📄</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      총 수집 문서
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {status?.totalArticles || 0}개
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">✉️</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      전송된 문서
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {status?.totalSentArticles || 0}개
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">🕐</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      마지막 실행
                    </dt>
                    <dd className="text-sm font-medium text-gray-900">
                      {status?.lastRunTime
                        ? formatDate(status.lastRunTime)
                        : '없음'}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div
                    className={`w-8 h-8 ${
                      status?.webhookStatus?.discord ||
                      status?.webhookStatus?.slack
                        ? 'bg-green-500'
                        : 'bg-red-500'
                    } rounded-full flex items-center justify-center`}
                  >
                    <span className="text-white font-bold">🔗</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      웹훅 상태
                    </dt>
                    <dd className="text-sm font-medium text-gray-900">
                      {status?.webhookStatus?.discord ||
                      status?.webhookStatus?.slack
                        ? '연결됨'
                        : '미연결'}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 컨트롤 패널 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                수동 제어
              </h3>
              <div className="grid grid-cols-1 gap-3">
                <button
                  onClick={runManualCrawling}
                  disabled={loading}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? '🔄 실행 중...' : '🚀 수동 크롤링'}
                </button>

                <button
                  onClick={sendTestMessage}
                  disabled={loading}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? '🔄 전송 중...' : '📤 테스트 메시지'}
                </button>

                <button
                  onClick={fetchStatus}
                  disabled={loading}
                  className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  🔄 상태 새로고침
                </button>
              </div>
            </div>
          </div>

          {/*<SchedulerControl onStatusChange={fetchStatus} />*/}
        </div>

        {/* 최근 문서 목록 */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              최근 수집 문서 ({articles.length}개)
            </h3>

            {articles.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">수집된 문서가 없습니다.</p>
                <p className="text-sm text-gray-400 mt-2">
                  {'수동 크롤링'} 버튼을 클릭하여 문서를 수집해보세요.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {articles.map((article, index) => (
                  <div
                    key={index}
                    className="border-l-4 border-blue-500 pl-4 py-3 hover:bg-gray-50 transition-colors"
                  >
                    <h4 className="font-semibold text-gray-900 mb-1">
                      <a
                        href={article.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-blue-600 hover:underline transition-colors"
                      >
                        {article.title}
                      </a>
                    </h4>
                    <div className="flex items-center text-sm text-gray-500 space-x-4">
                      <span className="flex items-center">
                        📌 {article.source}
                      </span>
                      <span className="flex items-center">
                        🕐 {formatDate(article.publishedAt)}
                      </span>
                    </div>
                    {article.description && (
                      <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                        {article.description.length > 200
                          ? article.description.substring(0, 200) + '...'
                          : article.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
