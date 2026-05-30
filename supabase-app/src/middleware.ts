import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'

export async function middleware(request: NextRequest) {
  const { supabaseResponse, user, supabase } = await updateSession(request)

  const url = request.nextUrl.clone()

  // Protect /dashboard and /admin routes
  const isDashboardRoute = url.pathname.startsWith('/dashboard')
  const isAdminRoute = url.pathname.startsWith('/admin')

  if (isDashboardRoute || isAdminRoute) {
    if (!user) {
      // Not logged in, redirect to login
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }

    // Logged in, fetch user's role from profiles table
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (error || !profile) {
      // Profile not found, clear session and redirect to login
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }

    const role = profile.role

    if (isAdminRoute && role !== 'admin') {
      // Non-admin trying to access /admin -> redirect to user dashboard
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }

    if (isDashboardRoute && role !== 'user') {
      // Non-user trying to access /dashboard -> redirect to admin dashboard
      url.pathname = '/admin/dashboard'
      return NextResponse.redirect(url)
    }
  }

  // Avoid redirect loop if logged in user visits login or register
  const isAuthRoute = url.pathname === '/login' || url.pathname === '/register'
  if (isAuthRoute && user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    
    if (profile) {
      if (profile.role === 'admin') {
        url.pathname = '/admin/dashboard'
        return NextResponse.redirect(url)
      } else if (profile.role === 'user') {
        url.pathname = '/dashboard'
        return NextResponse.redirect(url)
      }
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api routes (optional, but let's exclude static assets)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
