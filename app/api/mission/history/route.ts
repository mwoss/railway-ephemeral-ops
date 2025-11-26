import {NextRequest, NextResponse} from 'next/server';
import {logger} from '@/lib/logger';
import {withErrorHandler} from '@/lib/api-error-handler';
import {missionStore} from '@/lib/mission-store';

async function getMissionsHandler() {
  return NextResponse.json({
    success: true,
    missions: missionStore.getAll(),
  });
}

async function saveMissionHandler(request: NextRequest) {
  const body = await request.json();
  const {mission} = body;

  if (!mission) {
    return NextResponse.json(
      {success: false, error: 'Missing required field: mission'},
      {status: 400}
    );
  }

  missionStore.set(mission);

  logger.info({serviceId: mission.serviceId, status: mission.status}, 'Mission added to history');

  return NextResponse.json({
    success: true,
    missions: missionStore.getAll(),
  });
}

async function updateMissionHandler(request: NextRequest) {
  const body = await request.json();
  const {serviceId, updates} = body;

  if (!serviceId || !updates) {
    return NextResponse.json(
      {success: false, error: 'Missing required fields: serviceId or updates'},
      {status: 400}
    );
  }

  const updated = missionStore.update(serviceId, updates);

  if (!updated) {
    return NextResponse.json(
      {success: false, error: 'Mission not found'},
      {status: 404}
    );
  }

  logger.info({serviceId, updates: Object.keys(updates)}, 'Mission updated in history');

  return NextResponse.json({
    success: true,
    missions: missionStore.getAll(),
  });
}

export const GET = withErrorHandler(getMissionsHandler);
export const POST = withErrorHandler(saveMissionHandler);
export const PATCH = withErrorHandler(updateMissionHandler);
