import { createClient } from '@/utils/supabase/server'
import { logout } from '@/app/auth/actions'
import Sidebar from '@/components/Sidebar'
import { redirect } from 'next/navigation'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get user profile role
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .single()

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col md:flex-row relative overflow-hidden transition-colors duration-200">
      {/* Background radial effects */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-900/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-900/5 blur-[120px] pointer-events-none" />

      {/* Sidebar Component */}
      <Sidebar
        role="user"
        fullName={profile?.full_name || 'Active User'}
        email={user.email || ''}
        logoutAction={logout}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 z-10">
        <header className="h-16 border-b border-slate-200 dark:border-slate-900 flex items-center justify-between px-8 bg-white/50 dark:bg-slate-950/30 backdrop-blur-md hidden md:flex transition-colors duration-200">
          <h2 className="text-xs font-bold text-slate-400 dark:text-slate-500 tracking-wider uppercase">
            Parking Management Control Cabin
          </h2>
          <span className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs font-bold px-3.5 py-1.5 rounded-full uppercase tracking-wider">
            {profile?.role || 'User'} Mode
          </span>
        </header>

        <div className="flex-grow overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  )
}
