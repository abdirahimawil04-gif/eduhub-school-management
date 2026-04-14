import React, { useState } from 'react';
import { useFirestoreCollection } from '../lib/useFirestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bell, Send, Search, Trash2, Info, AlertTriangle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success';
  targetRole: string;
  createdAt: any;
}

export default function NotificationManagement() {
  const { profile } = useAuth();
  const { data: notifications, loading } = useFirestoreCollection<Notification>('notifications');
  const [searchTerm, setSearchTerm] = useState('');
  const [newNotification, setNewNotification] = useState({
    title: '',
    message: '',
    type: 'info' as const,
    targetRole: 'all',
  });

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'notifications'), {
        ...newNotification,
        schoolId: profile?.schoolId || 'default_school',
        createdAt: serverTimestamp(),
      });
      toast.success("Notification sent successfully");
      setNewNotification({ title: '', message: '', type: 'info', targetRole: 'all' });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'notifications');
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'warning': return <AlertTriangle className="text-orange-500" size={20} />;
      case 'success': return <CheckCircle className="text-green-500" size={20} />;
      default: return <Info className="text-blue-500" size={20} />;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Notifications</h1>
            <p className="text-slate-500 mt-1">Broadcast messages and alerts to the school community.</p>
          </div>
          <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-lg border border-slate-200 shadow-sm w-64">
            <Search className="text-slate-400" size={18} />
            <Input 
              placeholder="Search notifications..." 
              className="border-none h-8 focus-visible:ring-0 text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-10 text-slate-500">Loading notifications...</div>
          ) : notifications.length === 0 ? (
            <Card className="border-dashed border-2 bg-slate-50/50">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Bell className="w-12 h-12 text-slate-200 mb-4" />
                <p className="text-slate-500">No notifications sent yet.</p>
              </CardContent>
            </Card>
          ) : (
            notifications.map((notif) => (
              <Card key={notif.id} className="border-none shadow-sm hover:shadow-md transition-all">
                <CardContent className="p-6">
                  <div className="flex gap-4">
                    <div className="mt-1">{getIcon(notif.type)}</div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-bold text-slate-900">{notif.title}</h3>
                        <span className="text-xs text-slate-400">
                          {notif.createdAt?.toDate ? format(notif.createdAt.toDate(), 'MMM d, h:mm a') : 'Just now'}
                        </span>
                      </div>
                      <p className="text-slate-600 text-sm mb-3">{notif.message}</p>
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="text-[10px] uppercase tracking-wider">
                          To: {notif.targetRole}
                        </Badge>
                        <Button variant="ghost" size="sm" className="text-slate-400 hover:text-red-500 h-8 w-8 p-0">
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      <div className="space-y-6">
        <Card className="border-none shadow-lg bg-indigo-600 text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send size={20} />
              New Broadcast
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSendNotification} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider opacity-80">Title</label>
                <Input 
                  className="bg-indigo-500/50 border-indigo-400 text-white placeholder:text-indigo-200 focus-visible:ring-white"
                  placeholder="Notification Title"
                  value={newNotification.title}
                  onChange={(e) => setNewNotification({...newNotification, title: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider opacity-80">Message</label>
                <textarea 
                  className="flex min-h-[100px] w-full rounded-md border border-indigo-400 bg-indigo-500/50 px-3 py-2 text-sm ring-offset-white placeholder:text-indigo-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Write your message here..."
                  value={newNotification.message}
                  onChange={(e) => setNewNotification({...newNotification, message: e.target.value})}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider opacity-80">Type</label>
                  <select 
                    className="flex h-10 w-full rounded-md border border-indigo-400 bg-indigo-500/50 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                    value={newNotification.type}
                    onChange={(e) => setNewNotification({...newNotification, type: e.target.value as any})}
                  >
                    <option value="info">Info</option>
                    <option value="warning">Warning</option>
                    <option value="success">Success</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider opacity-80">Target</label>
                  <select 
                    className="flex h-10 w-full rounded-md border border-indigo-400 bg-indigo-500/50 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                    value={newNotification.targetRole}
                    onChange={(e) => setNewNotification({...newNotification, targetRole: e.target.value})}
                  >
                    <option value="all">All Users</option>
                    <option value="teacher">Teachers</option>
                    <option value="student">Students</option>
                    <option value="school_admin">Admins</option>
                  </select>
                </div>
              </div>
              <Button type="submit" className="w-full bg-white text-indigo-600 hover:bg-indigo-50 font-bold">
                Send Notification
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
