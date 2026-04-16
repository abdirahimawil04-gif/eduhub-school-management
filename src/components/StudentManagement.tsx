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
import { 
  Plus, 
  Search, 
  UserPlus, 
  Pencil, 
  Trash2,
  MoreHorizontal
} from 'lucide-react';
import { toast } from 'sonner';

interface Student {
  id: string;
  displayName: string;
  email: string;
  admissionNumber: string;
  classId: string;
  status: 'active' | 'inactive';
  schoolId: string;
}

export default function StudentManagement() {
  const { profile } = useAuth();
  const { data: students, loading } = useFirestoreCollection<Student>('students');
  const { data: classes } = useFirestoreCollection<any>('classes', [], false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [deletingStudentId, setDeletingStudentId] = useState<string | null>(null);

  const [newStudent, setNewStudent] = useState({
    displayName: '',
    email: '',
    admissionNumber: '',
    classId: '',
  });

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.schoolId && profile?.role !== 'super_admin') {
      toast.error("School ID not found in profile.");
      return;
    }

    try {
      await addDoc(collection(db, 'students'), {
        ...newStudent,
        status: 'active',
        schoolId: profile?.schoolId || 'default_school',
        createdAt: serverTimestamp(),
      });
      toast.success("Student added successfully");
      setIsAddDialogOpen(false);
      setNewStudent({ displayName: '', email: '', admissionNumber: '', classId: '' });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'students');
    }
  };

  const handleEditStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;

    try {
      const { id, ...data } = editingStudent;
      await updateDoc(doc(db, 'students', id), data);
      toast.success("Student updated successfully");
      setEditingStudent(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'students');
    }
  };

  const handleDeleteStudent = async (studentId: string) => {
    try {
      await deleteDoc(doc(db, 'students', studentId));
      toast.success("Student deleted successfully");
      setDeletingStudentId(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'students');
    }
  };

  const filteredStudents = students.filter(student => 
    student.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.admissionNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Student Management</h1>
          <p className="text-slate-500 mt-1">View and manage all students in your institution.</p>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-indigo-600 hover:bg-indigo-700 gap-2">
              <UserPlus size={18} />
              Add New Student
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <form onSubmit={handleAddStudent}>
              <DialogHeader>
                <DialogTitle>Add New Student</DialogTitle>
                <DialogDescription>
                  Enter the student details below to create a new record.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input 
                    id="name" 
                    value={newStudent.displayName} 
                    onChange={(e) => setNewStudent({...newStudent, displayName: e.target.value})}
                    required 
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input 
                    id="email" 
                    type="email"
                    value={newStudent.email} 
                    onChange={(e) => setNewStudent({...newStudent, email: e.target.value})}
                    required 
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="admission">Admission Number</Label>
                  <Input 
                    id="admission" 
                    value={newStudent.admissionNumber} 
                    onChange={(e) => setNewStudent({...newStudent, admissionNumber: e.target.value})}
                    required 
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="class">Class / Grade</Label>
                  <select 
                    id="class"
                    className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950"
                    value={newStudent.classId}
                    onChange={(e) => setNewStudent({...newStudent, classId: e.target.value})}
                    required
                  >
                    <option value="">Select a class</option>
                    {classes.map((cls: any) => (
                      <option key={cls.id} value={cls.id}>{cls.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">Save Student</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-slate-200 shadow-sm max-w-md">
        <Search className="text-slate-400 ml-2" size={20} />
        <Input 
          placeholder="Search by name or admission number..." 
          className="border-none focus-visible:ring-0"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="font-bold">Admission #</TableHead>
              <TableHead className="font-bold">Name</TableHead>
              <TableHead className="font-bold">Email</TableHead>
              <TableHead className="font-bold">Class</TableHead>
              <TableHead className="font-bold">Status</TableHead>
              <TableHead className="text-right font-bold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10 text-slate-500">Loading students...</TableCell>
              </TableRow>
            ) : filteredStudents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10 text-slate-500">No students found.</TableCell>
              </TableRow>
            ) : (
              filteredStudents.map((student) => (
                <TableRow key={student.id} className="hover:bg-slate-50/50 transition-colors">
                  <TableCell className="font-medium text-indigo-600">{student.admissionNumber}</TableCell>
                  <TableCell className="font-semibold">{student.displayName}</TableCell>
                  <TableCell className="text-slate-500">{student.email}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="border-indigo-200 text-indigo-700 bg-indigo-50">
                      {classes.find((c: any) => c.id === student.classId)?.name || student.classId}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={student.status === 'active' ? 'default' : 'secondary'} className={student.status === 'active' ? 'bg-green-100 text-green-700 hover:bg-green-100' : ''}>
                      {student.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Dialog open={!!editingStudent?.id} onOpenChange={(open) => !open && setEditingStudent(null)}>
                        <DialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                            onClick={() => setEditingStudent(student)}
                          >
                            <Pencil size={14} />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                          <form onSubmit={handleEditStudent}>
                            <DialogHeader>
                              <DialogTitle>Edit Student</DialogTitle>
                              <DialogDescription>Update student details.</DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                              <div className="grid gap-2">
                                <Label htmlFor="edit-name">Full Name</Label>
                                <Input 
                                  id="edit-name" 
                                  value={editingStudent?.displayName || ''} 
                                  onChange={(e) => setEditingStudent(prev => prev ? {...prev, displayName: e.target.value} : null)}
                                  required 
                                />
                              </div>
                              <div className="grid gap-2">
                                <Label htmlFor="edit-email">Email Address</Label>
                                <Input 
                                  id="edit-email" 
                                  type="email"
                                  value={editingStudent?.email || ''} 
                                  onChange={(e) => setEditingStudent(prev => prev ? {...prev, email: e.target.value} : null)}
                                  required 
                                />
                              </div>
                              <div className="grid gap-2">
                                <Label htmlFor="edit-admission">Admission Number</Label>
                                <Input 
                                  id="edit-admission" 
                                  value={editingStudent?.admissionNumber || ''} 
                                  onChange={(e) => setEditingStudent(prev => prev ? {...prev, admissionNumber: e.target.value} : null)}
                                  required 
                                />
                              </div>
                              <div className="grid gap-2">
                                <Label htmlFor="edit-status">Status</Label>
                                <select 
                                  id="edit-status"
                                  className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950"
                                  value={editingStudent?.status || 'active'}
                                  onChange={(e) => setEditingStudent(prev => prev ? {...prev, status: e.target.value as 'active' | 'inactive'} : null)}
                                >
                                  <option value="active">Active</option>
                                  <option value="inactive">Inactive</option>
                                </select>
                              </div>
                            </div>
                            <DialogFooter>
                              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">Update Student</Button>
                            </DialogFooter>
                          </form>
                        </DialogContent>
                      </Dialog>
                      
                      <Dialog open={deletingStudentId === student.id} onOpenChange={(open) => !open && setDeletingStudentId(null)}>
                        <DialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => setDeletingStudentId(student.id)}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Delete Student</DialogTitle>
                            <DialogDescription>
                              Are you sure you want to delete {student.displayName}? This action cannot be undone.
                            </DialogDescription>
                          </DialogHeader>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setDeletingStudentId(null)}>Cancel</Button>
                            <Button variant="destructive" onClick={() => handleDeleteStudent(student.id)}>Delete</Button>
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