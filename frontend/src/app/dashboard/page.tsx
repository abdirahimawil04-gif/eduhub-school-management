'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { Users, UserCheck, GraduationCap, DollarSign, TrendingUp, Calendar } from 'lucide-react';

interface Stats {
  students?: number;
  teachers?: number;
  classes?: number;
  total_branches?: number;
  total_students?: number;
  total_teachers?: number;
}

interface FinanceStats {
  total_invoiced: number;
  total_collected: number;
  total_pending: number;
  paid_invoices: number;
  partial_invoices: number;
  overdue_invoices: number;
}

const cardData = [
  { title: 'Students', icon: Users, color: 'blue', key: 'students' },
  { title: 'Teachers', icon: UserCheck, color: 'emerald', key: 'teachers' },
  { title: 'Classes', icon: GraduationCap, color: 'purple', key: 'classes' },
  { title: 'Revenue', icon: DollarSign, color: 'amber', key: 'revenue' },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [finance, setFinance] = useState<FinanceStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (user?.role === 'super_admin') {
          const res = await api.get('/accounts/me/dashboard/');
          setStats(res.data.stats);
        } else {
          const [studentRes, teacherRes, financeRes] = await Promise.all([
            api.get('/students/?is_active=true'),
            api.get('/teachers/?is_active=true'),
            api.get('/finance/invoices/dashboard/').catch(() => ({ data: null })),
          ]);
          setStats({
            students: studentRes.data.count || studentRes.data.length,
            teachers: teacherRes.data.count || teacherRes.data.length,
          });
          if (financeRes.data) {
            setFinance(financeRes.data);
          }
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Welcome back, {user?.first_name}!</h1>
          <p className="text-slate-500 mt-1">Here's what's happening at your school today.</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-500 bg-white px-4 py-2 rounded-lg border border-slate-200">
          <Calendar className="w-4 h-4" />
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {user?.role === 'super_admin' ? (
          <>
            <div className="card flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Total Branches</p>
                <p className="text-2xl font-bold text-slate-900">{stats?.total_branches || 0}</p>
              </div>
            </div>
            <div className="card flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Total Students</p>
                <p className="text-2xl font-bold text-slate-900">{stats?.total_students || 0}</p>
              </div>
            </div>
            <div className="card flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <UserCheck className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Total Teachers</p>
                <p className="text-2xl font-bold text-slate-900">{stats?.total_teachers || 0}</p>
              </div>
            </div>
            <div className="card flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Total Revenue</p>
                <p className="text-2xl font-bold text-slate-900">$0</p>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="card flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Total Students</p>
                <p className="text-2xl font-bold text-slate-900">{stats?.students || 0}</p>
              </div>
            </div>
            <div className="card flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                <UserCheck className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Total Teachers</p>
                <p className="text-2xl font-bold text-slate-900">{stats?.teachers || 0}</p>
              </div>
            </div>
            <div className="card flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Classes</p>
                <p className="text-2xl font-bold text-slate-900">{stats?.classes || 0}</p>
              </div>
            </div>
            <div className="card flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Revenue</p>
                <p className="text-2xl font-bold text-slate-900">
                  ${finance?.total_collected?.toLocaleString() || '0'}
                </p>
              </div>
            </div>
          </>
        )}
      </div>

      {finance && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card">
            <h3 className="text-sm font-medium text-slate-500 mb-2">Total Invoiced</h3>
            <p className="text-2xl font-bold text-slate-900">${finance.total_invoiced?.toLocaleString()}</p>
          </div>
          <div className="card">
            <h3 className="text-sm font-medium text-slate-500 mb-2">Total Collected</h3>
            <p className="text-2xl font-bold text-emerald-600">${finance.total_collected?.toLocaleString()}</p>
          </div>
          <div className="card">
            <h3 className="text-sm font-medium text-slate-500 mb-2">Total Pending</h3>
            <p className="text-2xl font-bold text-amber-600">${finance.total_pending?.toLocaleString()}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            <a href="/dashboard/students" className="p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
              <Users className="w-6 h-6 text-blue-600 mb-2" />
              <p className="text-sm font-medium text-blue-700">Manage Students</p>
            </a>
            <a href="/dashboard/teachers" className="p-4 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors">
              <UserCheck className="w-6 h-6 text-emerald-600 mb-2" />
              <p className="text-sm font-medium text-emerald-700">Manage Teachers</p>
            </a>
            <a href="/dashboard/attendance" className="p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
              <Calendar className="w-6 h-6 text-purple-600 mb-2" />
              <p className="text-sm font-medium text-purple-700">Mark Attendance</p>
            </a>
            <a href="/dashboard/finance" className="p-4 bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors">
              <DollarSign className="w-6 h-6 text-amber-600 mb-2" />
              <p className="text-sm font-medium text-amber-700">View Finance</p>
            </a>
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Recent Activity</h3>
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-sm">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-slate-600">System initialized successfully</span>
              <span className="text-slate-400 ml-auto">Just now</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}