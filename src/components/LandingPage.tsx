import React, { useState } from 'react';
import { useAuth } from '../lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { GraduationCap, LogIn, ShieldCheck } from 'lucide-react';

export default function LandingPage() {
  const { login, signup } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await signup(email, password, name || 'User');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      {isLogin ? (
        <div className="max-w-4xl w-full text-center space-y-8">
          <div className="flex justify-center">
            <div className="p-4 bg-indigo-600 rounded-2xl shadow-xl shadow-indigo-200">
              <GraduationCap className="w-16 h-16 text-white" />
            </div>
          </div>
          
          <div className="space-y-4">
            <h1 className="text-5xl font-extrabold tracking-tight text-slate-900 sm:text-6xl">
              School <span className="text-indigo-600">Management</span>
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

          <div className="pt-8 flex gap-4 justify-center">
            <Button 
              onClick={() => setIsLogin(false)} 
              size="lg" 
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-6 text-lg rounded-full shadow-lg hover:shadow-indigo-200 transition-all gap-2"
            >
              <LogIn className="w-5 h-5" />
              Sign Up
            </Button>
            <Button 
              onClick={() => setIsLogin(true)} 
              size="lg" 
              variant="outline"
              className="px-8 py-6 text-lg rounded-full"
            >
              Log In
            </Button>
          </div>
        </div>
      ) : (
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
              <GraduationCap className="w-6 h-6 text-indigo-600" />
            </div>
            <CardTitle className="text-2xl">{isLogin ? 'Sign In' : 'Sign Up'}</CardTitle>
            <CardDescription>
              {isLogin ? 'Enter your credentials' : 'Create your account'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <Input
                  type="text"
                  placeholder="Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              )}
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              {error && (
                <p className="text-red-500 text-sm">{error}</p>
              )}
              <Button 
                type="submit" 
                className="w-full bg-indigo-600 hover:bg-indigo-700"
                disabled={loading}
              >
                {loading ? 'Please wait...' : isLogin ? 'Sign In' : 'Sign Up'}
              </Button>
            </form>
            <p className="text-center mt-4 text-sm text-slate-600">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <button 
                type="button"
                onClick={() => { setIsLogin(!isLogin); setError(''); }} 
                className="text-indigo-600 hover:underline"
              >
                {isLogin ? 'Sign Up' : 'Sign In'}
              </button>
            </p>
          </CardContent>
        </Card>
      )}
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