import { useEffect, useRef } from 'react';
import { useSyncMissionStatus } from './useMissions';
import type { Mission } from '@/lib/types';

export function useStatusSync(mission: Mission | null) {
  const syncMutation = useSyncMissionStatus();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Only sync if mission exists and is in provisioning/injecting state
    if (!mission || !mission.serviceId) {
      return;
    }

    const shouldSync = mission.status === 'provisioning' || mission.status === 'injecting';

    if (!shouldSync) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    syncMutation.mutate(mission.serviceId);

    // Set up polling interval (2 seconds)
    intervalRef.current = setInterval(() => {
      syncMutation.mutate(mission.serviceId);
    }, 2000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [mission?.serviceId, mission?.status]);

  return syncMutation;
}
