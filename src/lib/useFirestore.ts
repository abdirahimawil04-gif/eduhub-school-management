import { useState, useEffect, useMemo } from 'react';
import { collection, query, where, onSnapshot, doc, getDoc, DocumentData, QueryConstraint } from 'firebase/firestore';
import { db } from './firebase';
import { useAuth } from './AuthContext';

interface ClassData {
  id: string;
  name: string;
  teacherId?: string;
  schoolId?: string;
}

interface StudentData {
  id: string;
  displayName?: string;
  classId?: string;
  schoolId?: string;
}

interface TeacherData {
  id: string;
  displayName?: string;
  schoolId?: string;
}

// Cache for lookups
const classCache = new Map<string, ClassData>();
const studentCache = new Map<string, StudentData>();
const teacherCache = new Map<string, TeacherData>();

export function useFirestoreCollection<T = DocumentData>(
  collectionName: string,
  additionalConstraints: QueryConstraint[] = [],
  filterBySchool: boolean = true
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, profile } = useAuth();

  const constraints = useMemo(() => {
    const cons: QueryConstraint[] = [...additionalConstraints];
    // For super_admin, don't filter by school to see all data
    if (filterBySchool && profile?.schoolId && profile?.role !== 'super_admin' && collectionName !== 'schools') {
      cons.push(where('schoolId', '==', profile.schoolId));
    }
    return cons;
  }, [additionalConstraints, filterBySchool, profile?.schoolId, profile?.role, collectionName]);

  useEffect(() => {
    if (!user) {
      setData([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    
    const q = query(collection(db, collectionName), ...constraints);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as T[];
        
        // Build cache for related lookups
        if (collectionName === 'classes') {
          items.forEach((item: any) => {
            classCache.set(item.id, item as ClassData);
          });
        } else if (collectionName === 'students') {
          items.forEach((item: any) => {
            studentCache.set(item.id, item as StudentData);
          });
        } else if (collectionName === 'teachers') {
          items.forEach((item: any) => {
            teacherCache.set(item.id, item as TeacherData);
          });
        }
        
        setData(items);
        setLoading(false);
      },
      (err) => {
        console.error(`Error loading ${collectionName}:`, err.code, err.message);
        const errorMsg = err.message || 'Unknown error';
        if (errorMsg.includes('permission') || errorMsg.includes('Permission')) {
          setError('Access denied. Contact admin for permissions.');
        } else if (errorMsg.includes('not-found')) {
          setError('Data not found.');
        } else {
          setError(errorMsg);
        }
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [collectionName, user, JSON.stringify(constraints)]);

  return { data, loading, error };
}

// Helper functions to get related data
export function getClassName(classId: string): string {
  const cls = classCache.get(classId);
  return cls?.name || classId || 'N/A';
}

export function getStudentName(studentId: string): string {
  const student = studentCache.get(studentId);
  return student?.displayName || studentId || 'N/A';
}

export function getTeacherName(teacherId: string): string {
  const teacher = teacherCache.get(teacherId);
  return teacher?.displayName || teacherId || 'N/A';
}

export function getClassTeacher(classId: string): string {
  const cls = classCache.get(classId);
  if (cls?.teacherId) {
    return getTeacherName(cls.teacherId);
  }
  return 'Not assigned';
}

export function getStudentClass(studentId: string): string {
  const student = studentCache.get(studentId);
  if (student?.classId) {
    return getClassName(student.classId);
  }
  return 'N/A';
}