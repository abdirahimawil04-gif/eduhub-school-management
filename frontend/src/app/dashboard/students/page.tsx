'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Plus, Search, Edit, Trash2, X, Filter, ChevronLeft, ChevronRight } from 'lucide-react';

interface Student {
  id: string;
  admission_number: string;
  first_name: string;
  last_name: string;
  full_name: string;
  gender: string;
  date_of_birth: string;
  phone: string;
  email?: string;
  photo?: string;
  address: string;
  parent_name: string;
  parent_phone: string;
  parent_email: string;
  roll_number: string;
  class_section: string;
  class_section_name?: string;
  branch: string;
  branch_name: string;
  is_active: boolean;
  created_at?: string;
}

interface ClassSection {
  id: string;
  name: string;
  class_level: number;
  section: string;
}

export default function StudentsPage() {
  const { user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    gender: 'male',
    date_of_birth: '',
    phone: '',
    address: '',
    parent_name: '',
    parent_phone: '',
    parent_email: '',
    roll_number: '',
    class_section: '',
    email: '',
    password: '',
  });

  useEffect(() => {
    fetchStudents();
  }, [search, classFilter, statusFilter, pagination.page]);

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchStudents = async () => {
    try {
      const params = new URLSearchParams();
      params.append('page', pagination.page.toString());
      if (search) params.append('search', search);
      if (classFilter) params.append('class', classFilter);
      if (statusFilter) params.append('is_active', statusFilter);
      const res = await api.get(`/students/?${params}`);
      const data = res.data;
      setStudents(data.results || data);
      if (data.total_pages) {
        setPagination(prev => ({ ...prev, totalPages: data.total_pages }));
      }
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchClasses = async () => {
    try {
      const res = await api.get('/academics/classes/');
      setClasses(Array.isArray(res.data) ? res.data : res.data.results || []);
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        gender: formData.gender,
        date_of_birth: formData.date_of_birth,
        phone: formData.phone,
        address: formData.address,
        parent_name: formData.parent_name,
        parent_phone: formData.parent_phone,
        parent_email: formData.parent_email,
        roll_number: formData.roll_number,
        class_section: formData.class_section || null,
        email: formData.email || undefined,
      };

      if (editingStudent) {
        await api.patch(`/students/${editingStudent.id}/`, payload);
      } else {
        await api.post('/students/', payload);
      }
      setShowModal(false);
      resetForm();
      fetchStudents();
    } catch (error: any) {
      const err = error.response?.data;
      if (typeof err === 'object') {
        alert(Object.values(err).flat().join(', '));
      } else {
        alert('Error saving student');
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this student?')) return;
    try {
      await api.delete(`/students/${id}/`);
      fetchStudents();
    } catch (error) {
      console.error('Error deleting student:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      first_name: '',
      last_name: '',
      gender: 'male',
      date_of_birth: '',
      phone: '',
      address: '',
      parent_name: '',
      parent_phone: '',
      parent_email: '',
      roll_number: '',
      class_section: '',
      email: '',
      password: '',
    });
    setEditingStudent(null);
  };

  const openEditModal = (student: Student) => {
    setEditingStudent(student);
    setFormData({
      first_name: student.first_name,
      last_name: student.last_name,
      gender: student.gender,
      date_of_birth: student.date_of_birth,
      phone: student.phone || '',
      address: student.address || '',
      parent_name: student.parent_name || '',
      parent_phone: student.parent_phone || '',
      parent_email: student.parent_email || '',
      roll_number: student.roll_number || '',
      class_section: student.class_section || '',
      email: student.email || '',
      password: '',
    });
    setShowModal(true);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Students</h1>
          <p className="text-slate-500">Manage student records</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowModal(true); }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Student
        </button>
      </div>

      <div className="card">
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, admission number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-10"
            />
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
                  <th className="px-4 py-3 text-left">Admission No.</th>
                  <th className="px-4 py-3 text-left">Name</th>
                  <th className="px-4 py-3 text-left">Class</th>
                  <th className="px-4 py-3 text-left">Roll No.</th>
                  <th className="px-4 py-3 text-left">Gender</th>
                  <th className="px-4 py-3 text-left">Phone</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr key={student.id} className="table-row">
                    <td className="px-4 py-3 font-mono text-sm">{student.admission_number}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-xs font-medium text-blue-600">
                            {student.first_name[0]}{student.last_name[0]}
                          </span>
                        </div>
                        <span className="font-medium">{student.full_name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">{student.class_section_name || '-'}</td>
                    <td className="px-4 py-3">{student.roll_number || '-'}</td>
                    <td className="px-4 py-3 capitalize">{student.gender}</td>
                    <td className="px-4 py-3">{student.phone || '-'}</td>
                    <td className="px-4 py-3">
                      <span className={`badge ${student.is_active ? 'badge-success' : 'badge-danger'}`}>
                        {student.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(student)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(student.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {students.length === 0 && (
              <div className="text-center py-8 text-slate-500">
                No students found
              </div>
            )}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-fade-in">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h2 className="text-xl font-semibold">
                {editingStudent ? 'Edit Student' : 'Add New Student'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">First Name *</label>
                  <input
                    type="text"
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="label">Last Name *</label>
                  <input
                    type="text"
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    className="input"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Gender *</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="input"
                    required
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="label">Date of Birth *</label>
                  <input
                    type="date"
                    value={formData.date_of_birth}
                    onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                    className="input"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Phone</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Roll Number</label>
                  <input
                    type="text"
                    value={formData.roll_number}
                    onChange={(e) => setFormData({ ...formData, roll_number: e.target.value })}
                    className="input"
                  />
                </div>
              </div>
              <div>
                <label className="label">Address</label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="input"
                  rows={2}
                />
              </div>
              <div className="border-t border-slate-200 pt-4">
                <h3 className="font-medium text-slate-900 mb-3">Parent Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Parent Name</label>
                    <input
                      type="text"
                      value={formData.parent_name}
                      onChange={(e) => setFormData({ ...formData, parent_name: e.target.value })}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="label">Parent Phone</label>
                    <input
                      type="text"
                      value={formData.parent_phone}
                      onChange={(e) => setFormData({ ...formData, parent_phone: e.target.value })}
                      className="input"
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <label className="label">Parent Email</label>
                  <input
                    type="email"
                    value={formData.parent_email}
                    onChange={(e) => setFormData({ ...formData, parent_email: e.target.value })}
                    className="input"
                  />
                </div>
              </div>
              <div className="border-t border-slate-200 pt-4">
                <h3 className="font-medium text-slate-900 mb-3">Class Assignment</h3>
                <div>
                  <label className="label">Class Section</label>
                  <select
                    value={formData.class_section}
                    onChange={(e) => setFormData({ ...formData, class_section: e.target.value })}
                    className="input"
                  >
                    <option value="">Select Class</option>
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.id}>{cls.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingStudent ? 'Update Student' : 'Add Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}