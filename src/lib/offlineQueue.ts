/**
 * Offline-first queue for migraine entries.
 * Persists pending writes to IndexedDB via idb-keyval; flushes when online.
 */
import { get, set, del } from 'idb-keyval';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import type { MigraineEntryInput } from '@/domain/types';

const QUEUE_KEY = 'velar:migraine-queue:v1';

interface QueuedEntry {
  id: string;
  userId: string;
  input: MigraineEntryInput;
  queuedAt: number;
}

async function readQueue(): Promise<QueuedEntry[]> {
  return (await get<QueuedEntry[]>(QUEUE_KEY)) ?? [];
}

async function writeQueue(q: QueuedEntry[]): Promise<void> {
  if (q.length === 0) await del(QUEUE_KEY);
  else await set(QUEUE_KEY, q);
}

export async function enqueueMigraineEntry(
  userId: string,
  input: MigraineEntryInput
): Promise<string> {
  const queue = await readQueue();
  const id = `pending-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  queue.push({ id, userId, input, queuedAt: Date.now() });
  await writeQueue(queue);
  return id;
}

export async function getPendingCount(): Promise<number> {
  return (await readQueue()).length;
}

export async function flushQueue(): Promise<{ flushed: number; failed: number }> {
  const queue = await readQueue();
  if (queue.length === 0) return { flushed: 0, failed: 0 };

  let flushed = 0;
  const remaining: QueuedEntry[] = [];

  for (const item of queue) {
    try {
      const dbEntry = {
        user_id: item.userId,
        created_at: new Date(item.queuedAt).toISOString(),
        severity: item.input.severity,
        intensity: item.input.intensity,
        duration: item.input.duration,
        location: item.input.location ?? null,
        note: item.input.note ?? null,
        medication_taken:
          item.input.medicationTaken ||
          item.input.selectedMedications?.join(', ') ||
          null,
        effectiveness: item.input.effectiveness ?? null,
        trigger_detected: (item.input.selectedTriggers?.length ?? 0) > 0,
      };
      const { error } = await supabase.from('migraine_entries').insert(dbEntry);
      if (error) {
        logger.warn('Offline flush: insert failed, keeping in queue', error);
        remaining.push(item);
      } else {
        flushed++;
      }
    } catch (err) {
      logger.warn('Offline flush: unexpected error, keeping in queue', err);
      remaining.push(item);
    }
  }

  await writeQueue(remaining);
  return { flushed, failed: remaining.length };
}
