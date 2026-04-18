'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { 
  LayoutDashboard, Users, UserCheck, BookOpen, 
  CalendarClock, Calculator, Settings, LogOut,
  GraduationCap, ChevronDown
} from 'lucide-react';
import { useState } from 'react';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['super_admin', 'branch_admin', 'teacher', 'student'] },
  { name: 'Students', href: '/dashboard/students', icon: Users, roles: ['super_admin', 'branch_admin', 'teacher'] },
  { name: 'Teachers', href: '/dashboard/teachers', icon: UserCheck, roles: ['super_admin', 'branch_admin'] },
  { name: 'Academics', href: '/dashboard/academics', icon: BookOpen, roles: ['super_admin', 'branch_admin', 'teacher'] },
  { name: 'Attendance', href: '/dashboard/attendance', icon: CalendarClock, roles: ['super_admin', 'branch_admin', 'teacher'] },
  { name: 'Finance', href: '/dashboard/finance', icon: Calculator, roles: ['super_admin', 'branch_admin'] },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings, roles: ['super_admin', 'branch_admin'] },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(true);

  const filteredNav = navigation.filter(
    item => user && item.roles.includes(user.role)
  );

  return (
    <aside className={`fixed left-0 top-0 h-screen bg-white border-r border-slate-200 transition-all duration-300 z-40 ${isOpen ? 'w-64' : 'w-20'}`}>
      <div className="flex flex-col h-full">
        <div className="p-4 border-b border-slate-100">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            {isOpen && (
              <div>
                <h1 className="font-bold text-slate-900">SchoolFlow</h1>
                {user?.branch && (
                  <p className="text-xs text-slate-500">{user.branch.name}</p>
                )}
              </div>
            )}
          </Link>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {filteredNav.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-150 ${
                  isActive 
                    ? 'bg-blue-50 text-blue-600 font-medium' 
                    : 'text-slate-600 hover:bg-slate-100 hover:text-blue-600'
                }`}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {isOpen && <span>{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-slate-100">
          {user && (
            <div className={`flex items-center gap-3 ${isOpen ? 'px-2' : 'justify-center'}`}>
              <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-medium text-slate-600">
                  {user.first_name?.[0]}{user.last_name?.[0]}
                </span>
              </div>
              {isOpen && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">
                    {user.full_name}
                  </p>
                  <p className="text-xs text-slate-500 capitalize">{user.role_display}</p>
                </div>
              )}
              {isOpen && (
                <button
                  onClick={logout}
                  className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}