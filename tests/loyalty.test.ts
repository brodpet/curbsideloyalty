import { describe, it, expect } from 'vitest';
import { applyStamp, isWithinCooldown, STAMP_THRESHOLD, STAMP_COOLDOWN_MS } from '../lib/loyalty';

describe('applyStamp', () => {
  it('increments stamps below the threshold', () => {
    expect(applyStamp(0)).toEqual({ newStamps: 1, rewardEarned: false });
    expect(applyStamp(8)).toEqual({ newStamps: 9, rewardEarned: false });
  });

  it('auto-resets to 0 and banks a reward on the 10th stamp', () => {
    expect(applyStamp(STAMP_THRESHOLD - 1)).toEqual({ newStamps: 0, rewardEarned: true });
  });

  it('rejects out-of-range stamp counts', () => {
    expect(() => applyStamp(-1)).toThrow();
    expect(() => applyStamp(STAMP_THRESHOLD)).toThrow(); // card should never hold 10
  });
});

describe('isWithinCooldown', () => {
  const now = Date.parse('2026-07-12T10:00:00Z');

  it('is false when there is no previous stamp', () => {
    expect(isWithinCooldown(null, now)).toBe(false);
  });

  it('is true when the last stamp is within the cooldown window', () => {
    const last = new Date(now - STAMP_COOLDOWN_MS + 1000).toISOString();
    expect(isWithinCooldown(last, now)).toBe(true);
  });

  it('is false when the last stamp is older than the cooldown window', () => {
    const last = new Date(now - STAMP_COOLDOWN_MS - 1000).toISOString();
    expect(isWithinCooldown(last, now)).toBe(false);
  });
});
