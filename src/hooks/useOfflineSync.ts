import { useEffect, useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { flushQueue, getPendingCount } from '@/lib/offlineQueue';
import { toast } from 'sonner';

export function useOfflineSync() {
  const queryClient = useQueryClient();
  const [pending, setPending] = useState(0);
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  const refreshCount = useCallback(async () => {
    setPending(await getPendingCount());
  }, []);

  const sync = useCallback(async () => {
    const { flushed, failed } = await flushQueue();
    if (flushed > 0) {
      toast.success(`Synced ${flushed} offline entr${flushed === 1 ? 'y' : 'ies'}`);
      await queryClient.invalidateQueries({ queryKey: ['migraine-entries'] });
      await queryClient.invalidateQueries({ queryKey: ['migraine-statistics'] });
    }
    setPending(failed);
  }, [queryClient]);

  useEffect(() => {
    refreshCount();
    const onOnline = () => {
      setIsOnline(true);
      sync();
    };
    const onOffline = () => setIsOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, [refreshCount, sync]);

  return { isOnline, pending, sync, refreshCount };
}
