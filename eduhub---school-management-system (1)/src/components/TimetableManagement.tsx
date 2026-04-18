import React, { useState } from 'react';
import { useFirestoreCollection } from '../lib/useFirestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, addDoc, doc, updateDoc, deleteDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Clock, Plus, BookOpen, User, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const TIME_SLOTS = [
  '08:00 AM - 09:00 AM',
  '09:00 AM - 10:00 AM',
  '10:00 AM - 11:00 AM',
  '11:00 AM - 12:00 PM',
  '12:00 PM - 01:00 PM',
  '01:00 PM - 02:00 PM',
  '02:00 PM - 03:00 PM',
];

interface TimetableEntry {
  id: string;
  classId: string;
  day: string;
  timeSlot: string;
  subject: string;
  teacherId: string;
  schoolId: string;
}

export default function TimetableManagement() {
  const { profile } = useAuth();
  const { data: classes } = useFirestoreCollection<any>('classes');
  const { data: teachers } = useFirestoreCollection<any>('teachers', [], false);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newEntry, setNewEntry] = useState({
    day: '',
    timeSlot: '',
    subject: '',
    teacherId: '',
  });

  const { data: timetableEntries, loading, refetch } = useFirestoreCollection<TimetableEntry>(
    selectedClass ? 'timetable' : 'timetable', 
    selectedClass ? [where('classId', '==', selectedClass)] : [],
    false
  );

  const handleAddEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClass) {
      toast.error("Please select a class first");
      return;
    }
    try {
      await addDoc(collection(db, 'timetable'), {
        ...newEntry,
        classId: selectedClass,
        schoolId: profile?.schoolId || 'default_school',
        createdAt: serverTimestamp(),
      });
      toast.success("Schedule added successfully");
      setIsAddDialogOpen(false);
      setNewEntry({ day: '', timeSlot: '', subject: '', teacherId: '' });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'timetable');
    }
  };

  const handleDeleteEntry = async (entryId: string) => {
    try {
      await deleteDoc(doc(db, 'timetable', entryId));
      toast.success("Schedule deleted successfully");
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'timetable');
    }
  };

  const getEntry = (day: string, timeSlot: string) => {
    return timetableEntries.find(
      e => e.day === day && e.timeSlot === timeSlot
    );
  };

  const handleClassChange = (value: string) => {
    setSelectedClass(value);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Academic Timetable</h1>
          <p className="text-slate-500 mt-1">Schedule and view class timings and subject assignments.</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={selectedClass} onValueChange={handleClassChange}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select Class" />
            </SelectTrigger>
            <SelectContent>
              {classes.map((cls: any) => (
                <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-indigo-600 hover:bg-indigo-700 gap-2" disabled={!selectedClass}>
                <Plus size={18} />
                Add Schedule
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <form onSubmit={handleAddEntry}>
                <DialogHeader>
                  <DialogTitle>Add Schedule</DialogTitle>
                  <DialogDescription>Add a new timetable entry.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="day">Day</Label>
                    <select 
                      id="day"
                      className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950"
                      value={newEntry.day}
                      onChange={(e) => setNewEntry({...newEntry, day: e.target.value})}
                      required
                    >
                      <option value="">Select a day</option>
                      {DAYS.map(day => (
                        <option key={day} value={day}>{day}</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="timeSlot">Time Slot</Label>
                    <select 
                      id="timeSlot"
                      className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950"
                      value={newEntry.timeSlot}
                      onChange={(e) => setNewEntry({...newEntry, timeSlot: e.target.value})}
                      required
                    >
                      <option value="">Select time</option>
                      {TIME_SLOTS.map(slot => (
                        <option key={slot} value={slot}>{slot}</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="subject">Subject</Label>
                    <Input 
                      id="subject" 
                      placeholder="e.g. Mathematics"
                      value={newEntry.subject} 
                      onChange={(e) => setNewEntry({...newEntry, subject: e.target.value})}
                      required 
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="teacher">Teacher</Label>
                    <select 
                      id="teacher"
                      className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950"
                      value={newEntry.teacherId}
                      onChange={(e) => setNewEntry({...newEntry, teacherId: e.target.value})}
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
                  <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">Add Schedule</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {!selectedClass ? (
        <Card className="border-none shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Calendar className="w-16 h-16 text-slate-200 mb-4" />
            <p className="text-slate-500">Select a class to view its timetable.</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-none shadow-sm">
          <CardHeader className="border-b border-slate-100 pb-4">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-600" />
              Weekly Schedule - {classes.find((c: any) => c.id === selectedClass)?.name}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="w-[200px] border-r border-slate-100 font-bold">Time Slot</TableHead>
                  {DAYS.map(day => (
                    <TableHead key={day} className="min-w-[150px] font-bold text-center">{day}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {TIME_SLOTS.map(slot => (
                  <TableRow key={slot} className="h-24">
                    <TableCell className="font-medium text-slate-500 border-r border-slate-100 flex items-center gap-2">
                      <Clock size={14} />
                      {slot}
                    </TableCell>
                    {DAYS.map(day => {
                      const entry = getEntry(day, slot);
                      return (
                        <TableCell key={`${day}-${slot}`} className="p-2 border-r border-slate-50 last:border-r-0">
                          {entry ? (
                            <div className="h-full w-full bg-indigo-50 rounded-lg p-3 border border-indigo-100 flex flex-col justify-center relative group">
                              <div className="flex items-center gap-1 text-indigo-700 font-bold text-sm mb-1">
                                <BookOpen size={12} />
                                {entry.subject}
                              </div>
                              <div className="flex items-center gap-1 text-slate-500 text-xs">
                                <User size={10} />
                                {teachers.find((t: any) => t.id === entry.teacherId)?.displayName || 'Unknown'}
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 hover:bg-red-50"
                                onClick={() => handleDeleteEntry(entry.id)}
                              >
                                <Trash2 size={12} />
                              </Button>
                            </div>
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-slate-300 italic text-xs">
                              No Class
                            </div>
                          )}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}