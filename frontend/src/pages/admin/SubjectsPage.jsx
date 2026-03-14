import React, { useEffect, useState } from 'react';
import { subjectService, semesterService } from '../../services/api';
import toast from 'react-hot-toast';
import { PlusIcon, PencilIcon, TrashIcon, BookOpenIcon } from '@heroicons/react/24/outline';
import Modal from '../../components/Modal';

const SubjectsPage = () => {
  const [subjects,  setSubjects]  = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [semFilter, setSemFilter] = useState('');
  const [modal, setModal]         = useState({ open: false, data: null });
  const [form, setForm]           = useState({ name: '', code: '', semester: '', description: '', credits: 2, hasLab: true });

  const load = async () => {
    try {
      const [s, sem] = await Promise.all([subjectService.getAll(semFilter ? { semester: semFilter } : {}), semesterService.getAll()]);
      setSubjects(s.data.subjects);
      setSemesters(sem.data.semesters);
    } catch { toast.error('Failed to load subjects'); }
    finally  { setLoading(false); }
  };
  useEffect(() => { load(); }, [semFilter]);

  const openAdd  = () => { setForm({ name: '', code: '', semester: '', description: '', credits: 2, hasLab: true }); setModal({ open: true, data: null }); };
  const openEdit = (s) => { setForm({ name: s.name, code: s.code, semester: s.semester?._id || s.semester, description: s.description || '', credits: s.credits, hasLab: s.hasLab }); setModal({ open: true, data: s }); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (modal.data) { await subjectService.update(modal.data._id, form); toast.success('Subject updated'); }
      else            { await subjectService.create(form);                  toast.success('Subject created'); }
      setModal({ open: false, data: null }); load();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this subject?')) return;
    try { await subjectService.remove(id); toast.success('Deleted'); load(); }
    catch { toast.error('Failed to delete'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div><h1 className="page-title">Subjects</h1><p className="page-subtitle">Manage Jaihind College of Pharmacy subjects across all semesters</p></div>
        <div className="flex items-center gap-3">
          <select className="input w-auto" value={semFilter} onChange={e => setSemFilter(e.target.value)}>
            <option value="">All Semesters</option>
            {semesters.map(s => <option key={s._id} value={s._id}>Semester {s.number}</option>)}
          </select>
          <button onClick={openAdd} className="btn-primary"><PlusIcon className="w-4 h-4" />Add Subject</button>
        </div>
      </div>

      {loading ? <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" /></div> : (
        <div className="table-wrapper">
          <table className="table">
            <thead><tr><th>Subject Name</th><th>Code</th><th>Semester</th><th>Credits</th><th>Labs</th><th>Actions</th></tr></thead>
            <tbody>
              {subjects.map(s => (
                <tr key={s._id}>
                  <td><div className="font-medium text-gray-900">{s.name}</div><div className="text-xs text-gray-500">{s.description}</div></td>
                  <td><span className="badge badge-blue">{s.code}</span></td>
                  <td>Semester {s.semester?.number}</td>
                  <td>{s.credits}</td>
                  <td><span className={`badge ${s.hasLab ? 'badge-green' : 'badge-gray'}`}>{s.labs?.length || 0} labs</span></td>
                  <td>
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEdit(s)} className="btn-ghost p-1.5"><PencilIcon className="w-4 h-4 text-gray-500" /></button>
                      <button onClick={() => handleDelete(s._id)} className="btn-ghost p-1.5"><TrashIcon className="w-4 h-4 text-red-500" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {subjects.length === 0 && <tr><td colSpan={6} className="text-center py-8 text-gray-400"><BookOpenIcon className="w-8 h-8 mx-auto mb-2 opacity-30" />No subjects found</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={modal.open} onClose={() => setModal({ open: false, data: null })} title={modal.data ? 'Edit Subject' : 'Add Subject'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><label className="label">Subject Name</label><input type="text" className="input" required value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Subject Code</label><input type="text" className="input" required placeholder="e.g. PIC101" value={form.code} onChange={e => setForm(p => ({...p, code: e.target.value}))} /></div>
            <div><label className="label">Credits</label><input type="number" className="input" min="1" max="6" value={form.credits} onChange={e => setForm(p => ({...p, credits: e.target.value}))} /></div>
          </div>
          <div><label className="label">Semester</label>
            <select className="input" required value={form.semester} onChange={e => setForm(p => ({...p, semester: e.target.value}))}>
              <option value="">Select semester</option>
              {semesters.map(s => <option key={s._id} value={s._id}>Semester {s.number} — {s.name}</option>)}
            </select>
          </div>
          <div><label className="label">Description</label><textarea className="input" rows={2} value={form.description} onChange={e => setForm(p => ({...p, description: e.target.value}))} /></div>
          <div className="flex items-center gap-2"><input type="checkbox" id="hl" checked={form.hasLab} onChange={e => setForm(p => ({...p, hasLab: e.target.checked}))} /><label htmlFor="hl" className="text-sm text-gray-700">Has Laboratory</label></div>
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={() => setModal({ open: false, data: null })} className="btn-outline">Cancel</button>
            <button type="submit" className="btn-primary">{modal.data ? 'Update' : 'Create'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default SubjectsPage;
