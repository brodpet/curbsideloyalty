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
  const [resolvedQuery, setResolvedQuery] = useState('');
  const requestId = useRef(0);

  useEffect(() => {
    const q = query.trim();
    const id = ++requestId.current;
    if (q.length < 2) return;

    const timer = setTimeout(async () => {
      setSearching(true);
      const results = await searchCustomers(q);
      if (id !== requestId.current) return; // a newer search superseded this one
      setHits(results);
      setResolvedQuery(q);
      setSearching(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const normalizedQuery = query.trim();
  const showResults = normalizedQuery.length >= 2;
  const waitingForResults = showResults && resolvedQuery !== normalizedQuery;

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
      {(searching || waitingForResults) && <p className="customer-search__status">Searching…</p>}
      {!searching && !waitingForResults && showResults && hits.length === 0 && (
        <p className="customer-search__status">No customers match that.</p>
      )}
      {showResults && !waitingForResults && hits.length > 0 && (
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
