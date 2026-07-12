'use server';

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

export async function logout(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/');
}
