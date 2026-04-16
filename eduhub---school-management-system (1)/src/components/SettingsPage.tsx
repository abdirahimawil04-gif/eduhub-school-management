import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '../lib/AuthContext';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { toast } from 'sonner';
import { 
  Settings as SettingsIcon, 
  User, 
  Bell, 
  Shield, 
  Globe, 
  Database,
  Save,
  School as SchoolIcon
} from 'lucide-react';

type SettingsTab = 'profile' | 'school' | 'notifications' | 'security';

export default function SettingsPage() {
  const { profile, school, refreshProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [isSaving, setIsSaving] = useState(false);

  // Profile state
  const [displayName, setDisplayName] = useState(profile?.displayName || '');
  const [bio, setBio] = useState(profile?.bio || '');

  // School state
  const [schoolName, setSchoolName] = useState(school?.name || '');
  const [schoolAddress, setSchoolAddress] = useState(school?.address || '');
  const [schoolEmail, setSchoolEmail] = useState(school?.contactEmail || '');

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName);
      setBio(profile.bio || '');
    }
    if (school) {
      setSchoolName(school.name);
      setSchoolAddress(school.address || '');
      setSchoolEmail(school.contactEmail || '');
    }
  }, [profile, school]);

  const handleSaveProfile = async () => {
    if (!profile) return;
    setIsSaving(true);
    try {
      await updateDoc(doc(db, 'users', profile.uid), {
        displayName,
        bio
      });
      await refreshProfile();
      toast.success("Profile updated successfully");
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${profile.uid}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveSchool = async () => {
    if (!school) return;
    setIsSaving(true);
    try {
      await updateDoc(doc(db, 'schools', school.id), {
        name: schoolName,
        address: schoolAddress,
        contactEmail: schoolEmail
      });
      await refreshProfile();
      toast.success("School settings updated successfully");
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `schools/${school.id}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">System Settings</h1>
          <p className="text-slate-500 mt-1">Configure your personal preferences and school-wide settings.</p>
        </div>
        <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600">
          <SettingsIcon size={24} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="space-y-2">
          <Button 
            variant="ghost" 
            onClick={() => setActiveTab('profile')}
            className={`w-full justify-start gap-3 transition-all ${activeTab === 'profile' ? 'bg-white shadow-sm font-semibold text-indigo-600' : 'text-slate-600 hover:bg-white'}`}
          >
            <User size={18} />
            Profile Settings
          </Button>
          {(profile?.role === 'super_admin' || profile?.role === 'school_admin') && (
            <Button 
              variant="ghost" 
              onClick={() => setActiveTab('school')}
              className={`w-full justify-start gap-3 transition-all ${activeTab === 'school' ? 'bg-white shadow-sm font-semibold text-indigo-600' : 'text-slate-600 hover:bg-white'}`}
            >
              <SchoolIcon size={18} />
              School Settings
            </Button>
          )}
          <Button 
            variant="ghost" 
            onClick={() => setActiveTab('notifications')}
            className={`w-full justify-start gap-3 transition-all ${activeTab === 'notifications' ? 'bg-white shadow-sm font-semibold text-indigo-600' : 'text-slate-600 hover:bg-white'}`}
          >
            <Bell size={18} />
            Notifications
          </Button>
          <Button 
            variant="ghost" 
            onClick={() => setActiveTab('security')}
            className={`w-full justify-start gap-3 transition-all ${activeTab === 'security' ? 'bg-white shadow-sm font-semibold text-indigo-600' : 'text-slate-600 hover:bg-white'}`}
          >
            <Shield size={18} />
            Security
          </Button>
        </div>

        <div className="md:col-span-2 space-y-6">
          {activeTab === 'profile' && (
            <Card className="border-none shadow-sm overflow-hidden">
              <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Update your personal details and how others see you.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Display Name</Label>
                    <Input 
                      id="name" 
                      value={displayName} 
                      onChange={(e) => setDisplayName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input id="email" value={profile?.email} disabled className="bg-slate-50" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <textarea 
                    id="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="flex min-h-[100px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="A short description about yourself..."
                  />
                </div>
                <Button 
                  onClick={handleSaveProfile} 
                  disabled={isSaving}
                  className="bg-indigo-600 hover:bg-indigo-700 gap-2 w-full sm:w-auto"
                >
                  <Save size={16} />
                  {isSaving ? 'Saving...' : 'Save Profile'}
                </Button>
              </CardContent>
            </Card>
          )}

          {activeTab === 'school' && (
            <Card className="border-none shadow-sm overflow-hidden">
              <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                <CardTitle>School Settings</CardTitle>
                <CardDescription>Manage your school's identity and contact information.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div className="space-y-2">
                  <Label htmlFor="schoolName">School Name</Label>
                  <Input 
                    id="schoolName" 
                    value={schoolName} 
                    onChange={(e) => setSchoolName(e.target.value)}
                    placeholder="e.g. EduHub Academy"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="schoolEmail">Contact Email</Label>
                  <Input 
                    id="schoolEmail" 
                    type="email"
                    value={schoolEmail} 
                    onChange={(e) => setSchoolEmail(e.target.value)}
                    placeholder="info@yourschool.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="schoolAddress">Address</Label>
                  <textarea 
                    id="schoolAddress"
                    value={schoolAddress}
                    onChange={(e) => setSchoolAddress(e.target.value)}
                    className="flex min-h-[80px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Full school address..."
                  />
                </div>
                <Button 
                  onClick={handleSaveSchool} 
                  disabled={isSaving}
                  className="bg-indigo-600 hover:bg-indigo-700 gap-2 w-full sm:w-auto"
                >
                  <Save size={16} />
                  {isSaving ? 'Saving...' : 'Save School Settings'}
                </Button>
              </CardContent>
            </Card>
          )}

          {activeTab === 'notifications' && (
            <Card className="border-none shadow-sm overflow-hidden">
              <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                <CardTitle>Preferences</CardTitle>
                <CardDescription>Manage your system notifications and display preferences.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Email Notifications</Label>
                    <p className="text-xs text-slate-500">Receive daily summaries and urgent alerts via email.</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Desktop Alerts</Label>
                    <p className="text-xs text-slate-500">Show browser notifications for new messages.</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
