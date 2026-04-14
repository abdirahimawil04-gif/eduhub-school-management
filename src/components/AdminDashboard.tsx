import React, { useMemo } from 'react';
import { where } from 'firebase/firestore';
import { useAuth } from '../lib/AuthContext';
import { useFirestoreCollection } from '../lib/useFirestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  Users, 
  UserCheck, 
  BookOpen, 
  TrendingUp, 
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  MoreHorizontal,
  Plus
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Student {
  id: string;
  admissionNumber: string;
  displayName: string;
  status: 'active' | 'inactive';
}

interface Teacher {
  id: string;
  displayName: string;
  specialization: string;
}

interface Class {
  id: string;
  name: string;
}

interface AttendanceRecord {
  id: string;
  status: 'present' | 'absent' | 'late';
  date: string;
}

interface FeeRecord {
  id: string;
  amount: number;
  status: 'paid' | 'pending' | 'overdue';
}

export default function AdminDashboard() {
  const { profile, school } = useAuth();
  const { data: students, loading: studentsLoading } = useFirestoreCollection<Student>('students');
  const { data: teachers } = useFirestoreCollection<Teacher>('teachers');
  const { data: classes } = useFirestoreCollection<Class>('classes');
  const { data: attendanceRecords } = useFirestoreCollection<AttendanceRecord>('attendance', [where('date', '==', new Date().toISOString().split('T')[0])], false);
  const { data: fees } = useFirestoreCollection<FeeRecord>('fees', [], false);

  const activeStudents = useMemo(() => 
    students.filter((s: Student) => s.status === 'active').length, 
    [students]
  );

  const attendanceRate = useMemo(() => {
    if (attendanceRecords.length === 0) return 94.2;
    const present = attendanceRecords.filter((r: AttendanceRecord) => r.status === 'present').length;
    return Math.round((present / attendanceRecords.length) * 100 * 10) / 10;
  }, [attendanceRecords]);

  const totalRevenue = useMemo(() => 
    fees.filter((f: FeeRecord) => f.status === 'paid').reduce((sum: number, f: FeeRecord) => sum + (f.amount || 0), 0),
    [fees]
  );

  const pendingFees = useMemo(() => 
    fees.filter((f: FeeRecord) => f.status === 'pending' || f.status === 'overdue').reduce((sum: number, f: FeeRecord) => sum + (f.amount || 0), 0),
    [fees]
  );

  const stats = [
    { 
      label: 'Total Students', 
      value: activeStudents, 
      change: '+12%', 
      trend: 'up',
      icon: <Users size={20} />, 
      color: 'text-blue-600',
      bg: 'bg-blue-50' 
    },
    { 
      label: 'Total Teachers', 
      value: teachers.length || 0, 
      change: '+2', 
      trend: 'up',
      icon: <UserCheck size={20} />, 
      color: 'text-emerald-600',
      bg: 'bg-emerald-50' 
    },
    { 
      label: 'Active Classes', 
      value: classes.length || 0, 
      change: '0%', 
      trend: 'neutral',
      icon: <BookOpen size={20} />, 
      color: 'text-violet-600',
      bg: 'bg-violet-50' 
    },
    { 
      label: 'Attendance', 
      value: `${attendanceRate}%`, 
      change: attendanceRate >= 90 ? '-0.5%' : '+1.2%', 
      trend: attendanceRate >= 90 ? 'down' : 'up',
      icon: <TrendingUp size={20} />, 
      color: 'text-amber-600',
      bg: 'bg-amber-50' 
    },
  ];

  const feeStatusData = useMemo(() => {
    if (fees.length === 0) {
      return [
        { name: 'Paid', value: 65, color: '#4f46e5' },
        { name: 'Pending', value: 25, color: '#f59e0b' },
        { name: 'Overdue', value: 10, color: '#ef4444' },
      ];
    }
    const paid = fees.filter((f: FeeRecord) => f.status === 'paid').length;
    const pending = fees.filter((f: FeeRecord) => f.status === 'pending').length;
    const overdue = fees.filter((f: FeeRecord) => f.status === 'overdue').length;
    const total = paid + pending + overdue || 1;
    return [
      { name: 'Paid', value: Math.round((paid / total) * 100), color: '#4f46e5' },
      { name: 'Pending', value: Math.round((pending / total) * 100), color: '#f59e0b' },
      { name: 'Overdue', value: Math.round((overdue / total) * 100), color: '#ef4444' },
    ];
  }, [fees]);

  const revenueData = [
    { name: 'Jan', revenue: 4500 },
    { name: 'Feb', revenue: 5200 },
    { name: 'Mar', revenue: 4800 },
    { name: 'Apr', revenue: 6100 },
    { name: 'May', revenue: 5900 },
    { name: 'Jun', revenue: totalRevenue || 7200 },
  ];

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <Badge variant="outline" className="mb-2 border-indigo-200 text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full font-bold text-[10px] uppercase tracking-wider">
            {school?.name || 'EduHub Academy'}
          </Badge>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Dashboard Overview</h1>
          <p className="text-slate-500 mt-1 font-medium">Real-time insights into your institution's performance.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="rounded-xl border-slate-200 font-bold text-slate-600">
            Export Report
          </Button>
          <Button className="bg-indigo-600 hover:bg-indigo-700 rounded-xl font-bold shadow-lg shadow-indigo-100 gap-2">
            <Plus size={18} />
            Quick Action
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <Card key={i} className="border-none shadow-sm hover:shadow-md transition-all duration-300 group overflow-hidden relative">
            <div className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full opacity-10 transition-transform group-hover:scale-150 ${stat.bg}`} />
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color}`}>
                  {stat.icon}
                </div>
                <button className="text-slate-300 hover:text-slate-600 transition-colors">
                  <MoreHorizontal size={20} />
                </button>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">{stat.label}</p>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-3xl font-black text-slate-900">{stat.value}</h3>
                  <span className={`text-xs font-bold flex items-center gap-0.5 ${
                    stat.trend === 'up' ? 'text-emerald-600' : 
                    stat.trend === 'down' ? 'text-red-600' : 'text-slate-400'
                  }`}>
                    {stat.trend === 'up' && <ArrowUpRight size={14} />}
                    {stat.trend === 'down' && <ArrowDownRight size={14} />}
                    {stat.change}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 border-none shadow-sm overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-7">
            <div>
              <CardTitle className="text-xl font-black text-slate-900">Revenue Growth</CardTitle>
              <CardDescription className="font-medium">Monthly fee collection trends</CardDescription>
            </div>
            <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-lg">
              <Button variant="ghost" size="sm" className="h-8 rounded-md text-xs font-bold">1W</Button>
              <Button variant="ghost" size="sm" className="h-8 rounded-md text-xs font-bold bg-white shadow-sm text-indigo-600">1M</Button>
              <Button variant="ghost" size="sm" className="h-8 rounded-md text-xs font-bold">1Y</Button>
            </div>
          </CardHeader>
          <CardContent className="h-[350px] px-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 600}} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 600}}
                  tickFormatter={(value) => `$${value}`}
                />
                <Tooltip 
                  contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '12px'}}
                  itemStyle={{fontWeight: 700, color: '#4f46e5'}}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#4f46e5" 
                  strokeWidth={4}
                  fillOpacity={1} 
                  fill="url(#colorRevenue)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <div className="space-y-8">
          <Card className="border-none shadow-sm overflow-hidden">
            <CardHeader>
              <CardTitle className="text-xl font-black text-slate-900">Fee Status</CardTitle>
              <CardDescription className="font-medium">Current collection distribution</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[200px] relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={feeStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={8}
                      dataKey="value"
                    >
                      {feeStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-black text-slate-900">{feeStatusData[0].value}%</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Paid</span>
                </div>
              </div>
              <div className="mt-6 space-y-3">
                {feeStatusData.map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-50/50 border border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full" style={{backgroundColor: item.color}} />
                      <span className="text-sm font-bold text-slate-700">{item.name}</span>
                    </div>
                    <span className="text-sm font-black text-slate-900">{item.value}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl font-black text-slate-900">Quick Contacts</CardTitle>
            <CardDescription className="font-medium">Recently added staff and teachers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {teachers.slice(0, 4).map((teacher: Teacher) => (
                <div key={teacher.id} className="flex items-center justify-between p-4 rounded-2xl bg-white border border-slate-100 hover:border-indigo-100 hover:shadow-sm transition-all group">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-black text-lg group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                      {teacher.displayName?.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">{teacher.displayName}</p>
                      <p className="text-xs text-slate-500 font-medium">{teacher.specialization}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="rounded-lg text-indigo-600 font-bold hover:bg-indigo-50">Profile</Button>
                </div>
              ))}
              {teachers.length === 0 && (
                <div className="text-center py-12 text-slate-400 font-medium">No teachers added yet.</div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl font-black text-slate-900">Recent Classes</CardTitle>
            <CardDescription className="font-medium">Active classes in your institution</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {classes.slice(0, 4).map((cls: Class) => (
                <div key={cls.id} className="flex items-center justify-between p-4 rounded-2xl bg-white border border-slate-100 hover:border-violet-100 hover:shadow-sm transition-all group">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-violet-50 flex items-center justify-center text-violet-600 font-black text-lg group-hover:bg-violet-600 group-hover:text-white transition-colors">
                      <BookOpen size={20} />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">{cls.name}</p>
                      <p className="text-xs text-slate-500 font-medium">Active Class</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="rounded-lg text-violet-600 font-bold hover:bg-violet-50">View</Button>
                </div>
              ))}
              {classes.length === 0 && (
                <div className="text-center py-12 text-slate-400 font-medium">No classes created yet.</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}