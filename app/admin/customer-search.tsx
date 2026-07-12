'use client';

import { useEffect, useRef, useState } from 'react';
import { searchCustomers, type CustomerHit } from './actions';
import { STAMP_THRESHOLD } from '@/lib/loyalty';

export function CustomerSearch({
  disabled,
  onSelect,
}: {
  disabled: boolean;
  onSelect: (cardCode: string) => void;
}) {
  const [query, setQuery] = useState('');
  const [hits, setHits] = useState<CustomerHit[]>([]);
  const [searching, setSearching] = useState(false);
  const requestId = useRef(0);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setHits([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    const id = ++requestId.current;
    const timer = setTimeout(async () => {
      const results = await searchCustomers(q);
      if (id !== requestId.current) return; // a newer search superseded this one
      setHits(results);
      setSearching(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="customer-search">
      <label className="field-label" htmlFor="customer-search">
        Or find a customer by name or email
      </label>
      <input
        autoComplete="off"
        id="customer-search"
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Start typing a name…"
        value={query}
      />
      {searching && <p className="customer-search__status">Searching…</p>}
      {!searching && query.trim().length >= 2 && hits.length === 0 && (
        <p className="customer-search__status">No customers match that.</p>
      )}
      {hits.length > 0 && (
        <ul className="customer-results">
          {hits.map((hit) => (
            <li key={hit.cardCode}>
              <button
                className="customer-result"
                disabled={disabled}
                onClick={() => onSelect(hit.cardCode)}
                type="button"
              >
                <span className="customer-result__name">{hit.name}</span>
                <span className="customer-result__meta">
                  {hit.email} · {hit.currentStamps}/{STAMP_THRESHOLD}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
