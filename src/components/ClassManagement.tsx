import React, { useState } from 'react';
import { useFirestoreCollection } from '../lib/useFirestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, addDoc, doc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../lib/AuthContext';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, BookOpen, Pencil, Trash2, Users, Calendar } from 'lucide-react';
import { toast } from 'sonner';

interface Class {
  id: string;
  name: string;
  teacherId: string;
  schoolId: string;
}

export default function ClassManagement() {
  const { profile } = useAuth();
  const { data: classes, loading } = useFirestoreCollection<Class>('classes');
  const { data: teachers } = useFirestoreCollection<any>('teachers', [], false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const [deletingClassId, setDeletingClassId] = useState<string | null>(null);

  const [newClass, setNewClass] = useState({
    name: '',
    teacherId: '',
  });

  const handleAddClass = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'classes'), {
        ...newClass,
        schoolId: profile?.schoolId || 'default_school',
        createdAt: serverTimestamp(),
      });
      toast.success("Class created successfully");
      setIsAddDialogOpen(false);
      setNewClass({ name: '', teacherId: '' });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'classes');
    }
  };

  const handleEditClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClass) return;

    try {
      const { id, ...data } = editingClass;
      await updateDoc(doc(db, 'classes', id), data);
      toast.success("Class updated successfully");
      setEditingClass(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'classes');
    }
  };

  const handleDeleteClass = async (classId: string) => {
    try {
      await deleteDoc(doc(db, 'classes', classId));
      toast.success("Class deleted successfully");
      setDeletingClassId(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'classes');
    }
  };

  const filteredClasses = classes.filter(cls => 
    cls.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Class Management</h1>
          <p className="text-slate-500 mt-1">Configure academic classes and assign class teachers.</p>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-indigo-600 hover:bg-indigo-700 gap-2">
              <Plus size={18} />
              Create New Class
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <form onSubmit={handleAddClass}>
              <DialogHeader>
                <DialogTitle>Create New Class</DialogTitle>
                <DialogDescription>
                  Enter the class name and assign a teacher.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Class Name</Label>
                  <Input 
                    id="name" 
                    placeholder="e.g. Grade 10-A"
                    value={newClass.name} 
                    onChange={(e) => setNewClass({...newClass, name: e.target.value})}
                    required 
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="teacher">Class Teacher</Label>
                  <select 
                    id="teacher"
                    className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950"
                    value={newClass.teacherId}
                    onChange={(e) => setNewClass({...newClass, teacherId: e.target.value})}
                    required
                  >
                    <option value="">Select a teacher</option>
                    {teachers.map((teacher: any) => (
                      <option key={teacher.id} value={teacher.id}>{teacher.displayName}</option>
                    ))}
                  </select>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">Create Class</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-slate-200 shadow-sm max-w-md">
        <Search className="text-slate-400 ml-2" size={20} />
        <Input 
          placeholder="Search by class name..." 
          className="border-none focus-visible:ring-0"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full text-center py-10 text-slate-500">Loading classes...</div>
        ) : filteredClasses.length === 0 ? (
          <div className="col-span-full text-center py-10 text-slate-500">No classes found.</div>
        ) : (
          filteredClasses.map((cls) => (
            <div key={cls.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all group">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-indigo-50 rounded-lg text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <BookOpen size={24} />
                </div>
                <Badge variant="secondary" className="bg-slate-100 text-slate-600">
                  {cls.schoolId === 'default_school' ? 'Main Branch' : 'Branch'}
                </Badge>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-1">{cls.name}</h3>
              <p className="text-sm text-slate-500 mb-4">
                Teacher: {teachers.find((t: any) => t.id === cls.teacherId)?.displayName || 'Not Assigned'}
              </p>
              <div className="flex gap-2">
                <Dialog open={editingClass?.id === cls.id} onOpenChange={(open) => !open && setEditingClass(null)}>
                  <DialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => setEditingClass(cls)}
                    >
                      <Pencil size={14} className="mr-1" /> Edit
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <form onSubmit={handleEditClass}>
                      <DialogHeader>
                        <DialogTitle>Edit Class</DialogTitle>
                        <DialogDescription>Update class details.</DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <Label htmlFor="edit-name">Class Name</Label>
                          <Input 
                            id="edit-name" 
                            value={editingClass?.name || ''} 
                            onChange={(e) => setEditingClass(prev => prev ? {...prev, name: e.target.value} : null)}
                            required 
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="edit-teacher">Class Teacher</Label>
                          <select 
                            id="edit-teacher"
                            className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950"
                            value={editingClass?.teacherId || ''}
                            onChange={(e) => setEditingClass(prev => prev ? {...prev, teacherId: e.target.value} : null)}
                          >
                            <option value="">Select a teacher</option>
                            {teachers.map((teacher: any) => (
                              <option key={teacher.id} value={teacher.id}>{teacher.displayName}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">Update Class</Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
                
                <Dialog open={deletingClassId === cls.id} onOpenChange={(open) => !open && setDeletingClassId(null)}>
                  <DialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1 text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={() => setDeletingClassId(cls.id)}
                    >
                      <Trash2 size={14} className="mr-1" /> Delete
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Delete Class</DialogTitle>
                      <DialogDescription>
                        Are you sure you want to delete {cls.name}? This action cannot be undone.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setDeletingClassId(null)}>Cancel</Button>
                      <Button variant="destructive" onClick={() => handleDeleteClass(cls.id)}>Delete</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}