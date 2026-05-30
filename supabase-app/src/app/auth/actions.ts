'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export async function login(currentState: any, formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'Email and password are required' }
  }

  const supabase = createClient()

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: error.message }
  }

  // Fetch the role from profiles table
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', data.user.id)
    .single()

  if (profileError || !profile) {
    // If the profile doesn't exist yet (e.g. trigger failed or slow), default to standard user dashboard
    redirect('/dashboard')
  }

  if (profile.role === 'admin') {
    redirect('/admin/dashboard')
  } else {
    redirect('/dashboard')
  }
}

export async function register(currentState: any, formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const full_name = formData.get('full_name') as string
  const phone = formData.get('phone') as string

  if (!email || !password || !full_name) {
    return { error: 'Full Name, Email, and Password are required' }
  }

  const supabase = createClient()

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name,
        phone,
      },
    },
  })

  if (error) {
    return { error: error.message }
  }

  // After registration, redirect to login page with a success message
  redirect('/login?registered=true')
}

export async function logout() {
  const supabase = createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
