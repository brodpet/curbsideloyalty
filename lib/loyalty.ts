export const STAMP_THRESHOLD = 10;
export const STAMP_COOLDOWN_MS = 5_000;

export function applyStamp(currentStamps: number): { newStamps: number; rewardEarned: boolean } {
  if (!Number.isInteger(currentStamps) || currentStamps < 0 || currentStamps >= STAMP_THRESHOLD) {
    throw new Error(`Invalid stamp count: ${currentStamps}`);
  }
  const next = currentStamps + 1;
  if (next === STAMP_THRESHOLD) {
    return { newStamps: 0, rewardEarned: true };
  }
  return { newStamps: next, rewardEarned: false };
}

export function isWithinCooldown(lastStampedAt: string | null, nowMs: number): boolean {
  if (!lastStampedAt) return false;
  return nowMs - Date.parse(lastStampedAt) < STAMP_COOLDOWN_MS;
}
