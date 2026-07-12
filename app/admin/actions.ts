'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { applyStamp, isWithinCooldown } from '@/lib/loyalty';

export type CardState = {
  ok: boolean;
  message?: string;
  customer?: {
    cardCode: string;
    name: string;
    currentStamps: number;
    unredeemedRewards: number;
  };
  rewardEarned?: boolean;
};

async function requireAdmin(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || user.email?.toLowerCase() !== process.env.ADMIN_EMAIL?.toLowerCase()) {
    return 'Not authorized';
  }
  return null;
}

async function fetchCardState(cardCode: string): Promise<CardState> {
  const db = createAdminClient();
  const { data: profile } = await db
    .from('profiles')
    .select('id, name, current_stamps')
    .eq('card_code', cardCode)
    .maybeSingle();
  if (!profile) return { ok: false, message: 'Card not recognized' };

  const { count } = await db
    .from('rewards')
    .select('*', { count: 'exact', head: true })
    .eq('customer_id', profile.id)
    .is('redeemed_at', null);

  return {
    ok: true,
    customer: {
      cardCode,
      name: profile.name,
      currentStamps: profile.current_stamps,
      unredeemedRewards: count ?? 0,
    },
  };
}

export async function lookupCard(cardCode: string): Promise<CardState> {
  const denied = await requireAdmin();
  if (denied) return { ok: false, message: denied };
  return fetchCardState(cardCode.trim());
}

export async function addStamp(cardCode: string): Promise<CardState> {
  const denied = await requireAdmin();
  if (denied) return { ok: false, message: denied };

  const code = cardCode.trim();
  const db = createAdminClient();
  const { data: profile } = await db
    .from('profiles')
    .select('id, current_stamps')
    .eq('card_code', code)
    .maybeSingle();
  if (!profile) return { ok: false, message: 'Card not recognized' };

  // Double-scan protection: ignore if last stamp is within the cooldown.
  const { data: lastStamp } = await db
    .from('stamps')
    .select('stamped_at')
    .eq('customer_id', profile.id)
    .order('stamped_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  let cooldownHit = false;
  let stampResult: { newStamps: number; rewardEarned: boolean } | null = null;
  try {
    cooldownHit = isWithinCooldown(lastStamp?.stamped_at ?? null, Date.now());
    if (!cooldownHit) stampResult = applyStamp(profile.current_stamps);
  } catch (err) {
    console.error('loyalty invariant violation', err);
    return { ok: false, message: 'Card data inconsistent — check manually' };
  }
  if (cooldownHit || !stampResult) {
    const state = await fetchCardState(code);
    return { ...state, message: 'Just stamped — ignored duplicate scan' };
  }

  const { newStamps, rewardEarned } = stampResult;

  const { error: stampError } = await db
    .from('stamps')
    .insert({ customer_id: profile.id });
  if (stampError) return { ok: false, message: 'Failed to add stamp — try again' };

  const { error: updateError } = await db
    .from('profiles')
    .update({ current_stamps: newStamps })
    .eq('id', profile.id);
  if (updateError) return { ok: false, message: 'Failed to update card — try again' };

  if (rewardEarned) {
    const { error: rewardError } = await db
      .from('rewards')
      .insert({ customer_id: profile.id });
    if (rewardError) {
      const state = await fetchCardState(code);
      return { ...state, ok: false, message: 'Stamp added but reward failed — check manually' };
    }
  }

  const state = await fetchCardState(code);
  return { ...state, rewardEarned };
}

export async function redeemReward(cardCode: string): Promise<CardState> {
  const denied = await requireAdmin();
  if (denied) return { ok: false, message: denied };

  const code = cardCode.trim();
  const db = createAdminClient();
  const { data: profile } = await db
    .from('profiles')
    .select('id')
    .eq('card_code', code)
    .maybeSingle();
  if (!profile) return { ok: false, message: 'Card not recognized' };

  const { data: reward } = await db
    .from('rewards')
    .select('id')
    .eq('customer_id', profile.id)
    .is('redeemed_at', null)
    .order('earned_at', { ascending: true })
    .limit(1)
    .maybeSingle();
  if (!reward) return { ok: false, message: 'No free coffee to redeem' };

  const { data: redeemed, error } = await db
    .from('rewards')
    .update({ redeemed_at: new Date().toISOString() })
    .eq('id', reward.id)
    .is('redeemed_at', null)
    .select('id');
  if (error) return { ok: false, message: 'Failed to redeem — try again' };
  if (!redeemed || redeemed.length === 0) return { ok: false, message: 'Already redeemed — scan again' };

  const state = await fetchCardState(code);
  return { ...state, message: 'Free coffee redeemed ✅' };
}
