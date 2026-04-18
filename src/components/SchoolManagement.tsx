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
import { Plus, Search, School, MapPin, Mail, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface SchoolData {
  id: string;
  name: string;
  address: string;
  contactEmail: string;
  createdAt: any;
}

export default function SchoolManagement() {
  const { profile } = useAuth();
  const { data: schools, loading } = useFirestoreCollection<SchoolData>('schools', [], false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingSchool, setEditingSchool] = useState<SchoolData | null>(null);
  const [deletingSchoolId, setDeletingSchoolId] = useState<string | null>(null);

  const [newSchool, setNewSchool] = useState({
    name: '',
    address: '',
    contactEmail: '',
  });

  const handleAddSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    if (profile?.role !== 'super_admin') {
      toast.error("Only Super Admins can add schools.");
      return;
    }

    try {
      await addDoc(collection(db, 'schools'), {
        ...newSchool,
        createdAt: serverTimestamp(),
      });
      toast.success("School branch added successfully");
      setIsAddDialogOpen(false);
      setNewSchool({ name: '', address: '', contactEmail: '' });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'schools');
    }
  };

  const handleEditSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSchool) return;

    try {
      const { id, createdAt, ...data } = editingSchool;
      await updateDoc(doc(db, 'schools', id), data);
      toast.success("School updated successfully");
      setEditingSchool(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'schools');
    }
  };

  const handleDeleteSchool = async (schoolId: string) => {
    try {
      await deleteDoc(doc(db, 'schools', schoolId));
      toast.success("School deleted successfully");
      setDeletingSchoolId(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'schools');
    }
  };

  const filteredSchools = schools.filter(school => 
    school.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    school.address?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">School Branches</h1>
          <p className="text-slate-500 mt-1">Manage multiple school locations and branches.</p>
        </div>
        
        {profile?.role === 'super_admin' && (
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-indigo-600 hover:bg-indigo-700 gap-2">
                <Plus size={18} />
                Add New Branch
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <form onSubmit={handleAddSchool}>
                <DialogHeader>
                  <DialogTitle>Add New School Branch</DialogTitle>
                  <DialogDescription>
                    Enter the details for the new school location.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">School Name</Label>
                    <Input 
                      id="name" 
                      placeholder="e.g. EduHub North Campus"
                      value={newSchool.name} 
                      onChange={(e) => setNewSchool({...newSchool, name: e.target.value})}
                      required 
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="address">Address</Label>
                    <Input 
                      id="address" 
                      placeholder="123 Education St, City"
                      value={newSchool.address} 
                      onChange={(e) => setNewSchool({...newSchool, address: e.target.value})}
                      required 
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email">Contact Email</Label>
                    <Input 
                      id="email" 
                      type="email"
                      placeholder="campus@eduhub.com"
                      value={newSchool.contactEmail} 
                      onChange={(e) => setNewSchool({...newSchool, contactEmail: e.target.value})}
                      required 
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">Create Branch</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-slate-200 shadow-sm max-w-md">
        <Search className="text-slate-400 ml-2" size={20} />
        <Input 
          placeholder="Search branches..." 
          className="border-none focus-visible:ring-0"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full text-center py-10 text-slate-500">Loading schools...</div>
        ) : filteredSchools.length === 0 ? (
          <div className="col-span-full text-center py-10 text-slate-500">No school branches found.</div>
        ) : (
          filteredSchools.map((school) => (
            <div key={school.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all group">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-indigo-50 rounded-lg text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <School size={24} />
                </div>
                <Badge variant="outline" className="border-indigo-200 text-indigo-700 bg-indigo-50">
                  Active
                </Badge>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">{school.name}</h3>
              <div className="space-y-2 mb-6">
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <MapPin size={16} />
                  <span>{school.address}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Mail size={16} />
                  <span>{school.contactEmail}</span>
                </div>
              </div>
              <div className="flex gap-2">
                {profile?.role === 'super_admin' && (
                  <>
                    <Dialog open={editingSchool?.id === school.id} onOpenChange={(open) => !open && setEditingSchool(null)}>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1"
                          onClick={() => setEditingSchool(school)}
                        >
                          <Pencil size={14} className="mr-1" /> Edit
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[425px]">
                        <form onSubmit={handleEditSchool}>
                          <DialogHeader>
                            <DialogTitle>Edit School</DialogTitle>
                            <DialogDescription>Update school details.</DialogDescription>
                          </DialogHeader>
                          <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                              <Label htmlFor="edit-name">School Name</Label>
                              <Input 
                                id="edit-name" 
                                value={editingSchool?.name || ''} 
                                onChange={(e) => setEditingSchool(prev => prev ? {...prev, name: e.target.value} : null)}
                                required 
                              />
                            </div>
                            <div className="grid gap-2">
                              <Label htmlFor="edit-address">Address</Label>
                              <Input 
                                id="edit-address" 
                                value={editingSchool?.address || ''} 
                                onChange={(e) => setEditingSchool(prev => prev ? {...prev, address: e.target.value} : null)}
                                required 
                              />
                            </div>
                            <div className="grid gap-2">
                              <Label htmlFor="edit-email">Contact Email</Label>
                              <Input 
                                id="edit-email" 
                                type="email"
                                value={editingSchool?.contactEmail || ''} 
                                onChange={(e) => setEditingSchool(prev => prev ? {...prev, contactEmail: e.target.value} : null)}
                                required 
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">Update School</Button>
                          </DialogFooter>
                        </form>
                      </DialogContent>
                    </Dialog>
                    
                    <Dialog open={deletingSchoolId === school.id} onOpenChange={(open) => !open && setDeletingSchoolId(null)}>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1 text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => setDeletingSchoolId(school.id)}
                        >
                          <Trash2 size={14} className="mr-1" /> Delete
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Delete School</DialogTitle>
                          <DialogDescription>
                            Are you sure you want to delete {school.name}? This will remove all associated data. This action cannot be undone.
                          </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setDeletingSchoolId(null)}>Cancel</Button>
                          <Button variant="destructive" onClick={() => handleDeleteSchool(school.id)}>Delete</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}