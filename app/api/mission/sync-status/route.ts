import {NextRequest, NextResponse} from 'next/server';
import {createRailwayClient, getRailwayToken} from '@/lib/railway';
import {withErrorHandler} from '@/lib/api-error-handler';
import {logger} from '@/lib/logger';

interface SyncStatusRequest {
  serviceId: string;
}

interface SyncStatusResponse {
  success: boolean;
  status?: string;
  deploymentId?: string;
  shouldUpdate?: boolean;
  error?: string;
}

function mapRailwayStatusToMissionStatus(railwayStatus: string): string {
  switch (railwayStatus) {
    case 'SUCCESS':
      return 'active';
    case 'FAILED':
    case 'CRASHED':
    case 'REMOVED':
      return 'failed';
    case 'INITIALIZING':
    case 'BUILDING':
    case 'DEPLOYING':
      return 'provisioning';
    default:
      return 'provisioning';
  }
}

async function syncStatusHandler(request: NextRequest) {
  const body: SyncStatusRequest = await request.json();
  const {serviceId} = body;

  if (!serviceId) {
    return NextResponse.json(
      {success: false, error: 'Missing required field: serviceId'},
      {status: 400}
    );
  }

  const token = getRailwayToken();
  const sdk = createRailwayClient(token);

  const result = await sdk.GetMissionStatus({serviceId});
  const deployment = result.service?.deployments?.edges?.[0]?.node;

  if (!deployment) {
    return NextResponse.json(
      {success: false, error: 'No deployment found for service'},
      {status: 404}
    );
  }

  const railwayStatus = deployment.status;
  const missionStatus = mapRailwayStatusToMissionStatus(railwayStatus);
  const deploymentId = deployment.id;

  logger.info({serviceId, railwayStatus, missionStatus, deploymentId}, 'Status synced');

  const response: SyncStatusResponse = {
    success: true,
    status: missionStatus,
    deploymentId,
    shouldUpdate: true,
  };

  return NextResponse.json(response);
}

export const POST = withErrorHandler(syncStatusHandler);
