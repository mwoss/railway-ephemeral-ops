import { NextRequest, NextResponse } from 'next/server';
import { createRailwayClient, getRailwayToken } from '@/lib/railway';
import { withErrorHandler } from '@/lib/api-error-handler';

async function getStatusHandler(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const serviceId = searchParams.get('serviceId');

  if (!serviceId) {
    return NextResponse.json(
      { success: false, error: 'Missing required parameter: serviceId' },
      { status: 400 }
    );
  }

  const token = getRailwayToken();
  const sdk = createRailwayClient(token);

  const result = await sdk.GetService({ serviceId });

  if (!result.service) {
    return NextResponse.json(
      { success: false, error: 'Service not found' },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    service: result.service,
  });
}

export const GET = withErrorHandler(getStatusHandler);
