import { useState, useEffect, useMemo } from 'react';
import { collection, query, where, onSnapshot, DocumentData, QueryConstraint } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { useAuth } from './AuthContext';

export function useFirestoreCollection<T = DocumentData>(
  collectionName: string,
  additionalConstraints: QueryConstraint[] = [],
  filterBySchool: boolean = true
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { user, profile } = useAuth();

  const constraints = useMemo(() => {
    const cons: QueryConstraint[] = [...additionalConstraints];
    if (filterBySchool && profile?.schoolId && collectionName !== 'schools') {
      cons.push(where('schoolId', '==', profile.schoolId));
    }
    return cons;
  }, [additionalConstraints, filterBySchool, profile?.schoolId, collectionName]);

  useEffect(() => {
    if (!user) {
      setData([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const q = query(collection(db, collectionName), ...constraints);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as T[];
        setData(items);
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
        handleFirestoreError(err, OperationType.LIST, collectionName);
      }
    );

    return () => unsubscribe();
  }, [collectionName, user, constraints]);

  return { data, loading, error };
}
