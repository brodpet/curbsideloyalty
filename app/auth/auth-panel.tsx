'use client';

import { useState } from 'react';
import { useFormStatus } from 'react-dom';
import { login, signInWithGoogle, signup } from './actions';
import { ArrowRightIcon, GoogleIcon, LockIcon } from '@/app/ui/icons';

function SubmitButton({ children, kind }: { children: React.ReactNode; kind: 'primary' | 'secondary' }) {
  const { pending } = useFormStatus();

  return (
    <button className={`button button--${kind} button--full`} disabled={pending} type="submit">
      <span>{pending ? 'Working…' : children}</span>
      {!pending && <ArrowRightIcon size={18} />}
    </button>
  );
}

function GoogleButton() {
  const { pending } = useFormStatus();

  return (
    <button className="button button--secondary button--full" disabled={pending} type="submit">
      <GoogleIcon size={18} />
      <span>{pending ? 'Working…' : 'Continue with Google'}</span>
    </button>
  );
}

function Field({
  autoComplete,
  id,
  label,
  name,
  placeholder,
  type = 'text',
}: {
  autoComplete?: string;
  id: string;
  label: string;
  name: string;
  placeholder: string;
  type?: string;
}) {
  return (
    <label className="field" htmlFor={id}>
      <span className="field-label">{label}</span>
      <input autoComplete={autoComplete} id={id} name={name} placeholder={placeholder} required type={type} />
    </label>
  );
}

function PasswordField({
  autoComplete,
  id,
  label,
  name,
  placeholder,
}: {
  autoComplete?: string;
  id: string;
  label: string;
  name: string;
  placeholder: string;
}) {
  const [show, setShow] = useState(false);

  return (
    <div className="field">
      <label className="field-label" htmlFor={id}>
        {label}
      </label>
      <span className="field-password">
        <input
          autoComplete={autoComplete}
          id={id}
          name={name}
          placeholder={placeholder}
          required
          type={show ? 'text' : 'password'}
        />
        <button
          aria-label={show ? 'Hide password' : 'Show password'}
          className="field-password__toggle"
          onClick={() => setShow(!show)}
          type="button"
        >
          {show ? 'Hide' : 'Show'}
        </button>
      </span>
    </div>
  );
}

export function AuthPanel({ error }: { error?: string }) {
  const [mode, setMode] = useState<'signup' | 'login'>('signup');

  return (
    <section className="auth-panel" aria-labelledby="auth-heading">
      <div className="auth-panel__topline">
        <span className="eyebrow">Your card, your routine</span>
        <span className="auth-lock"><LockIcon size={14} /> Secure sign-in</span>
      </div>
      <h2 id="auth-heading">{mode === 'signup' ? 'Create your card' : 'Welcome back'}</h2>
      <p className="auth-panel__intro">
        {mode === 'signup'
          ? 'Keep your stamps in your pocket and your next coffee in sight.'
          : 'Pick up where you left off and show your card at the counter.'}
      </p>

      <div className="auth-tabs" role="tablist" aria-label="Account access">
        <button
          aria-selected={mode === 'signup'}
          className={mode === 'signup' ? 'is-active' : ''}
          onClick={() => setMode('signup')}
          role="tab"
          type="button"
        >
          New card
        </button>
        <button
          aria-selected={mode === 'login'}
          className={mode === 'login' ? 'is-active' : ''}
          onClick={() => setMode('login')}
          role="tab"
          type="button"
        >
          Sign in
        </button>
      </div>

      {error && (
        <p aria-live="polite" className="notice notice--error" role="alert">
          {error}
        </p>
      )}

      {mode === 'signup' ? (
        <form action={signup} className="auth-form">
          <Field autoComplete="name" id="signup-name" label="Name" name="name" placeholder="What should we call you?" />
          <Field autoComplete="email" id="signup-email" label="Email" name="email" placeholder="you@example.com" type="email" />
          <Field autoComplete="new-password" id="signup-password" label="Password" name="password" placeholder="At least 6 characters" type="password" />
          <SubmitButton kind="primary">Create my card</SubmitButton>
        </form>
      ) : (
        <form action={login} className="auth-form">
          <Field autoComplete="email" id="login-email" label="Email" name="email" placeholder="you@example.com" type="email" />
          <PasswordField autoComplete="current-password" id="login-password" label="Password" name="password" placeholder="Your password" />
          <SubmitButton kind="primary">Sign in</SubmitButton>
        </form>
      )}

      <div aria-hidden="true" className="auth-divider">or</div>
      <form action={signInWithGoogle}>
        <input name="intent" type="hidden" value={mode} />
        <GoogleButton />
      </form>

      <p className="auth-panel__fineprint">No card number to remember. Your QR code is created automatically.</p>
    </section>
  );
}
