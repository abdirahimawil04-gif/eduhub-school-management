'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Calendar, Check, X, Clock, Users, UserCheck } from 'lucide-react';

interface Student {
  student_id: string;
  admission_number: string;
  full_name: string;
  roll_number: string;
  status: string;
  remarks: string;
}

interface ClassSection {
  id: string;
  name: string;
}

interface AttendanceSummary {
  date: string;
  total_students: number;
  present: number;
  absent: number;
  late: number;
  leave: number;
  present_percentage: number;
}

export default function AttendancePage() {
  const { user } = useAuth();
  const [classes, setClasses] = useState<ClassSection[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [students, setStudents] = useState<Student[]>([]);
  const [summary, setSummary] = useState<AttendanceSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    if (selectedClass && selectedDate) {
      fetchAttendance();
    }
  }, [selectedClass, selectedDate]);

  const fetchClasses = async () => {
    try {
      const res = await api.get('/academics/classes/');
      setClasses(Array.isArray(res.data) ? res.data : res.data.results || []);
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  };

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const [attRes, sumRes] = await Promise.all([
        api.get(`/attendance/students/by_class/?date=${selectedDate}&class=${selectedClass}`),
        api.get(`/attendance/students/summary/?date=${selectedDate}&class=${selectedClass}`).catch(() => ({ data: null })),
      ]);
      setStudents(attRes.data);
      setSummary(sumRes.data);
    } catch (error) {
      console.error('Error fetching attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (studentId: string, status: string) => {
    setStudents(students.map(s => 
      s.student_id === studentId ? { ...s, status } : s
    ));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const attendanceData = students.map(s => ({
        student_id: s.student_id,
        status: s.status,
        remarks: s.remarks,
      }));
      await api.post('/attendance/students/mark/', {
        date: selectedDate,
        class_section: selectedClass,
        attendance: attendanceData,
      });
      alert('Attendance saved successfully!');
      fetchAttendance();
    } catch (error) {
      console.error('Error saving attendance:', error);
      alert('Error saving attendance');
    } finally {
      setSaving(false);
    }
  };

  const markAll = (status: string) => {
    setStudents(students.map(s => ({ ...s, status })));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Attendance</h1>
          <p className="text-slate-500">Mark and view student attendance</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 items-end">
        <div>
          <label className="label">Select Date</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="input"
          />
        </div>
        <div>
          <label className="label">Select Class</label>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="input min-w-[200px]"
          >
            <option value="">Select Class</option>
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>{cls.name}</option>
            ))}
          </select>
        </div>
      </div>

      {selectedClass && summary && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="card text-center">
            <p className="text-sm text-slate-500">Total</p>
            <p className="text-2xl font-bold">{summary.total_students}</p>
          </div>
          <div className="card text-center">
            <p className="text-sm text-slate-500">Present</p>
            <p className="text-2xl font-bold text-emerald-600">{summary.present}</p>
          </div>
          <div className="card text-center">
            <p className="text-sm text-slate-500">Absent</p>
            <p className="text-2xl font-bold text-red-600">{summary.absent}</p>
          </div>
          <div className="card text-center">
            <p className="text-sm text-slate-500">Late</p>
            <p className="text-2xl font-bold text-amber-600">{summary.late}</p>
          </div>
          <div className="card text-center">
            <p className="text-sm text-slate-500">Present %</p>
            <p className="text-2xl font-bold text-blue-600">{summary.present_percentage}%</p>
          </div>
        </div>
      )}

      <div className="card">
        {selectedClass ? (
          <>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                Class {classes.find(c => c.id === selectedClass)?.name} - {selectedDate}
              </h3>
              <div className="flex gap-2">
                <button onClick={() => markAll('present')} className="btn-secondary text-sm py-1">All Present</button>
                <button onClick={() => markAll('absent')} className="btn-secondary text-sm py-1">All Absent</button>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="table-header">
                      <th className="px-4 py-3 text-left">Roll No.</th>
                      <th className="px-4 py-3 text-left">Admission No.</th>
                      <th className="px-4 py-3 text-left">Name</th>
                      <th className="px-4 py-3 text-center">Status</th>
                      <th className="px-4 py-3 text-left">Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student) => (
                      <tr key={student.student_id} className="table-row">
                        <td className="px-4 py-3">{student.roll_number || '-'}</td>
                        <td className="px-4 py-3 font-mono text-sm">{student.admission_number}</td>
                        <td className="px-4 py-3 font-medium">{student.full_name}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1">
                            {(['present', 'absent', 'late', 'leave'] as const).map((status) => (
                              <button
                                key={status}
                                onClick={() => handleStatusChange(student.student_id, status)}
                                className={`px-2 py-1 rounded text-xs font-medium capitalize transition-colors ${
                                  student.status === status
                                    ? status === 'present' ? 'bg-emerald-100 text-emerald-700'
                                    : status === 'absent' ? 'bg-red-100 text-red-700'
                                    : status === 'late' ? 'bg-amber-100 text-amber-700'
                                    : 'bg-blue-100 text-blue-700'
                                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                }`}
                              >
                                {status}
                              </button>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            value={student.remarks}
                            onChange={(e) => setStudents(students.map(s => 
                              s.student_id === student.student_id ? { ...s, remarks: e.target.value } : s
                            ))}
                            className="input py-1 text-sm"
                            placeholder="Add remark..."
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {students.length === 0 && (
                  <p className="text-center py-8 text-slate-500">No students in this class</p>
                )}
              </div>
            )}

            {students.length > 0 && (
              <div className="mt-4 flex justify-end">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="btn-primary"
                >
                  {saving ? 'Saving...' : 'Save Attendance'}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12 text-slate-500">
            <Users className="w-12 h-12 mx-auto mb-4 text-slate-300" />
            <p>Select a class to mark attendance</p>
          </div>
        )}
      </div>
    </div>
  );
}