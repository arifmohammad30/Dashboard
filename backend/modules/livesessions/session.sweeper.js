import { cleanStaleOngoingSessions } from '../ocpp/ocpp.service.js';

export async function startSessionSweeper(io, intervalMs = 15000) {
  // 1. Run startup sweeper to recover orphaned ongoing sessions from previous restarts
  try {
    await cleanStaleOngoingSessions(io);
  } catch (err) {
    console.error('Failed to run initial stale session sweeper:', err.message);
  }

  // 2. Periodic sweeper to mark inactive sessions as Failed
  const timerId = setInterval(() => {
    cleanStaleOngoingSessions(io).catch((err) => {
      console.error('Error during periodic session cleanup sweep:', err.message);
    });
  }, intervalMs);

  return timerId;
}
