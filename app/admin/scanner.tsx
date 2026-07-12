'use client';

import { useState, useTransition } from 'react';
import { Scanner } from '@yudiel/react-qr-scanner';
import { lookupCard, addStamp, redeemReward, type CardState } from './actions';
import { STAMP_THRESHOLD } from '@/lib/loyalty';

export function AdminScanner() {
  const [state, setState] = useState<CardState | null>(null);
  const [cameraFailed, setCameraFailed] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [pending, startTransition] = useTransition();

  const scanning = state === null;

  function handleCode(code: string) {
    startTransition(async () => {
      setState(await lookupCard(code));
    });
  }

  function reset() {
    setState(null);
    setManualCode('');
  }

  if (scanning) {
    return (
      <div className="flex flex-col gap-4">
        {!cameraFailed ? (
          <div className="overflow-hidden rounded-xl border">
            <Scanner
              formats={['qr_code']}
              onScan={(codes) => {
                const value = codes[0]?.rawValue;
                if (value && !pending) handleCode(value);
              }}
              onError={() => setCameraFailed(true)}
            />
          </div>
        ) : (
          <p className="rounded bg-yellow-100 p-3 text-sm text-yellow-800">
            Camera unavailable — enter the card code manually below.
          </p>
        )}

        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (manualCode.trim()) handleCode(manualCode);
          }}
        >
          <input
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            placeholder="Or type card code"
            className="flex-1 rounded border p-2 text-sm"
          />
          <button className="rounded bg-black px-3 text-sm text-white" disabled={pending}>
            Look up
          </button>
        </form>
      </div>
    );
  }

  if (!state.ok || !state.customer) {
    return (
      <div className="flex flex-col gap-4">
        <p className="rounded bg-red-100 p-4 font-medium text-red-700">
          {state.message ?? 'Something went wrong'}
        </p>
        <button onClick={reset} className="rounded border p-3 font-medium">
          Scan another card
        </button>
      </div>
    );
  }

  const { customer } = state;
  const canRedeem = customer.unredeemedRewards > 0;

  return (
    <div className="flex flex-col gap-4">
      {state.rewardEarned && (
        <p className="rounded bg-green-100 p-4 text-center text-lg font-bold text-green-800">
          🎉 Free coffee earned!
        </p>
      )}
      {state.message && !state.rewardEarned && (
        <p className="rounded bg-blue-50 p-3 text-sm text-blue-800">{state.message}</p>
      )}

      <div className="rounded-xl border p-4">
        <p className="text-lg font-bold">{customer.name}</p>
        <p className="text-sm text-gray-600">
          {customer.currentStamps} / {STAMP_THRESHOLD} stamps
          {canRedeem && ` · ${customer.unredeemedRewards} free coffee available`}
        </p>
      </div>

      {canRedeem ? (
        <button
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              if (confirm(`Redeem a free coffee for ${customer.name}?`)) {
                setState(await redeemReward(customer.cardCode));
              }
            })
          }
          className="rounded bg-green-700 p-4 text-lg font-bold text-white disabled:opacity-50"
        >
          Redeem Free Coffee
        </button>
      ) : (
        <button
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              setState(await addStamp(customer.cardCode));
            })
          }
          className="rounded bg-amber-700 p-4 text-lg font-bold text-white disabled:opacity-50"
        >
          Add Stamp
        </button>
      )}

      <button onClick={reset} className="rounded border p-3 font-medium">
        Scan another card
      </button>
    </div>
  );
}
