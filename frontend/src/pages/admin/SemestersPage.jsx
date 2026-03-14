import React, { useEffect, useState } from 'react';
import { semesterService } from '../../services/api';
import toast from 'react-hot-toast';
import { PlusIcon, PencilIcon, TrashIcon, CalendarDaysIcon } from '@heroicons/react/24/outline';
import Modal from '../../components/Modal';

const SemestersPage = () => {
  const [semesters, setSemesters] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [modal, setModal]         = useState({ open: false, data: null });
  const [form, setForm]           = useState({ number: '', name: '', year: new Date().getFullYear(), description: '', isActive: true });

  const load = () => semesterService.getAll().then(({ data }) => setSemesters(data.semesters)).catch(() => toast.error('Failed to load semesters')).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const openAdd  = () => { setForm({ number: '', name: '', year: new Date().getFullYear(), description: '', isActive: true }); setModal({ open: true, data: null }); };
  const openEdit = (s) => { setForm({ number: s.number, name: s.name, year: s.year, description: s.description || '', isActive: s.isActive }); setModal({ open: true, data: s }); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (modal.data) { await semesterService.update(modal.data._id, form); toast.success('Semester updated'); }
      else            { await semesterService.create(form);                  toast.success('Semester created'); }
      setModal({ open: false, data: null }); load();
    } catch (err) { toast.error(err.response?.data?.message || 'Error saving semester'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this semester?')) return;
    try { await semesterService.remove(id); toast.success('Deleted'); load(); }
    catch { toast.error('Failed to delete'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="page-title">Semesters</h1><p className="page-subtitle">Manage B.Pharm 4-year course semesters (1–8)</p></div>
        <button onClick={openAdd} className="btn-primary"><PlusIcon className="w-4 h-4" />Add Semester</button>
      </div>

      {loading ? <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" /></div> : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {semesters.map((s) => (
            <div key={s._id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-lg">{s.number}</div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(s)} className="btn-ghost p-1.5"><PencilIcon className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(s._id)} className="btn-ghost p-1.5 text-red-500 hover:bg-red-50"><TrashIcon className="w-4 h-4" /></button>
                </div>
              </div>
              <div className="font-semibold text-gray-900">{s.name}</div>
              <div className="text-sm text-gray-500 mt-1">{s.description || 'No description'}</div>
              <div className="flex items-center gap-2 mt-3">
                <span className="text-xs text-gray-500">Year {s.year}</span>
                <span className={`badge ${s.isActive ? 'badge-green' : 'badge-gray'}`}>{s.isActive ? 'Active' : 'Inactive'}</span>
                <span className="text-xs text-gray-500 ml-auto">{s.subjects?.length || 0} subjects</span>
              </div>
            </div>
          ))}
          {semesters.length === 0 && <div className="col-span-4 text-center py-12 text-gray-400"><CalendarDaysIcon className="w-12 h-12 mx-auto mb-2 opacity-30" /><p>No semesters yet. Add semester 1 to get started.</p></div>}
        </div>
      )}

      <Modal open={modal.open} onClose={() => setModal({ open: false, data: null })} title={modal.data ? 'Edit Semester' : 'Add Semester'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Semester Number</label><input type="number" className="input" min="1" max="8" required value={form.number} onChange={e => setForm(p => ({...p, number: e.target.value}))} /></div>
            <div><label className="label">Academic Year</label><input type="number" className="input" required value={form.year} onChange={e => setForm(p => ({...p, year: e.target.value}))} /></div>
          </div>
          <div><label className="label">Name</label><input type="text" className="input" required placeholder="e.g. Semester 1" value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))} /></div>
          <div><label className="label">Description</label><textarea className="input" rows={2} value={form.description} onChange={e => setForm(p => ({...p, description: e.target.value}))} /></div>
          <div className="flex items-center gap-2"><input type="checkbox" id="isActive" checked={form.isActive} onChange={e => setForm(p => ({...p, isActive: e.target.checked}))} /><label htmlFor="isActive" className="text-sm text-gray-700">Active Semester</label></div>
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={() => setModal({ open: false, data: null })} className="btn-outline">Cancel</button>
            <button type="submit" className="btn-primary">{modal.data ? 'Update' : 'Create'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default SemestersPage;
