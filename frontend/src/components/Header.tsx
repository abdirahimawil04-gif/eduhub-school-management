'use client';

import { useAuth } from '@/contexts/AuthContext';
import { Bell, Search, Menu } from 'lucide-react';

interface HeaderProps {
  title: string;
  breadcrumbs?: { label: string; href?: string }[];
}

export default function Header({ title, breadcrumbs }: HeaderProps) {
  const { user } = useAuth();

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
        {breadcrumbs && (
          <div className="flex items-center gap-2 text-sm text-slate-500">
            {breadcrumbs.map((crumb, index) => (
              <span key={index} className="flex items-center gap-2">
                {index > 0 && <span>/</span>}
                {crumb.href ? (
                  <a href={crumb.href} className="hover:text-blue-600">{crumb.label}</a>
                ) : (
                  <span>{crumb.label}</span>
                )}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-4">
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search..."
            className="pl-10 pr-4 py-2 bg-slate-100 rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-lg">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        {user?.branch && (
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-lg">
            <span className="text-sm font-medium text-blue-700">{user.branch.name}</span>
            <span className="text-xs text-blue-500">({user.branch.code})</span>
          </div>
        )}
      </div>
    </header>
  );
}