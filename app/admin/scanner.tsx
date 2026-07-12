'use client';

import { useState, useTransition } from 'react';
import { Scanner } from '@yudiel/react-qr-scanner';
import { addStamp, lookupCard, redeemReward, type CardState } from './actions';
import { StampRail } from '@/app/ui/stamp-rail';
import { STAMP_THRESHOLD } from '@/lib/loyalty';
import { ArrowRightIcon, CheckIcon, CoffeeCupIcon, ScanIcon } from '@/app/ui/icons';

export function AdminScanner() {
  const [state, setState] = useState<CardState | null>(null);
  const [cameraFailed, setCameraFailed] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  const scanning = state === null;

  function handleCode(code: string) {
    const value = code.trim();
    if (!value || pending) return;

    startTransition(async () => {
      setState(await lookupCard(value));
    });
  }

  function reset() {
    setState(null);
    setManualCode('');
    setConfirming(false);
    setCameraFailed(false);
  }

  function confirmReward(cardCode: string) {
    startTransition(async () => {
      setState(await redeemReward(cardCode));
      setConfirming(false);
    });
  }

  if (scanning) {
    return (
      <section className="scanner-panel" aria-labelledby="scanner-panel-heading">
        <div className="scanner-panel__topline">
          <h2 className="scanner-panel__title" id="scanner-panel-heading">Scan a loyalty ticket</h2>
          <span className="scanner-panel__status">Scanner ready</span>
        </div>

        <div className="scanner-frame">
          {!cameraFailed ? (
            <>
              <Scanner
                formats={['qr_code']}
                onError={() => setCameraFailed(true)}
                onScan={(codes) => {
                  const value = codes[0]?.rawValue;
                  if (value && !pending) handleCode(value);
                }}
              />
              <div className="scan-guides" aria-hidden="true">
                <span className="scan-guides__text">Position QR code within the frame</span>
              </div>
            </>
          ) : (
            <div className="scanner-frame__empty" role="status">
              <ScanIcon size={36} />
              <span>Camera unavailable — use the code field below.</span>
            </div>
          )}
        </div>

        <form
          className="manual-lookup"
          onSubmit={(event) => {
            event.preventDefault();
            handleCode(manualCode);
          }}
        >
          <label className="field-label" htmlFor="manual-card-code">Or enter the ticket code (like #a1b2c3)</label>
          <input
            autoComplete="off"
            id="manual-card-code"
            onChange={(event) => setManualCode(event.target.value)}
            placeholder="#a1b2c3"
            value={manualCode}
          />
          <button className="button button--primary" disabled={pending || !manualCode.trim()} type="submit">
            <span>{pending ? 'Looking up…' : 'Look up'}</span>
            {!pending && <ArrowRightIcon size={18} />}
          </button>
        </form>
      </section>
    );
  }

  if (!state.ok || !state.customer) {
    return (
      <section className="scan-result" aria-live="polite">
        <div className="scan-message scan-message--error" role="alert">
          {state.message ?? 'Something went wrong while looking up that card.'}
        </div>
        <button className="button button--secondary button--full" onClick={reset} type="button">
          Scan another card
        </button>
      </section>
    );
  }

  const { customer } = state;
  const canRedeem = customer.unredeemedRewards > 0;

  return (
    <>
      <section className="scan-result" aria-live="polite">
        {state.rewardEarned && (
          <div className="scan-message scan-message--success" role="status">
            Free coffee earned. The card has started a new run.
          </div>
        )}
        {state.message && !state.rewardEarned && (
          <div className="scan-message scan-message--info" role="status">
            {state.message}
          </div>
        )}

        <div className="scan-result__headline">
          <CheckIcon size={25} />
          <h2>Customer found</h2>
        </div>

        <div className="result-card">
          <div className="section-kicker">Customer loyalty ticket</div>
          <h3 className="ticket-card__title">{customer.name}</h3>
          <p className="result-card__meta">{customer.currentStamps} of {STAMP_THRESHOLD} stamps collected</p>
          <StampRail compact currentStamps={customer.currentStamps} threshold={STAMP_THRESHOLD} />
          {canRedeem && (
            <div className="result-card__reward">
              <CoffeeCupIcon size={17} />
              {customer.unredeemedRewards} free coffee{customer.unredeemedRewards === 1 ? '' : 's'} available
            </div>
          )}
        </div>

        {canRedeem ? (
          <button
            className="button button--danger button--full"
            disabled={pending}
            onClick={() => setConfirming(true)}
            type="button"
          >
            <span>{pending ? 'Working…' : 'Redeem free coffee'}</span>
            {!pending && <CoffeeCupIcon size={18} />}
          </button>
        ) : (
          <button
            className="button button--primary button--full"
            disabled={pending}
            onClick={() => startTransition(async () => setState(await addStamp(customer.cardCode)))}
            type="button"
          >
            <span>{pending ? 'Adding stamp…' : 'Add stamp'}</span>
            {!pending && <ArrowRightIcon size={18} />}
          </button>
        )}

        <button className="button button--secondary button--full" onClick={reset} type="button">
          Scan another card
        </button>
      </section>

      {confirming && (
        <div className="dialog-backdrop">
          <div aria-labelledby="confirm-heading" aria-modal="true" className="confirm-dialog" role="dialog">
            <span className="eyebrow">Reward pocket</span>
            <h2 id="confirm-heading">Make this one on us?</h2>
            <p>Redeem one free coffee for {customer.name}. This action cannot be undone.</p>
            <div className="confirm-dialog__actions">
              <button className="button button--secondary" onClick={() => setConfirming(false)} type="button">
                Keep it
              </button>
              <button className="button button--danger" disabled={pending} onClick={() => confirmReward(customer.cardCode)} type="button">
                Redeem
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
