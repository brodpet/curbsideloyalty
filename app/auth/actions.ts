'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export async function signup(formData: FormData): Promise<void> {
  const name = String(formData.get('name') ?? '').trim();
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  if (!name || !email || password.length < 6) {
    redirect('/?error=' + encodeURIComponent('Name, email, and a 6+ character password are required'));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name } },
  });
  if (error) redirect('/?error=' + encodeURIComponent(error.message));
  redirect('/card');
}

export async function login(formData: FormData): Promise<void> {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) redirect('/?error=' + encodeURIComponent('Invalid email or password'));

  redirect(email.toLowerCase() === process.env.ADMIN_EMAIL?.toLowerCase() ? '/admin' : '/card');
}

export async function signInWithGoogle(formData: FormData): Promise<void> {
  const intent = formData.get('intent') === 'login' ? 'login' : 'signup';
  const origin = (await headers()).get('origin') ?? 'http://localhost:3000';
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${origin}/auth/callback?intent=${intent}` },
  });
  if (error || !data.url) {
    redirect('/?error=' + encodeURIComponent('Could not start Google sign-in'));
  }
  redirect(data.url);
}

export async function logout(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/');
}
