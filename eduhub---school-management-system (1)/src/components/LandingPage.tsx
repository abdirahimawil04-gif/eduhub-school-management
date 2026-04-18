import React from 'react';
import { useAuth } from '../lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GraduationCap, LogIn, ShieldCheck } from 'lucide-react';

export default function LandingPage() {
  const { login } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-4xl w-full text-center space-y-8">
        <div className="flex justify-center">
          <div className="p-4 bg-indigo-600 rounded-2xl shadow-xl shadow-indigo-200">
            <GraduationCap className="w-16 h-16 text-white" />
          </div>
        </div>
        
        <div className="space-y-4">
          <h1 className="text-5xl font-extrabold tracking-tight text-slate-900 sm:text-6xl">
            EduHub <span className="text-indigo-600">SMS</span>
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            The centralized school management system for modern institutions. 
            Manage students, teachers, academics, and finance with ease.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <FeatureCard 
            icon={<ShieldCheck className="w-6 h-6 text-indigo-600" />}
            title="Secure RBAC"
            description="Role-based access control for Admins, Teachers, and Students."
          />
          <FeatureCard 
            icon={<GraduationCap className="w-6 h-6 text-indigo-600" />}
            title="Academic Mgmt"
            description="Handle classes, subjects, and timetables effortlessly."
          />
          <FeatureCard 
            icon={<LogIn className="w-6 h-6 text-indigo-600" />}
            title="Real-time Data"
            description="Live attendance tracking and financial reporting."
          />
        </div>

        <div className="pt-8">
          <Button 
            onClick={login} 
            size="lg" 
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-6 text-lg rounded-full shadow-lg hover:shadow-indigo-200 transition-all gap-2"
          >
            <LogIn className="w-5 h-5" />
            Sign in with Google
          </Button>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <Card className="border-none shadow-md bg-white hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="w-12 h-12 bg-indigo-50 rounded-lg flex items-center justify-center mb-2">
          {icon}
        </div>
        <CardTitle className="text-lg font-bold">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
    </Card>
  );
}
