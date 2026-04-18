import React, { useState } from 'react';
import { useFirestoreCollection } from '../lib/useFirestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, addDoc, doc, deleteDoc, serverTimestamp, query, where, getDocs, orderBy } from 'firebase/firestore';
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
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ClipboardList, Check, X, Clock, Save, History, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Student {
  id: string;
  displayName: string;
  admissionNumber: string;
  classId: string;
  status: 'active' | 'inactive';
}

interface AttendanceRecord {
  id: string;
  studentId: string;
  classId: string;
  date: string;
  status: 'present' | 'absent' | 'late';
  recordedBy: string;
}

export default function AttendanceManagement() {
  const { profile } = useAuth();
  const { data: classes } = useFirestoreCollection<any>('classes');
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<Record<string, 'present' | 'absent' | 'late'>>({});
  const [loading, setLoading] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyRecords, setHistoryRecords] = useState<AttendanceRecord[]>([]);

  const fetchStudents = async (classId: string, date: string) => {
    setLoading(true);
    try {
      const q = query(
        collection(db, 'students'),
        where('classId', '==', classId),
        where('status', '==', 'active')
      );
      const querySnapshot = await getDocs(q);
      const studentList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Student));
      setStudents(studentList);
      
      const attQ = query(
        collection(db, 'attendance'),
        where('classId', '==', classId),
        where('date', '==', date)
      );
      const attSnapshot = await getDocs(attQ);
      const existingRecords: Record<string, 'present' | 'absent' | 'late'> = {};
      attSnapshot.docs.forEach(doc => {
        const data = doc.data() as AttendanceRecord;
        existingRecords[data.studentId] = data.status;
      });
      
      const initialAttendance: Record<string, 'present' | 'absent' | 'late'> = {};
      studentList.forEach(s => initialAttendance[s.id] = existingRecords[s.id] || 'present');
      setAttendance(initialAttendance);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'students');
    } finally {
      setLoading(false);
    }
  };

  const handleClassChange = (value: string) => {
    setSelectedClass(value);
    fetchStudents(value, selectedDate);
  };

  const handleDateChange = (value: string) => {
    setSelectedDate(value);
    if (selectedClass) {
      fetchStudents(selectedClass, value);
    }
  };

  const handleStatusChange = (studentId: string, status: 'present' | 'absent' | 'late') => {
    setAttendance(prev => ({ ...prev, [studentId]: status }));
  };

  const handleMarkAll = (status: 'present' | 'absent' | 'late') => {
    const updated: Record<string, 'present' | 'absent' | 'late'> = {};
    students.forEach(s => updated[s.id] = status);
    setAttendance(updated);
    toast.success(`Marked all students as ${status}`);
  };

  const saveAttendance = async () => {
    if (!selectedClass || !selectedDate) return;
    setLoading(true);
    
    try {
      const existingQ = query(
        collection(db, 'attendance'),
        where('classId', '==', selectedClass),
        where('date', '==', selectedDate)
      );
      const existingSnapshot = await getDocs(existingQ);
      const deletePromises = existingSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);

      const insertPromises = Object.entries(attendance).map(([studentId, status]) => {
        return addDoc(collection(db, 'attendance'), {
          studentId,
          classId: selectedClass,
          date: selectedDate,
          status,
          recordedBy: profile?.uid,
          schoolId: profile?.schoolId || 'default_school',
          createdAt: serverTimestamp(),
        });
      });
      await Promise.all(insertPromises);
      toast.success("Attendance saved successfully");
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'attendance');
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, 'attendance'),
        where('classId', '==', selectedClass),
        orderBy('date', 'desc')
      );
      const snapshot = await getDocs(q);
      const records = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AttendanceRecord));
      setHistoryRecords(records);
      setHistoryOpen(true);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'attendance');
    } finally {
      setLoading(false);
    }
  };

  const presentCount = Object.values(attendance).filter(s => s === 'present').length;
  const absentCount = Object.values(attendance).filter(s => s === 'absent').length;
  const lateCount = Object.values(attendance).filter(s => s === 'late').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Attendance</h1>
          <p className="text-slate-500 mt-1">Mark daily attendance for students.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm">
            <span className="text-sm font-medium text-slate-500">Date:</span>
            <input 
              type="date"
              value={selectedDate}
              onChange={(e) => handleDateChange(e.target.value)}
              className="text-sm font-bold text-indigo-600 bg-transparent border-none outline-none"
            />
          </div>
          <Button 
            variant="outline"
            onClick={loadHistory}
            disabled={!selectedClass}
            className="gap-2"
          >
            <History size={18} />
            History
          </Button>
          <Button 
            onClick={saveAttendance} 
            disabled={!selectedClass || students.length === 0 || loading}
            className="bg-indigo-600 hover:bg-indigo-700 gap-2"
          >
            <Save size={18} />
            Save Attendance
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-none shadow-sm bg-green-50">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600/80">Present</p>
              <p className="text-2xl font-bold text-green-700">{presentCount}</p>
            </div>
            <Check className="text-green-600" size={24} />
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-red-50">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-red-600/80">Absent</p>
              <p className="text-2xl font-bold text-red-700">{absentCount}</p>
            </div>
            <X className="text-red-600" size={24} />
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-orange-50">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-orange-600/80">Late</p>
              <p className="text-2xl font-bold text-orange-700">{lateCount}</p>
            </div>
            <Clock className="text-orange-600" size={24} />
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-blue-50">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600/80">Total</p>
              <p className="text-2xl font-bold text-blue-700">{students.length}</p>
            </div>
            <ClipboardList className="text-blue-600" size={24} />
          </CardContent>
        </Card>
      </div>

      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="space-y-2 min-w-[200px]">
            <label className="text-sm font-medium text-slate-700">Select Class</label>
            <Select value={selectedClass} onValueChange={handleClassChange}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a class..." />
              </SelectTrigger>
              <SelectContent>
                {classes.map((cls: any) => (
                  <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {selectedClass && students.length > 0 && (
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-sm text-slate-500">Mark all:</span>
              <Button variant="outline" size="sm" onClick={() => handleMarkAll('present')} className="text-green-600 border-green-200 hover:bg-green-50">
                <Check size={14} className="mr-1" /> All Present
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleMarkAll('absent')} className="text-red-600 border-red-200 hover:bg-red-50">
                <X size={14} className="mr-1" /> All Absent
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleMarkAll('late')} className="text-orange-600 border-orange-200 hover:bg-orange-50">
                <Clock size={14} className="mr-1" /> All Late
              </Button>
            </div>
          )}
        </div>

        {selectedClass && (
          <div className="rounded-lg border border-slate-100 overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="w-[100px]">Adm #</TableHead>
                  <TableHead>Student Name</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-10">Loading...</TableCell>
                  </TableRow>
                ) : students.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-10">No students found in this class.</TableCell>
                  </TableRow>
                ) : (
                  students.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium text-slate-500">{student.admissionNumber}</TableCell>
                      <TableCell className="font-semibold">{student.displayName}</TableCell>
                      <TableCell>
                        <div className="flex justify-center gap-2">
                          <Button 
                            variant={attendance[student.id] === 'present' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => handleStatusChange(student.id, 'present')}
                            className={attendance[student.id] === 'present' ? 'bg-green-600 hover:bg-green-700' : 'hover:bg-green-50 hover:text-green-600'}
                          >
                            <Check size={16} className="mr-1" /> Present
                          </Button>
                          <Button 
                            variant={attendance[student.id] === 'absent' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => handleStatusChange(student.id, 'absent')}
                            className={attendance[student.id] === 'absent' ? 'bg-red-600 hover:bg-red-700' : 'hover:bg-red-50 hover:text-red-600'}
                          >
                            <X size={16} className="mr-1" /> Absent
                          </Button>
                          <Button 
                            variant={attendance[student.id] === 'late' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => handleStatusChange(student.id, 'late')}
                            className={attendance[student.id] === 'late' ? 'bg-orange-600 hover:bg-orange-700' : 'hover:bg-orange-50 hover:text-orange-600'}
                          >
                            <Clock size={16} className="mr-1" /> Late
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Attendance History</DialogTitle>
            <DialogDescription>View past attendance records for this class.</DialogDescription>
          </DialogHeader>
          <div className="max-h-[400px] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Present</TableHead>
                  <TableHead>Absent</TableHead>
                  <TableHead>Late</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {historyRecords.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8">No records found.</TableCell>
                  </TableRow>
                ) : (
                  historyRecords.map((record, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">{record.date}</TableCell>
                      <TableCell>
                        <Badge className={record.status === 'present' ? 'bg-green-100 text-green-700' : 'bg-slate-100'}>
                          {record.status === 'present' ? 'Yes' : '-'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={record.status === 'absent' ? 'bg-red-100 text-red-700' : 'bg-slate-100'}>
                          {record.status === 'absent' ? 'Yes' : '-'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={record.status === 'late' ? 'bg-orange-100 text-orange-700' : 'bg-slate-100'}>
                          {record.status === 'late' ? 'Yes' : '-'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setHistoryOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}