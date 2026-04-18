import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, updateProfile } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from './firebase';

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
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    console.log('AuthProvider initializing...');
  }, []);

  const fetchProfileAndSchool = async (uid: string) => {
    const profileRef = doc(db, 'users', uid);
    try {
      const profileSnap = await getDoc(profileRef);
      if (profileSnap.exists()) {
        const profileData = profileSnap.data() as UserProfile;
        setProfile(profileData);

        if (profileData.schoolId) {
          const schoolRef = doc(db, 'schools', profileData.schoolId);
          const schoolSnap = await getDoc(schoolRef);
          if (schoolSnap.exists()) {
            setSchool({ id: schoolSnap.id, ...schoolSnap.data() } as School);
          } else if (profileData.schoolId === 'default_school') {
            // Create default school if it doesn't exist
            const defaultSchool = {
              name: 'EduHub Academy',
              address: 'Main Campus, Education City',
              contactEmail: 'info@eduhub.com'
            };
            await setDoc(schoolRef, defaultSchool);
            setSchool({ id: 'default_school', ...defaultSchool });
          }
        }
      } else {
        // Create default profile for new users
        const currentUser = auth.currentUser;
        if (currentUser) {
          const isSuperAdmin = currentUser.email === 'abdirahimawil04@gmail.com' || currentUser.email === 'rammadan1213@gmail.com';
          const newProfile: UserProfile = {
            uid: currentUser.uid,
            email: currentUser.email || '',
            displayName: currentUser.displayName || 'User',
            role: isSuperAdmin ? 'super_admin' : 'student',
            schoolId: 'default_school'
          };
          await setDoc(profileRef, newProfile);
          setProfile(newProfile);
          
          // Ensure default school exists
          const schoolRef = doc(db, 'schools', 'default_school');
          const schoolSnap = await getDoc(schoolRef);
          if (!schoolSnap.exists()) {
            const defaultSchool = {
              name: 'EduHub Academy',
              address: 'Main Campus, Education City',
              contactEmail: 'info@eduhub.com'
            };
            await setDoc(schoolRef, defaultSchool);
            setSchool({ id: 'default_school', ...defaultSchool });
          } else {
            setSchool({ id: 'default_school', ...schoolSnap.data() } as School);
          }
        }
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `users/${uid}`);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      try {
        if (user) {
          await fetchProfileAndSchool(user.uid);
        } else {
          setProfile(null);
          setSchool(null);
        }
      } catch (error) {
        console.error('Auth error:', error);
        setProfile(null);
        setSchool(null);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const refreshProfile = async () => {
    if (user) {
      await fetchProfileAndSchool(user.uid);
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
      // Create profile in Firestore
      const isSuperAdmin = email === 'abdirahimawil04@gmail.com' || email === 'rammadan1213@gmail.com';
      const newProfile: UserProfile = {
        uid: result.user.uid,
        email: email,
        displayName: name,
        role: isSuperAdmin ? 'super_admin' : 'student',
        schoolId: 'default_school'
      };
      await setDoc(doc(db, 'users', result.user.uid), newProfile);
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
