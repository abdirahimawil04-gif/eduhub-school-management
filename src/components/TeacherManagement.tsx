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
import { Search, UserPlus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface Teacher {
  id: string;
  displayName: string;
  email: string;
  specialization: string;
  schoolId: string;
}

export default function TeacherManagement() {
  const { profile } = useAuth();
  const { data: teachers, loading } = useFirestoreCollection<Teacher>('teachers');
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [deletingTeacherId, setDeletingTeacherId] = useState<string | null>(null);

  const [newTeacher, setNewTeacher] = useState({
    displayName: '',
    email: '',
    specialization: '',
  });

  const handleAddTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'teachers'), {
        ...newTeacher,
        schoolId: profile?.schoolId || 'default_school',
        createdAt: serverTimestamp(),
      });
      toast.success("Teacher added successfully");
      setIsAddDialogOpen(false);
      setNewTeacher({ displayName: '', email: '', specialization: '' });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'teachers');
    }
  };

  const handleEditTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeacher) return;

    try {
      const { id, ...data } = editingTeacher;
      await updateDoc(doc(db, 'teachers', id), data);
      toast.success("Teacher updated successfully");
      setEditingTeacher(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'teachers');
    }
  };

  const handleDeleteTeacher = async (teacherId: string) => {
    try {
      await deleteDoc(doc(db, 'teachers', teacherId));
      toast.success("Teacher deleted successfully");
      setDeletingTeacherId(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'teachers');
    }
  };

  const filteredTeachers = teachers.filter(teacher => 
    teacher.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    teacher.specialization?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Teacher Management</h1>
          <p className="text-slate-500 mt-1">Manage staff profiles and subject assignments.</p>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-indigo-600 hover:bg-indigo-700 gap-2">
              <UserPlus size={18} />
              Add New Teacher
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <form onSubmit={handleAddTeacher}>
              <DialogHeader>
                <DialogTitle>Add New Teacher</DialogTitle>
                <DialogDescription>
                  Enter the teacher details below to create a new staff record.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input 
                    id="name" 
                    value={newTeacher.displayName} 
                    onChange={(e) => setNewTeacher({...newTeacher, displayName: e.target.value})}
                    required 
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input 
                    id="email" 
                    type="email"
                    value={newTeacher.email} 
                    onChange={(e) => setNewTeacher({...newTeacher, email: e.target.value})}
                    required 
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="specialization">Specialization / Subject</Label>
                  <Input 
                    id="specialization" 
                    placeholder="e.g. Mathematics, Physics"
                    value={newTeacher.specialization} 
                    onChange={(e) => setNewTeacher({...newTeacher, specialization: e.target.value})}
                    required 
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">Save Teacher</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-slate-200 shadow-sm max-w-md">
        <Search className="text-slate-400 ml-2" size={20} />
        <Input 
          placeholder="Search by name or subject..." 
          className="border-none focus-visible:ring-0"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="font-bold">Name</TableHead>
              <TableHead className="font-bold">Email</TableHead>
              <TableHead className="font-bold">Specialization</TableHead>
              <TableHead className="text-right font-bold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-10 text-slate-500">Loading teachers...</TableCell>
              </TableRow>
            ) : filteredTeachers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-10 text-slate-500">No teachers found.</TableCell>
              </TableRow>
            ) : (
              filteredTeachers.map((teacher) => (
                <TableRow key={teacher.id} className="hover:bg-slate-50/50 transition-colors">
                  <TableCell className="font-semibold">{teacher.displayName}</TableCell>
                  <TableCell className="text-slate-500">{teacher.email}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="border-indigo-200 text-indigo-700 bg-indigo-50">
                      {teacher.specialization}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Dialog open={!!editingTeacher?.id} onOpenChange={(open) => !open && setEditingTeacher(null)}>
                        <DialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                            onClick={() => setEditingTeacher(teacher)}
                          >
                            <Pencil size={14} />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                          <form onSubmit={handleEditTeacher}>
                            <DialogHeader>
                              <DialogTitle>Edit Teacher</DialogTitle>
                              <DialogDescription>Update teacher details.</DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                              <div className="grid gap-2">
                                <Label htmlFor="edit-name">Full Name</Label>
                                <Input 
                                  id="edit-name" 
                                  value={editingTeacher?.displayName || ''} 
                                  onChange={(e) => setEditingTeacher(prev => prev ? {...prev, displayName: e.target.value} : null)}
                                  required 
                                />
                              </div>
                              <div className="grid gap-2">
                                <Label htmlFor="edit-email">Email Address</Label>
                                <Input 
                                  id="edit-email" 
                                  type="email"
                                  value={editingTeacher?.email || ''} 
                                  onChange={(e) => setEditingTeacher(prev => prev ? {...prev, email: e.target.value} : null)}
                                  required 
                                />
                              </div>
                              <div className="grid gap-2">
                                <Label htmlFor="edit-spec">Specialization</Label>
                                <Input 
                                  id="edit-spec" 
                                  value={editingTeacher?.specialization || ''} 
                                  onChange={(e) => setEditingTeacher(prev => prev ? {...prev, specialization: e.target.value} : null)}
                                  required 
                                />
                              </div>
                            </div>
                            <DialogFooter>
                              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">Update Teacher</Button>
                            </DialogFooter>
                          </form>
                        </DialogContent>
                      </Dialog>
                      
                      <Dialog open={deletingTeacherId === teacher.id} onOpenChange={(open) => !open && setDeletingTeacherId(null)}>
                        <DialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => setDeletingTeacherId(teacher.id)}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Delete Teacher</DialogTitle>
                            <DialogDescription>
                              Are you sure you want to delete {teacher.displayName}? This action cannot be undone.
                            </DialogDescription>
                          </DialogHeader>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setDeletingTeacherId(null)}>Cancel</Button>
                            <Button variant="destructive" onClick={() => handleDeleteTeacher(teacher.id)}>Delete</Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}