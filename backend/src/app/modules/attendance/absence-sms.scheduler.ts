import config from '../../config';
import { attendanceAbsenceSmsService } from './absence-sms.service';

let intervalHandle: NodeJS.Timeout | null = null;

const MIN_INTERVAL_MS = 60 * 1000; // guardrail to avoid thrashing

const resolveInterval = (): number => {
  const candidate = Number(config.absence_sms_dispatch_interval_minutes);
  const minutes = Number.isFinite(candidate) && candidate > 0 ? candidate : 5;
  return Math.max(minutes * 60 * 1000, MIN_INTERVAL_MS);
};

export const startAbsenceSmsScheduler = (): void => {
  if (intervalHandle) {
    return;
  }

  const intervalMs = resolveInterval();

  const run = async () => {
    try {
      await attendanceAbsenceSmsService.runScheduledDispatch();
    } catch (error) {
      console.error('[AbsenceSmsScheduler] Failed to dispatch absence SMS:', error);
    }
  };

  // Run once at startup
  void run();

  intervalHandle = setInterval(run, intervalMs);
};

export const stopAbsenceSmsScheduler = (): void => {
  if (intervalHandle) {
    clearInterval(intervalHandle);
    intervalHandle = null;
  }
};
