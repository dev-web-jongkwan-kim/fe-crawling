import type { NextApiRequest, NextApiResponse } from 'next';
import MessageSender from '@/lib/messageSender';
import { TestMessageResponse } from '@/types';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<
    TestMessageResponse | { error: string; details?: string }
  >,
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const sender = new MessageSender();
    const success = await sender.sendTestMessage();

    const response: TestMessageResponse = {
      success: success,
      message: success ? '테스트 메시지 전송 완료' : '메시지 전송 실패',
      timestamp: new Date().toISOString(),
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('테스트 메시지 전송 실패:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      error: '테스트 메시지 전송 실패',
      details: errorMessage,
    });
  }
}
