'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { User, Lock, Bell, Palette, Shield } from 'lucide-react';

export default function SettingsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'notifications' | 'appearance'>('profile');

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'appearance', label: 'Appearance', icon: Palette },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-500">Manage your account and preferences</p>
      </div>

      <div className="flex gap-6">
        <div className="w-64">
          <nav className="space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-50 text-blue-600 font-medium'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex-1">
          <div className="card">
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold">Profile Information</h2>
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-2xl font-medium text-blue-600">
                      {user?.first_name?.[0]}{user?.last_name?.[0]}
                    </span>
                  </div>
                  <div>
                    <button className="btn-secondary text-sm">Change Photo</button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">First Name</label>
                    <input type="text" defaultValue={user?.first_name} className="input" />
                  </div>
                  <div>
                    <label className="label">Last Name</label>
                    <input type="text" defaultValue={user?.last_name} className="input" />
                  </div>
                  <div>
                    <label className="label">Email</label>
                    <input type="email" defaultValue={user?.email} className="input" disabled />
                  </div>
                  <div>
                    <label className="label">Phone</label>
                    <input type="text" defaultValue={user?.phone || ''} className="input" />
                  </div>
                </div>
                <div>
                  <label className="label">Role</label>
                  <input type="text" defaultValue={user?.role_display} className="input" disabled />
                </div>
                <div className="flex justify-end">
                  <button className="btn-primary">Save Changes</button>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold">Change Password</h2>
                <div className="space-y-4 max-w-md">
                  <div>
                    <label className="label">Current Password</label>
                    <input type="password" className="input" />
                  </div>
                  <div>
                    <label className="label">New Password</label>
                    <input type="password" className="input" />
                  </div>
                  <div>
                    <label className="label">Confirm New Password</label>
                    <input type="password" className="input" />
                  </div>
                  <button className="btn-primary">Update Password</button>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold">Notification Preferences</h2>
                <div className="space-y-4">
                  {['Email notifications', 'SMS notifications', 'Push notifications'].map((item) => (
                    <label key={item} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg cursor-pointer">
                      <span>{item}</span>
                      <input type="checkbox" defaultChecked className="rounded text-blue-500" />
                    </label>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'appearance' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold">Appearance Settings</h2>
                <div className="space-y-4">
                  <div>
                    <label className="label">Theme</label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="theme" defaultChecked className="text-blue-500" />
                        <span>Light</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="theme" className="text-blue-500" />
                        <span>Dark</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="theme" className="text-blue-500" />
                        <span>System</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}