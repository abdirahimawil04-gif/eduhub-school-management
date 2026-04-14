import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  UserCheck, 
  BookOpen, 
  CreditCard, 
  Settings, 
  LogOut,
  Menu,
  X,
  GraduationCap,
  Calendar,
  FileText,
  Bell,
  School as SchoolIcon,
  Shield,
  ClipboardList,
  Search,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';

export default function DashboardLayout({ children, activeTab, setActiveTab }: { children: React.ReactNode, activeTab: string, setActiveTab: (tab: string) => void }) {
  const { profile, school, logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, section: 'Main Menu' },
    { id: 'students', label: 'Students', icon: Users, section: 'Main Menu' },
    { id: 'teachers', label: 'Teachers', icon: UserCheck, section: 'Main Menu' },
    { id: 'classes', label: 'Classes', icon: BookOpen, section: 'Main Menu' },
    { id: 'attendance', label: 'Attendance', icon: ClipboardList, section: 'Main Menu' },
    { id: 'timetable', label: 'Timetable', icon: Calendar, section: 'Main Menu' },
    
    { id: 'finance', label: 'Finance', icon: CreditCard, section: 'Management' },
    { id: 'reports', label: 'Reports', icon: FileText, section: 'Management' },
    { id: 'notifications', label: 'Notifications', icon: Bell, section: 'Management' },
    
    { id: 'schools', label: 'Schools', icon: SchoolIcon, section: 'System', roles: ['super_admin'] },
    { id: 'users', label: 'Users & Roles', icon: Shield, section: 'System', roles: ['super_admin', 'school_admin'] },
    { id: 'settings', label: 'Settings', icon: Settings, section: 'System' },
  ];

  const sections = ['Main Menu', 'Management', 'System'];

  const filteredMenuItems = menuItems.filter(item => {
    if (!item.roles) return true;
    return item.roles.includes(profile?.role || '');
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans text-slate-900">
      {/* Sidebar */}
      <AnimatePresence mode="wait">
        {isSidebarOpen && (
          <motion.aside 
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            className="fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-200 shadow-xl lg:relative lg:translate-x-0"
          >
            <div className="h-full flex flex-col">
              {/* Logo Section */}
              <div className="p-6 flex items-center gap-3 border-b border-slate-50">
                <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                  <GraduationCap size={24} />
                </div>
                <div>
                  <h2 className="font-bold text-xl tracking-tight text-slate-900">EduHub</h2>
                  <p className="text-[10px] uppercase tracking-widest font-bold text-indigo-600 opacity-80">Management System</p>
                </div>
                <button 
                  onClick={() => setIsSidebarOpen(false)}
                  className="lg:hidden ml-auto p-2 text-slate-400 hover:text-slate-600"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Navigation */}
              <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-8 custom-scrollbar">
                {sections.map(section => {
                  const items = filteredMenuItems.filter(item => item.section === section);
                  if (items.length === 0) return null;

                  return (
                    <div key={section} className="space-y-2">
                      <h3 className="px-4 text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">{section}</h3>
                      <div className="space-y-1">
                        {items.map((item) => (
                          <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                              activeTab === item.id 
                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100 font-medium' 
                                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                            }`}
                          >
                            <item.icon size={20} className={activeTab === item.id ? 'text-white' : 'text-slate-400 group-hover:text-indigo-600 transition-colors'} />
                            <span className="flex-1 text-left text-sm">{item.label}</span>
                            {activeTab === item.id && <ChevronRight size={14} className="opacity-50" />}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </nav>

              {/* User Profile Footer */}
              <div className="p-4 border-t border-slate-50">
                <div className="bg-slate-50 rounded-2xl p-4 flex items-center gap-3">
                  <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                    <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${profile?.displayName}`} />
                    <AvatarFallback>{profile?.displayName?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate">{profile?.displayName}</p>
                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">{profile?.role?.replace('_', ' ')}</p>
                  </div>
                  <button 
                    onClick={logout}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Logout"
                  >
                    <LogOut size={18} />
                  </button>
                </div>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center gap-4">
            {!isSidebarOpen && (
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <Menu size={24} />
              </button>
            )}
            <div>
              <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <span className="text-indigo-600">{school?.name || 'EduHub Academy'}</span>
                <span className="text-slate-300 font-light">/</span>
                <span className="capitalize text-slate-500 font-medium">{activeTab.replace('-', ' ')}</span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-xl border border-transparent focus-within:border-indigo-200 focus-within:bg-white transition-all w-64">
              <Search size={18} className="text-slate-400" />
              <input 
                type="text" 
                placeholder="Search anything..." 
                className="bg-transparent border-none outline-none text-sm w-full placeholder:text-slate-400"
              />
            </div>

            <div className="flex items-center gap-3">
              <button className="relative p-2.5 text-slate-500 hover:bg-slate-100 rounded-xl transition-colors">
                <Bell size={20} />
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
              </button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 p-1 pr-3 hover:bg-slate-100 rounded-full transition-colors border border-slate-100">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${profile?.displayName}`} />
                      <AvatarFallback>{profile?.displayName?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span className="text-xs font-bold text-slate-700 hidden sm:inline-block">Account</span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 rounded-xl p-2 shadow-xl border-slate-100">
                  <DropdownMenuLabel className="px-3 py-2">
                    <p className="text-sm font-bold">{profile?.displayName}</p>
                    <p className="text-[10px] text-slate-500 font-medium">{profile?.email}</p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-slate-100" />
                  <DropdownMenuItem onClick={() => setActiveTab('settings')} className="rounded-lg gap-2 cursor-pointer py-2.5">
                    <Settings size={16} /> Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={logout} className="rounded-lg gap-2 cursor-pointer py-2.5 text-red-600 focus:text-red-600 focus:bg-red-50">
                    <LogOut size={16} /> Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
