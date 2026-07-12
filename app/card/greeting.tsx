'use client';

import { useEffect, useState } from 'react';

function greetingForHour(hour: number): string {
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export function Greeting({ name }: { name: string }) {
  const [greeting, setGreeting] = useState('Hello');

  useEffect(() => {
    setGreeting(greetingForHour(new Date().getHours()));
  }, []);

  return (
    <h1 id="card-heading">
      {greeting}, {name}.
    </h1>
  );
}
