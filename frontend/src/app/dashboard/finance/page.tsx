'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Plus, Search, DollarSign, FileText, CreditCard, X, CheckCircle, AlertCircle } from 'lucide-react';

interface Invoice {
  id: string;
  invoice_number: string;
  student: { id: string; full_name: string };
  issue_date: string;
  due_date: string;
  status: string;
  total_amount: number;
  paid_amount: number;
  pending_amount: number;
  is_paid: boolean;
}

interface FeeStructure {
  id: string;
  name: string;
  class_section: { id: string; name: string };
  amount: number;
  due_date: string;
  frequency: string;
}

interface ClassSection {
  id: string;
  name: string;
}

interface FinanceDashboard {
  total_invoiced: number;
  total_collected: number;
  total_pending: number;
  paid_invoices: number;
  partial_invoices: number;
  overdue_invoices: number;
}

export default function FinancePage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'invoices' | 'fees'>('invoices');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([]);
  const [classes, setClasses] = useState<ClassSection[]>([]);
  const [dashboard, setDashboard] = useState<FinanceDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'invoice' | 'fee'>('invoice');
  const [formData, setFormData] = useState<any>({});
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');

  useEffect(() => {
    fetchData();
  }, [activeTab, search]);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'invoices') {
        const params = new URLSearchParams();
        if (search) params.append('search', search);
        const res = await api.get(`/finance/?${params}`);
        setInvoices(Array.isArray(res.data) ? res.data : res.data.results || []);
      } else {
        const res = await api.get('/finance/fee-structures/');
        setFeeStructures(Array.isArray(res.data) ? res.data : res.data.results || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDashboard = async () => {
    try {
      const res = await api.get('/finance/invoices/dashboard/');
      setDashboard(res.data);
    } catch (error) {
      console.error('Error fetching dashboard:', error);
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
      if (modalType === 'fee') {
        await api.post('/finance/fee-structures/', { ...formData, branch: user?.branch?.id });
      } else {
        const studentRes = await api.get('/students/');
        const students = Array.isArray(studentRes.data) ? studentRes.data : studentRes.data.results || [];
        const student = students.find((s: any) => s.id === formData.student);
        if (student) {
          await api.post('/finance/', {
            student: formData.student,
            issue_date: formData.issue_date,
            due_date: formData.due_date,
            notes: formData.notes || '',
            items: [{ description: formData.description, amount: formData.amount, fee_structure_id: formData.fee_structure }],
          });
        }
      }
      setShowModal(false);
      setFormData({});
      fetchData();
      fetchDashboard();
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Error saving');
    }
  };

  const handlePayment = async () => {
    if (!selectedInvoice || !paymentAmount) return;
    try {
      await api.post(`/finance/${selectedInvoice.id}/add_payment/`, {
        amount: parseFloat(paymentAmount),
        payment_date: new Date().toISOString().split('T')[0],
        payment_method: 'cash',
      });
      setSelectedInvoice(null);
      setPaymentAmount('');
      fetchData();
      fetchDashboard();
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Error processing payment');
    }
  };

  const openModal = (type: 'invoice' | 'fee') => {
    setModalType(type);
    setFormData({
      issue_date: new Date().toISOString().split('T')[0],
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      amount: '',
      description: '',
      name: '',
      class_section: '',
      frequency: 'termly',
    });
    fetchClasses();
    setShowModal(true);
  };

  const getStatusBadge = (status: string) => {
    const styles: { [key: string]: string } = {
      paid: 'badge-success',
      partial: 'badge-warning',
      overdue: 'badge-danger',
      draft: 'badge-info',
      sent: 'badge-info',
    };
    return styles[status] || 'badge-info';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Finance</h1>
          <p className="text-slate-500">Manage fees, invoices, and payments</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => openModal('fee')} className="btn-secondary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Fee Structure
          </button>
          <button onClick={() => openModal('invoice')} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Create Invoice
          </button>
        </div>
      </div>

      {dashboard && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Total Invoiced</p>
                <p className="text-2xl font-bold">${dashboard.total_invoiced?.toLocaleString()}</p>
              </div>
              <FileText className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Collected</p>
                <p className="text-2xl font-bold text-emerald-600">${dashboard.total_collected?.toLocaleString()}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-emerald-500" />
            </div>
          </div>
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Pending</p>
                <p className="text-2xl font-bold text-amber-600">${dashboard.total_pending?.toLocaleString()}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-amber-500" />
            </div>
          </div>
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Paid Invoices</p>
                <p className="text-2xl font-bold text-blue-600">{dashboard.paid_invoices}</p>
              </div>
              <CreditCard className="w-8 h-8 text-blue-500" />
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-2 border-b border-slate-200">
        {(['invoices', 'fees'] as const).map((tab) => (
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
        <div className="flex items-center gap-4 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search invoices..."
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
        ) : activeTab === 'invoices' ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="table-header">
                  <th className="px-4 py-3 text-left">Invoice No.</th>
                  <th className="px-4 py-3 text-left">Student</th>
                  <th className="px-4 py-3 text-left">Issue Date</th>
                  <th className="px-4 py-3 text-left">Due Date</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="px-4 py-3 text-right">Paid</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id} className="table-row">
                    <td className="px-4 py-3 font-mono text-sm">{inv.invoice_number}</td>
                    <td className="px-4 py-3 font-medium">{inv.student?.full_name}</td>
                    <td className="px-4 py-3">{inv.issue_date}</td>
                    <td className="px-4 py-3">{inv.due_date}</td>
                    <td className="px-4 py-3 text-right font-medium">${inv.total_amount}</td>
                    <td className="px-4 py-3 text-right text-emerald-600">${inv.paid_amount}</td>
                    <td className="px-4 py-3">
                      <span className={`badge ${getStatusBadge(inv.status)}`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {!inv.is_paid && (
                        <button
                          onClick={() => setSelectedInvoice(inv)}
                          className="text-sm text-blue-600 hover:underline"
                        >
                          Add Payment
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {invoices.length === 0 && (
              <p className="text-center py-8 text-slate-500">No invoices found</p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {feeStructures.map((fee) => (
              <div key={fee.id} className="p-4 border border-slate-200 rounded-lg hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold">{fee.name}</span>
                  <span className="text-lg font-bold text-blue-600">${fee.amount}</span>
                </div>
                <p className="text-sm text-slate-500">{fee.class_section?.name}</p>
                <div className="flex items-center justify-between mt-2 text-sm">
                  <span className="text-slate-500">Due: {fee.due_date}</span>
                  <span className="capitalize badge badge-info">{fee.frequency}</span>
                </div>
              </div>
            ))}
            {feeStructures.length === 0 && (
              <p className="text-slate-500 col-span-full text-center py-8">No fee structures found</p>
            )}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md animate-fade-in">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h2 className="text-xl font-semibold">
                {modalType === 'fee' ? 'Add Fee Structure' : 'Create Invoice'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {modalType === 'fee' ? (
                <>
                  <div>
                    <label className="label">Name *</label>
                    <input type="text" value={formData.name || ''} onChange={(e) => setFormData({...formData, name: e.target.value})} className="input" required />
                  </div>
                  <div>
                    <label className="label">Amount *</label>
                    <input type="number" value={formData.amount || ''} onChange={(e) => setFormData({...formData, amount: e.target.value})} className="input" required />
                  </div>
                  <div>
                    <label className="label">Class *</label>
                    <select value={formData.class_section || ''} onChange={(e) => setFormData({...formData, class_section: e.target.value})} className="input" required>
                      <option value="">Select Class</option>
                      {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label">Frequency</label>
                    <select value={formData.frequency || ''} onChange={(e) => setFormData({...formData, frequency: e.target.value})} className="input">
                      <option value="monthly">Monthly</option>
                      <option value="termly">Termly</option>
                      <option value="yearly">Yearly</option>
                      <option value="one_time">One Time</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Due Date</label>
                    <input type="date" value={formData.due_date || ''} onChange={(e) => setFormData({...formData, due_date: e.target.value})} className="input" />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="label">Student *</label>
                    <input type="text" value={formData.student || ''} onChange={(e) => setFormData({...formData, student: e.target.value})} className="input" placeholder="Student ID" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="label">Issue Date</label>
                      <input type="date" value={formData.issue_date || ''} onChange={(e) => setFormData({...formData, issue_date: e.target.value})} className="input" />
                    </div>
                    <div>
                      <label className="label">Due Date</label>
                      <input type="date" value={formData.due_date || ''} onChange={(e) => setFormData({...formData, due_date: e.target.value})} className="input" />
                    </div>
                  </div>
                  <div>
                    <label className="label">Description *</label>
                    <input type="text" value={formData.description || ''} onChange={(e) => setFormData({...formData, description: e.target.value})} className="input" required />
                  </div>
                  <div>
                    <label className="label">Amount *</label>
                    <input type="number" value={formData.amount || ''} onChange={(e) => setFormData({...formData, amount: e.target.value})} className="input" required />
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

      {selectedInvoice && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md animate-fade-in">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h2 className="text-xl font-semibold">Add Payment</h2>
              <button onClick={() => setSelectedInvoice(null)} className="p-2 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-slate-50 p-4 rounded-lg">
                <p className="text-sm text-slate-500">Invoice</p>
                <p className="font-medium">{selectedInvoice.invoice_number}</p>
                <p className="text-sm text-slate-500 mt-2">Pending Amount</p>
                <p className="text-xl font-bold text-amber-600">${selectedInvoice.pending_amount}</p>
              </div>
              <div>
                <label className="label">Payment Amount</label>
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="input"
                  max={selectedInvoice.pending_amount}
                  placeholder="Enter amount"
                />
              </div>
              <button onClick={handlePayment} className="btn-primary w-full">
                Process Payment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}