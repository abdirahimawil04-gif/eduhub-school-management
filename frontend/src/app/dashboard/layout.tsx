'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const getPageTitle = () => {
    const paths: { [key: string]: string } = {
      '/dashboard': 'Dashboard',
      '/dashboard/students': 'Students',
      '/dashboard/teachers': 'Teachers',
      '/dashboard/academics': 'Academics',
      '/dashboard/attendance': 'Attendance',
      '/dashboard/finance': 'Finance',
      '/dashboard/settings': 'Settings',
    };
    return paths[pathname] || 'Dashboard';
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <div className="ml-64">
        <Header title={getPageTitle()} />
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}