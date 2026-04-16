import React, { useState } from 'react';
import { AuthProvider, useAuth } from './lib/AuthContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import LandingPage from './components/LandingPage';
import DashboardLayout from './components/DashboardLayout';
import AdminDashboard from './components/AdminDashboard';
import StudentManagement from './components/StudentManagement';
import TeacherManagement from './components/TeacherManagement';
import ClassManagement from './components/ClassManagement';
import AttendanceManagement from './components/AttendanceManagement';
import TimetableManagement from './components/TimetableManagement';
import FinanceManagement from './components/FinanceManagement';
import ReportsManagement from './components/ReportsManagement';
import NotificationManagement from './components/NotificationManagement';
import SchoolManagement from './components/SchoolManagement';
import UserManagement from './components/UserManagement';
import SettingsPage from './components/SettingsPage';
import PlaceholderView from './components/PlaceholderView';
import { Toaster } from 'sonner';
import { 
  Users, 
  UserCheck, 
  BookOpen, 
  ClipboardList, 
  Calendar, 
  CreditCard, 
  FileText, 
  Bell, 
  School, 
  Shield, 
  Settings 
} from 'lucide-react';

function AppContent() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user) {
    return <LandingPage />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <AdminDashboard />;
      case 'students':
        return <StudentManagement />;
      case 'teachers':
        return <TeacherManagement />;
      case 'classes':
        return <ClassManagement />;
      case 'attendance':
        return <AttendanceManagement />;
      case 'timetable':
        return <TimetableManagement />;
      case 'finance':
        return <FinanceManagement />;
      case 'reports':
        return <ReportsManagement />;
      case 'notifications':
        return <NotificationManagement />;
      case 'schools':
        return <SchoolManagement />;
      case 'users':
        return <UserManagement />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <AdminDashboard />;
    }
  };

  return (
    <DashboardLayout activeTab={activeTab} setActiveTab={setActiveTab}>
      {renderContent()}
    </DashboardLayout>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppContent />
        <Toaster position="top-right" />
      </AuthProvider>
    </ErrorBoundary>
  );
}
