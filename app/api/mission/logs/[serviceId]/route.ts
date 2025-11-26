import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler } from '@/lib/api-error-handler';
import { missionStore } from '@/lib/mission-store';

async function getLogsHandler(
  request: NextRequest,
  { params }: { params: Promise<{ serviceId: string }> }
) {
  const { serviceId } = await params;
  const mission = missionStore.get(serviceId);

  if (!mission || !mission.logs) {
    return NextResponse.json({ logs: [] });
  }

  const logLines = mission.logs.split('\n').filter(Boolean).map((line) => {
    try {
      return JSON.parse(line);
    } catch {
      return {
        timestamp: new Date().toISOString(),
        message: line,
        severity: 'INFO',
      };
    }
  });

  return NextResponse.json({ logs: logLines });
}

async function storeLogsHandler(
  request: NextRequest,
  { params }: { params: Promise<{ serviceId: string }> }
) {
  const { serviceId } = await params;
  const body = await request.json();
  const { logs } = body;

  if (!logs || typeof logs !== 'string') {
    return NextResponse.json(
      { success: false, error: 'Invalid logs format' },
      { status: 400 }
    );
  }

  missionStore.update(serviceId, { logs });

  return NextResponse.json({ success: true });
}

export const GET = withErrorHandler(getLogsHandler);
export const POST = withErrorHandler(storeLogsHandler);
