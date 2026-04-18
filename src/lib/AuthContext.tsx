import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, updateProfile } from 'firebase/auth';
import { auth } from './firebase';

interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: 'super_admin' | 'school_admin' | 'teacher' | 'accountant' | 'student';
  schoolId?: string;
  bio?: string;
}

interface School {
  id: string;
  name: string;
  address?: string;
  contactEmail?: string;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  school: School | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [school, setSchool] = useState<School | null>(null);
  const [loading, setLoading] = useState(true);

  const isSuperAdmin = (email: string) => {
    return email === 'abdirahimawil04@gmail.com' || email === 'rammadan1213@gmail.com';
  };

  useEffect(() => {
    console.log('AuthProvider: setting up listener');
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      console.log('AuthProvider: user changed', firebaseUser?.email);
      if (firebaseUser) {
        setUser(firebaseUser);
        const email = firebaseUser.email || '';
        const newProfile: UserProfile = {
          uid: firebaseUser.uid,
          email: email,
          displayName: firebaseUser.displayName || 'User',
          role: isSuperAdmin(email) ? 'super_admin' : 'student',
          schoolId: 'default_school'
        };
        setProfile(newProfile);
        setSchool({ 
          id: 'default_school', 
          name: 'My School', 
          address: 'Main Campus', 
          contactEmail: 'info@eduhub.com' 
        });
      } else {
        setUser(null);
        setProfile(null);
        setSchool(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const refreshProfile = async () => {
    if (user) {
      const email = user.email || '';
      setProfile({
        uid: user.uid,
        email: email,
        displayName: user.displayName || 'User',
        role: isSuperAdmin(email) ? 'super_admin' : 'student',
        schoolId: 'default_school'
      });
    }
  };

  const login = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      console.error('Login failed:', error);
      if (error?.code === 'auth/invalid-email') {
        throw new Error('Invalid email address');
      } else if (error?.code === 'auth/user-not-found' || error?.code === 'auth/wrong-password') {
        throw new Error('Invalid email or password');
      } else if (error?.code === 'auth/invalid-credential') {
        throw new Error('Invalid email or password');
      } else {
        throw new Error(error?.message || 'Login failed');
      }
    }
  };

  const signup = async (email: string, password: string, name: string) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(result.user, { displayName: name });
      const newProfile: UserProfile = {
        uid: result.user.uid,
        email: email,
        displayName: name,
        role: isSuperAdmin(email) ? 'super_admin' : 'student',
        schoolId: 'default_school'
      };
      setProfile(newProfile);
    } catch (error: any) {
      console.error('Signup failed:', error);
      if (error?.code === 'auth/email-already-in-use') {
        throw new Error('Email already registered');
      } else if (error?.code === 'auth/weak-password') {
        throw new Error('Password should be at least 6 characters');
      } else {
        throw new Error(error?.message || 'Signup failed');
      }
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, school, loading, login, signup, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}