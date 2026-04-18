import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
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
  login: () => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [school, setSchool] = useState<School | null>(null);
  const [loading, setLoading] = useState(true);

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
      if (user) {
        await fetchProfileAndSchool(user.uid);
      } else {
        setProfile(null);
        setSchool(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const refreshProfile = async () => {
    if (user) {
      await fetchProfileAndSchool(user.uid);
    }
  };

  const login = async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    try {
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      console.error('Login failed:', error);
      if (error?.code === 'auth/popup-closed-by-user' || error?.code === 'auth/cancelled-popup-request') {
        alert('Please allow the popup and try again, or check your browser popup blocker.');
      } else if (error?.code === 'auth/unauthorized-domain') {
        alert('Domain not authorized. Trying redirect...');
        await auth.signInWithRedirect(provider);
      } else {
        alert('Login error: ' + error?.message);
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
    <AuthContext.Provider value={{ user, profile, school, loading, login, logout, refreshProfile }}>
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
