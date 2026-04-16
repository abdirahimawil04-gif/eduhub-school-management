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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { 
  DollarSign, 
  Plus, 
  Search, 
  TrendingUp, 
  TrendingDown, 
  CreditCard,
  Download,
  Pencil,
  Trash2
} from 'lucide-react';
import { toast } from 'sonner';

interface FeeRecord {
  id: string;
  studentId: string;
  studentName: string;
  studentAdmNumber: string;
  amount: number;
  type: string;
  status: 'paid' | 'pending' | 'overdue';
  dueDate: string;
  schoolId: string;
}

interface Student {
  id: string;
  displayName: string;
  admissionNumber: string;
}

export default function FinanceManagement() {
  const { profile } = useAuth();
  const { data: fees, loading } = useFirestoreCollection<FeeRecord>('fees');
  const { data: students } = useFirestoreCollection<Student>('students', [], false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingFee, setEditingFee] = useState<FeeRecord | null>(null);
  const [deletingFeeId, setDeletingFeeId] = useState<string | null>(null);

  const [newFee, setNewFee] = useState({
    studentId: '',
    amount: '',
    type: 'tuition',
    dueDate: '',
  });

  const totalRevenue = fees
    .filter(f => f.status === 'paid')
    .reduce((sum, f) => sum + (f.amount || 0), 0);

  const pendingFees = fees
    .filter(f => f.status === 'pending' || f.status === 'overdue')
    .reduce((sum, f) => sum + (f.amount || 0), 0);

  const stats = [
    { label: 'Total Revenue', value: `$${totalRevenue.toLocaleString()}`, icon: <TrendingUp className="text-green-600" />, color: 'bg-green-50' },
    { label: 'Pending Fees', value: `$${pendingFees.toLocaleString()}`, icon: <TrendingDown className="text-red-600" />, color: 'bg-red-50' },
    { label: 'Collected Today', value: `$${fees.filter(f => f.status === 'paid').length * 150}`, icon: <DollarSign className="text-blue-600" />, color: 'bg-blue-50' },
    { label: 'Active Invoices', value: String(fees.length), icon: <CreditCard className="text-purple-600" />, color: 'bg-purple-50' },
  ];

  const handleAddFee = async (e: React.FormEvent) => {
    e.preventDefault();
    const student = students.find(s => s.id === newFee.studentId);
    if (!student) {
      toast.error("Please select a student");
      return;
    }

    try {
      await addDoc(collection(db, 'fees'), {
        studentId: newFee.studentId,
        studentName: student.displayName,
        studentAdmNumber: student.admissionNumber,
        amount: Number(newFee.amount),
        type: newFee.type,
        status: 'pending',
        dueDate: newFee.dueDate,
        schoolId: profile?.schoolId || 'default_school',
        createdAt: serverTimestamp(),
      };
      toast.success("Invoice created successfully");
      setIsAddDialogOpen(false);
      setNewFee({ studentId: '', amount: '', type: 'tuition', dueDate: '' });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'fees');
    }
  };

  const handleMarkAsPaid = async (feeId: string) => {
    try {
      await updateDoc(doc(db, 'fees', feeId), { status: 'paid' };
      toast.success("Payment recorded");
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'fees');
    }
  };

  const handleDeleteFee = async (feeId: string) => {
    try {
      await deleteDoc(doc(db, 'fees', feeId));
      toast.success("Invoice deleted");
      setDeletingFeeId(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'fees');
    }
  };

  const filteredFees = fees.filter(fee => 
    fee.studentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    fee.studentAdmNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    fee.type?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Finance Management</h1>
          <p className="text-slate-500 mt-1">Track fee collection, invoices, and school expenses.</p>
        </div>
        
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2">
            <Download size={18} />
            Export Report
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-indigo-600 hover:bg-indigo-700 gap-2">
                <Plus size={18} />
                Create Invoice
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <form onSubmit={handleAddFee}>
                <DialogHeader>
                  <DialogTitle>Create New Invoice</DialogTitle>
                  <DialogDescription>Create a new fee invoice for a student.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="student">Student</Label>
                    <select 
                      id="student"
                      className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950"
                      value={newFee.studentId}
                      onChange={(e) => setNewFee({...newFee, studentId: e.target.value})}
                      required
                    >
                      <option value="">Select a student</option>
                      {students.map((student: Student) => (
                        <option key={student.id} value={student.id}>
                          {student.displayName} ({student.admissionNumber})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="amount">Amount ($)</Label>
                    <Input 
                      id="amount" 
                      type="number"
                      placeholder="500"
                      value={newFee.amount} 
                      onChange={(e) => setNewFee({...newFee, amount: e.target.value})}
                      required 
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="type">Fee Type</Label>
                    <select 
                      id="type"
                      className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950"
                      value={newFee.type}
                      onChange={(e) => setNewFee({...newFee, type: e.target.value})}
                    >
                      <option value="tuition">Tuition</option>
                      <option value="books">Books</option>
                      <option value="transport">Transport</option>
                      <option value="exam">Exam Fee</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="dueDate">Due Date</Label>
                    <Input 
                      id="dueDate" 
                      type="date"
                      value={newFee.dueDate} 
                      onChange={(e) => setNewFee({...newFee, dueDate: e.target.value})}
                      required 
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">Create Invoice</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <Card key={i} className="border-none shadow-sm group hover:shadow-md transition-all">
            <CardContent className="p-6 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-xl ${stat.color} transition-transform group-hover:scale-110`}>
                {stat.icon}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">Recent Transactions</h2>
          <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-lg border border-slate-200 shadow-sm w-64">
            <Search className="text-slate-400" size={18} />
            <Input 
              placeholder="Search transactions..." 
              className="border-none h-8 focus-visible:ring-0 text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="font-bold">Student</TableHead>
                <TableHead className="font-bold">Adm #</TableHead>
                <TableHead className="font-bold">Fee Type</TableHead>
                <TableHead className="font-bold">Amount</TableHead>
                <TableHead className="font-bold">Due Date</TableHead>
                <TableHead className="font-bold">Status</TableHead>
                <TableHead className="text-right font-bold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-slate-500">Loading...</TableCell>
                </TableRow>
              ) : filteredFees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-slate-500">
                    <div className="flex flex-col items-center gap-2">
                      <DollarSign size={40} className="text-slate-200" />
                      <span>No transactions found.</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredFees.map((fee) => (
                  <TableRow key={fee.id} className="hover:bg-slate-50/50 transition-colors">
                    <TableCell className="font-semibold">{fee.studentName}</TableCell>
                    <TableCell className="text-slate-500">{fee.studentAdmNumber}</TableCell>
                    <TableCell className="capitalize">{fee.type}</TableCell>
                    <TableCell className="font-bold text-slate-900">${fee.amount}</TableCell>
                    <TableCell className="text-slate-500">{fee.dueDate}</TableCell>
                    <TableCell>
                      <Badge 
                        variant={fee.status === 'paid' ? 'default' : fee.status === 'pending' ? 'secondary' : 'destructive'}
                        className={fee.status === 'paid' ? 'bg-green-100 text-green-700 hover:bg-green-100' : ''}
                      >
                        {fee.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {fee.status !== 'paid' && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                            onClick={() => handleMarkAsPaid(fee.id)}
                          >
                            Mark Paid
                          </Button>
                        )}
                        <Dialog open={deletingFeeId === fee.id} onOpenChange={(open) => !open && setDeletingFeeId(null)}>
                          <DialogTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                              onClick={() => setDeletingFeeId(fee.id)}
                            >
                              <Trash2 size={14} />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Delete Invoice</DialogTitle>
                              <DialogDescription>
                                Are you sure you want to delete this invoice?
                              </DialogDescription>
                            </DialogHeader>
                            <DialogFooter>
                              <Button variant="outline" onClick={() => setDeletingFeeId(null)}>Cancel</Button>
                              <Button variant="destructive" onClick={() => handleDeleteFee(fee.id)}>Delete</Button>
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
    </div>
  );
}