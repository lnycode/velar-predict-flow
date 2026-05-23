import { useOfflineSync } from '@/hooks/useOfflineSync';
import { CloudOff, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export function OfflineSyncIndicator() {
  const { isOnline, pending, sync } = useOfflineSync();

  if (isOnline && pending === 0) return null;

  if (!isOnline) {
    return (
      <Badge variant="outline" className="gap-1.5 border-yellow-500/40 text-yellow-300">
        <CloudOff className="h-3 w-3" />
        Offline{pending > 0 ? ` · ${pending} queued` : ''}
      </Badge>
    );
  }

  return (
    <Button
      size="sm"
      variant="outline"
      onClick={() => sync()}
      className="h-7 gap-1.5 border-primary/40 text-primary"
      aria-label={`Sync ${pending} pending entries`}
    >
      <RefreshCw className="h-3 w-3" />
      Sync {pending}
    </Button>
  );
}
