'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Plus, Search, Edit, Trash2, X, BookOpen, GraduationCap } from 'lucide-react';

interface ClassSection {
  id: string;
  name: string;
  class_level: number;
  section: string;
  class_teacher_name?: string;
  student_count: number;
  subject_count: number;
}

interface Subject {
  id: string;
  name: string;
  code: string;
  class_section: { id: string; name: string };
  teacher_name?: string;
}

interface Exam {
  id: string;
  name: string;
  exam_type: string;
  class_section: { id: string; name: string };
  start_date: string;
  end_date: string;
}

export default function AcademicsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'classes' | 'subjects' | 'exams'>('classes');
  const [classes, setClasses] = useState<ClassSection[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'class' | 'subject' | 'exam'>('class');
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'classes') {
        const res = await api.get('/academics/classes/');
        setClasses(Array.isArray(res.data) ? res.data : res.data.results || []);
      } else if (activeTab === 'subjects') {
        const res = await api.get('/academics/subjects/');
        setSubjects(Array.isArray(res.data) ? res.data : res.data.results || []);
      } else {
        const res = await api.get('/academics/exams/');
        setExams(Array.isArray(res.data) ? res.data : res.data.results || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const endpoint = modalType === 'class' ? '/academics/classes/' 
        : modalType === 'subject' ? '/academics/subjects/' 
        : '/academics/exams/';
      
      await api.post(endpoint, { ...formData, branch: user?.branch?.id });
      setShowModal(false);
      setFormData({});
      fetchData();
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Error saving');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure?')) return;
    try {
      const endpoint = activeTab === 'classes' ? `/academics/classes/${id}/`
        : activeTab === 'subjects' ? `/academics/subjects/${id}/`
        : `/academics/exams/${id}/`;
      await api.delete(endpoint);
      fetchData();
    } catch (error) {
      console.error('Error deleting:', error);
    }
  };

  const openModal = (type: 'class' | 'subject' | 'exam') => {
    setModalType(type);
    setFormData({
      name: '', class_level: '', section: '', code: '', exam_type: 'terminal',
      start_date: '', end_date: '', class_section: '',
    });
    setShowModal(true);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Academics</h1>
          <p className="text-slate-500">Manage classes, subjects, and exams</p>
        </div>
      </div>

      <div className="flex gap-2 border-b border-slate-200">
        {(['classes', 'subjects', 'exams'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 font-medium capitalize transition-colors ${
              activeTab === tab
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold capitalize">{activeTab}</h3>
          <button onClick={() => openModal(activeTab.slice(0, -1) as any)} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add {activeTab.slice(0, -1)}
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : activeTab === 'classes' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {classes.map((cls) => (
              <div key={cls.id} className="p-4 border border-slate-200 rounded-lg hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-blue-500" />
                    <span className="font-semibold">{cls.name}</span>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => handleDelete(cls.id)} className="p-1 text-red-400 hover:text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <p className="text-sm text-slate-500">Level: Class {cls.class_level} - Section {cls.section || 'N/A'}</p>
                <p className="text-sm text-slate-500">Class Teacher: {cls.class_teacher_name || 'Not assigned'}</p>
                <div className="flex gap-4 mt-2 text-sm">
                  <span className="text-blue-600">{cls.student_count} Students</span>
                  <span className="text-purple-600">{cls.subject_count} Subjects</span>
                </div>
              </div>
            ))}
            {classes.length === 0 && <p className="text-slate-500 col-span-full text-center py-8">No classes found</p>}
          </div>
        ) : activeTab === 'subjects' ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="table-header">
                  <th className="px-4 py-3 text-left">Code</th>
                  <th className="px-4 py-3 text-left">Name</th>
                  <th className="px-4 py-3 text-left">Class</th>
                  <th className="px-4 py-3 text-left">Teacher</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {subjects.map((subj) => (
                  <tr key={subj.id} className="table-row">
                    <td className="px-4 py-3 font-mono text-sm">{subj.code}</td>
                    <td className="px-4 py-3 font-medium">{subj.name}</td>
                    <td className="px-4 py-3">{subj.class_section?.name}</td>
                    <td className="px-4 py-3">{subj.teacher_name || '-'}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => handleDelete(subj.id)} className="p-1.5 text-red-400 hover:text-red-600">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {subjects.length === 0 && <p className="text-slate-500 text-center py-8">No subjects found</p>}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="table-header">
                  <th className="px-4 py-3 text-left">Name</th>
                  <th className="px-4 py-3 text-left">Type</th>
                  <th className="px-4 py-3 text-left">Class</th>
                  <th className="px-4 py-3 text-left">Start Date</th>
                  <th className="px-4 py-3 text-left">End Date</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {exams.map((exam) => (
                  <tr key={exam.id} className="table-row">
                    <td className="px-4 py-3 font-medium">{exam.name}</td>
                    <td className="px-4 py-3">
                      <span className="badge badge-info capitalize">{exam.exam_type}</span>
                    </td>
                    <td className="px-4 py-3">{exam.class_section?.name}</td>
                    <td className="px-4 py-3">{exam.start_date}</td>
                    <td className="px-4 py-3">{exam.end_date}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => handleDelete(exam.id)} className="p-1.5 text-red-400 hover:text-red-600">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {exams.length === 0 && <p className="text-slate-500 text-center py-8">No exams found</p>}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md animate-fade-in">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h2 className="text-xl font-semibold">Add {modalType === 'class' ? 'Class' : modalType === 'subject' ? 'Subject' : 'Exam'}</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {modalType === 'class' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="label">Class Level *</label>
                      <input type="number" value={formData.class_level || ''} onChange={(e) => setFormData({...formData, class_level: e.target.value})} className="input" required />
                    </div>
                    <div>
                      <label className="label">Section</label>
                      <input type="text" value={formData.section || ''} onChange={(e) => setFormData({...formData, section: e.target.value})} className="input" placeholder="A" />
                    </div>
                  </div>
                  <div>
                    <label className="label">Name *</label>
                    <input type="text" value={formData.name || ''} onChange={(e) => setFormData({...formData, name: `Class ${formData.class_level || ''} - ${formData.section || 'A'}`})} className="input" required />
                  </div>
                </>
              )}
              {modalType === 'subject' && (
                <>
                  <div>
                    <label className="label">Name *</label>
                    <input type="text" value={formData.name || ''} onChange={(e) => setFormData({...formData, name: e.target.value})} className="input" required />
                  </div>
                  <div>
                    <label className="label">Code *</label>
                    <input type="text" value={formData.code || ''} onChange={(e) => setFormData({...formData, code: e.target.value})} className="input" required />
                  </div>
                  <div>
                    <label className="label">Class *</label>
                    <select value={formData.class_section || ''} onChange={(e) => setFormData({...formData, class_section: e.target.value})} className="input" required>
                      <option value="">Select Class</option>
                      {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                </>
              )}
              {modalType === 'exam' && (
                <>
                  <div>
                    <label className="label">Name *</label>
                    <input type="text" value={formData.name || ''} onChange={(e) => setFormData({...formData, name: e.target.value})} className="input" required />
                  </div>
                  <div>
                    <label className="label">Type *</label>
                    <select value={formData.exam_type || ''} onChange={(e) => setFormData({...formData, exam_type: e.target.value})} className="input" required>
                      <option value="terminal">Terminal</option>
                      <option value="unit">Unit Test</option>
                      <option value="final">Final Exam</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Class *</label>
                    <select value={formData.class_section || ''} onChange={(e) => setFormData({...formData, class_section: e.target.value})} className="input" required>
                      <option value="">Select Class</option>
                      {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="label">Start Date *</label>
                      <input type="date" value={formData.start_date || ''} onChange={(e) => setFormData({...formData, start_date: e.target.value})} className="input" required />
                    </div>
                    <div>
                      <label className="label">End Date *</label>
                      <input type="date" value={formData.end_date || ''} onChange={(e) => setFormData({...formData, end_date: e.target.value})} className="input" required />
                    </div>
                  </div>
                </>
              )}
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}