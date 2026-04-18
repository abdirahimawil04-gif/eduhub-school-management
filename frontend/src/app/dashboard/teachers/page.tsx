'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Plus, Search, Edit, Trash2, X, Mail, Phone, Calendar } from 'lucide-react';

interface Teacher {
  id: string;
  employee_id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  gender: string;
  date_of_birth: string;
  phone: string;
  photo?: string;
  address: string;
  qualification: string;
  experience: number;
  salary?: number;
  join_date: string;
  class_teacher_of?: { id: string; name: string };
  subjects_list?: { id: string; name: string }[];
  is_active: boolean;
}

interface ClassSection {
  id: string;
  name: string;
}

interface Subject {
  id: string;
  name: string;
}

export default function TeachersPage() {
  const { user } = useAuth();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classes, setClasses] = useState<ClassSection[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    gender: 'male',
    date_of_birth: '',
    phone: '',
    address: '',
    qualification: '',
    experience: 0,
    salary: '',
    join_date: '',
    class_teacher_of: '',
    subjects: [] as string[],
    email: '',
  });

  useEffect(() => {
    fetchTeachers();
    fetchClasses();
    fetchSubjects();
  }, [search]);

  const fetchTeachers = async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      const res = await api.get(`/teachers/?${params}`);
      setTeachers(Array.isArray(res.data) ? res.data : res.data.results || []);
    } catch (error) {
      console.error('Error fetching teachers:', error);
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

  const fetchSubjects = async () => {
    try {
      const res = await api.get('/academics/subjects/');
      setSubjects(Array.isArray(res.data) ? res.data : res.data.results || []);
    } catch (error) {
      console.error('Error fetching subjects:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        branch: user?.branch?.id,
        class_teacher_of: formData.class_teacher_of || null,
        salary: formData.salary ? parseFloat(formData.salary) : null,
        subjects: formData.subjects,
      };
      if (editingTeacher) {
        await api.patch(`/teachers/${editingTeacher.id}/`, data);
      } else {
        await api.post('/teachers/', data);
      }
      setShowModal(false);
      resetForm();
      fetchTeachers();
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Error saving teacher');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this teacher?')) return;
    try {
      await api.delete(`/teachers/${id}/`);
      fetchTeachers();
    } catch (error) {
      console.error('Error deleting teacher:', error);
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
      qualification: '',
      experience: 0,
      salary: '',
      join_date: '',
      class_teacher_of: '',
      subjects: [],
      email: '',
    });
    setEditingTeacher(null);
  };

  const openEditModal = (teacher: Teacher) => {
    setEditingTeacher(teacher);
    setFormData({
      first_name: teacher.first_name,
      last_name: teacher.last_name,
      gender: teacher.gender,
      date_of_birth: teacher.date_of_birth,
      phone: teacher.phone || '',
      address: teacher.address || '',
      qualification: teacher.qualification || '',
      experience: teacher.experience,
      salary: teacher.salary?.toString() || '',
      join_date: teacher.join_date,
      class_teacher_of: teacher.class_teacher_of?.id || '',
      subjects: teacher.subjects_list?.map(s => s.id) || [],
      email: '',
    });
    setShowModal(true);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Teachers</h1>
          <p className="text-slate-500">Manage teacher records</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowModal(true); }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Teacher
        </button>
      </div>

      <div className="card">
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, employee ID..."
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
                  <th className="px-4 py-3 text-left">Employee ID</th>
                  <th className="px-4 py-3 text-left">Name</th>
                  <th className="px-4 py-3 text-left">Qualification</th>
                  <th className="px-4 py-3 text-left">Experience</th>
                  <th className="px-4 py-3 text-left">Phone</th>
                  <th className="px-4 py-3 text-left">Class Teacher</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {teachers.map((teacher) => (
                  <tr key={teacher.id} className="table-row">
                    <td className="px-4 py-3 font-mono text-sm">{teacher.employee_id}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                          <span className="text-xs font-medium text-emerald-600">
                            {teacher.first_name[0]}{teacher.last_name[0]}
                          </span>
                        </div>
                        <span className="font-medium">{teacher.full_name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">{teacher.qualification || '-'}</td>
                    <td className="px-4 py-3">{teacher.experience} yrs</td>
                    <td className="px-4 py-3">{teacher.phone || '-'}</td>
                    <td className="px-4 py-3">{teacher.class_teacher_of?.name || '-'}</td>
                    <td className="px-4 py-3">
                      <span className={`badge ${teacher.is_active ? 'badge-success' : 'badge-danger'}`}>
                        {teacher.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(teacher)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(teacher.id)}
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
            {teachers.length === 0 && (
              <div className="text-center py-8 text-slate-500">
                No teachers found
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
                {editingTeacher ? 'Edit Teacher' : 'Add New Teacher'}
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
                  <label className="label">Join Date *</label>
                  <input
                    type="date"
                    value={formData.join_date}
                    onChange={(e) => setFormData({ ...formData, join_date: e.target.value })}
                    className="input"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Qualification</label>
                  <input
                    type="text"
                    value={formData.qualification}
                    onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Experience (years)</label>
                  <input
                    type="number"
                    value={formData.experience}
                    onChange={(e) => setFormData({ ...formData, experience: parseInt(e.target.value) })}
                    className="input"
                    min="0"
                  />
                </div>
              </div>
              <div>
                <label className="label">Salary</label>
                <input
                  type="number"
                  value={formData.salary}
                  onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                  className="input"
                  step="0.01"
                />
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
                <h3 className="font-medium text-slate-900 mb-3">Assignment</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Class Teacher Of</label>
                    <select
                      value={formData.class_teacher_of}
                      onChange={(e) => setFormData({ ...formData, class_teacher_of: e.target.value })}
                      className="input"
                    >
                      <option value="">None</option>
                      {classes.map((cls) => (
                        <option key={cls.id} value={cls.id}>{cls.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label">Subjects</label>
                    <div className="flex flex-wrap gap-2">
                      {subjects.slice(0, 4).map((subj) => (
                        <label key={subj.id} className="flex items-center gap-1 text-sm">
                          <input
                            type="checkbox"
                            checked={formData.subjects.includes(subj.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData({ ...formData, subjects: [...formData.subjects, subj.id] });
                              } else {
                                setFormData({ ...formData, subjects: formData.subjects.filter(s => s !== subj.id) });
                              }
                            }}
                            className="rounded text-blue-500"
                          />
                          {subj.name}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingTeacher ? 'Update Teacher' : 'Add Teacher'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}