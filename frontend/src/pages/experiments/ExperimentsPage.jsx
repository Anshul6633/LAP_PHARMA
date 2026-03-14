import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { experimentService, labService, semesterService } from '../../services/api';
import toast from 'react-hot-toast';
import { PlusIcon, BeakerIcon, MagnifyingGlassIcon, CheckBadgeIcon, PencilIcon, TrashIcon, EyeIcon } from '@heroicons/react/24/outline';
import Modal from '../../components/Modal';
import { useAuth } from '../../context/AuthContext';

const CATS = ['Pharmaceutical Chemistry','Pharmacognosy','Pharmacology','Pharmaceutical Analysis','Dispensing Pharmacy','Industrial Pharmacy'];
const DIFF = ['easy','medium','hard'];

const defaultForm = { name:'', experimentNo:'', objective:'', theory:'', lab:'', semester:'', category:'', duration:3, difficulty:'medium', procedure:'', observations:'', result:'', precautions:'', tags:'' };

const ExperimentsPage = () => {
  const { isAdmin, isInstructor } = useAuth();
  const [experiments, setExperiments] = useState([]);
  const [labs,        setLabs]        = useState([]);
  const [semesters,   setSemesters]   = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [search,      setSearch]      = useState('');
  const [semFilter,   setSemFilter]   = useState('');
  const [labFilter,   setLabFilter]   = useState('');
  const [modal,       setModal]       = useState({ open: false, data: null });
  const [form,        setForm]        = useState(defaultForm);

  const load = async () => {
    try {
      const params = {};
      if (semFilter) params.semester = semFilter;
      if (labFilter)  params.lab = labFilter;
      if (search)     params.search = search;
      const [e, l, s] = await Promise.all([experimentService.getAll(params), labService.getAll(), semesterService.getAll()]);
      setExperiments(e.data.experiments); setLabs(l.data.labs); setSemesters(s.data.semesters);
    } catch { toast.error('Failed to load experiments'); }
    finally  { setLoading(false); }
  };
  useEffect(() => { load(); }, [semFilter, labFilter]);

  const handleSearch = (e) => { e.preventDefault(); setLoading(true); load(); };
  const openAdd  = () => { setForm(defaultForm); setModal({ open: true, data: null }); };
  const openEdit = (exp) => {
    setForm({ ...exp, lab: exp.lab?._id||exp.lab, semester: exp.semester?._id||exp.semester, tags: (exp.tags||[]).join(', ') });
    setModal({ open: true, data: exp });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form, tags: form.tags ? form.tags.split(',').map(t=>t.trim()) : [] };
      if (modal.data) { await experimentService.update(modal.data._id, payload); toast.success('Updated'); }
      else            { await experimentService.create(payload);                  toast.success('Created'); }
      setModal({ open: false, data: null }); load();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
  };

  const handleApprove = async (id) => {
    try { await experimentService.approve(id); toast.success('Experiment approved'); load(); }
    catch { toast.error('Failed to approve'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this experiment?')) return;
    try { await experimentService.remove(id); toast.success('Deleted'); load(); }
    catch { toast.error('Failed to delete'); }
  };

  const diffColors = { easy: 'badge-green', medium: 'badge-yellow', hard: 'badge-red' };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div><h1 className="page-title">Experiments</h1><p className="page-subtitle">Browse Jaihind College of Pharmacy lab experiments by semester and subject</p></div>
        {(isAdmin || isInstructor) && <button onClick={openAdd} className="btn-primary"><PlusIcon className="w-4 h-4" />Add Experiment</button>}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <form onSubmit={handleSearch} className="relative flex-1 min-w-[200px] flex gap-2">
          <input type="text" className="input pl-9" placeholder="Search experiments..." value={search} onChange={e=>setSearch(e.target.value)} />
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <button type="submit" className="btn-primary px-3">Search</button>
        </form>
        <select className="input w-48" value={semFilter} onChange={e=>setSemFilter(e.target.value)}>
          <option value="">All Semesters</option>
          {semesters.map(s=><option key={s._id} value={s._id}>Semester {s.number}</option>)}
        </select>
        <select className="input w-48" value={labFilter} onChange={e=>setLabFilter(e.target.value)}>
          <option value="">All Labs</option>
          {labs.map(l=><option key={l._id} value={l._id}>{l.name}</option>)}
        </select>
      </div>

      {loading ? <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" /></div> : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {experiments.map(exp => (
            <div key={exp._id} className="card hover:shadow-md transition-shadow flex flex-col">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="badge badge-blue text-[11px]">{exp.experimentNo || 'N/A'}</span>
                  {exp.isApproved && <span className="badge badge-green flex items-center gap-0.5"><CheckBadgeIcon className="w-3 h-3" />Approved</span>}
                </div>
                <span className={`badge ${diffColors[exp.difficulty]}`}>{exp.difficulty}</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">{exp.name}</h3>
              <p className="text-xs text-gray-500 line-clamp-2 flex-1">{exp.objective}</p>
              <div className="flex flex-wrap gap-1.5 mt-3">
                {exp.category && <span className="badge badge-purple text-[10px]">{exp.category}</span>}
                <span className="badge badge-gray text-[10px]">{exp.duration}h</span>
                <span className="badge badge-gray text-[10px]">{exp.lab?.name}</span>
              </div>
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                <Link to={`/experiments/${exp._id}`} className="btn-outline py-1 px-2 text-xs flex items-center gap-1"><EyeIcon className="w-3.5 h-3.5" />View</Link>
                {(isAdmin || isInstructor) && <>
                  <button onClick={() => openEdit(exp)} className="btn-ghost p-1.5"><PencilIcon className="w-3.5 h-3.5" /></button>
                  {!exp.isApproved && <button onClick={() => handleApprove(exp._id)} className="btn-success py-1 px-2 text-xs">Approve</button>}
                  {isAdmin && <button onClick={() => handleDelete(exp._id)} className="btn-ghost p-1.5 text-red-500 hover:bg-red-50 ml-auto"><TrashIcon className="w-3.5 h-3.5" /></button>}
                </>}
              </div>
            </div>
          ))}
          {experiments.length === 0 && <div className="col-span-3 text-center py-12 text-gray-400"><BeakerIcon className="w-12 h-12 mx-auto mb-2 opacity-30" /><p>No experiments found</p></div>}
        </div>
      )}

      <Modal open={modal.open} onClose={() => setModal({open:false,data:null})} title={modal.data ? 'Edit Experiment' : 'Add Experiment'} size="xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Experiment Name</label><input type="text" className="input" required value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} /></div>
            <div><label className="label">Exp No.</label><input type="text" className="input" placeholder="e.g. ICL-01" value={form.experimentNo} onChange={e=>setForm(p=>({...p,experimentNo:e.target.value}))} /></div>
          </div>
          <div><label className="label">Objective</label><textarea className="input" rows={2} required value={form.objective} onChange={e=>setForm(p=>({...p,objective:e.target.value}))} /></div>
          <div className="grid grid-cols-3 gap-4">
            <div><label className="label">Lab</label>
              <select className="input" required value={form.lab} onChange={e=>setForm(p=>({...p,lab:e.target.value}))}>
                <option value="">Select lab</option>{labs.map(l=><option key={l._id} value={l._id}>{l.name}</option>)}
              </select>
            </div>
            <div><label className="label">Category</label>
              <select className="input" value={form.category} onChange={e=>setForm(p=>({...p,category:e.target.value}))}>
                <option value="">Select</option>{CATS.map(c=><option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div><label className="label">Difficulty</label>
              <select className="input" value={form.difficulty} onChange={e=>setForm(p=>({...p,difficulty:e.target.value}))}>
                {DIFF.map(d=><option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>
          <div><label className="label">Theory</label><textarea className="input" rows={3} value={form.theory} onChange={e=>setForm(p=>({...p,theory:e.target.value}))} /></div>
          <div><label className="label">Procedure</label><textarea className="input" rows={5} required value={form.procedure} onChange={e=>setForm(p=>({...p,procedure:e.target.value}))} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Observations</label><textarea className="input" rows={3} value={form.observations} onChange={e=>setForm(p=>({...p,observations:e.target.value}))} /></div>
            <div><label className="label">Result</label><textarea className="input" rows={3} value={form.result} onChange={e=>setForm(p=>({...p,result:e.target.value}))} /></div>
          </div>
          <div><label className="label">Precautions</label><textarea className="input" rows={2} value={form.precautions} onChange={e=>setForm(p=>({...p,precautions:e.target.value}))} /></div>
          <div><label className="label">Tags (comma separated)</label><input type="text" className="input" placeholder="titration, inorganic, purity" value={form.tags} onChange={e=>setForm(p=>({...p,tags:e.target.value}))} /></div>
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={() => setModal({open:false,data:null})} className="btn-outline">Cancel</button>
            <button type="submit" className="btn-primary">{modal.data ? 'Update' : 'Create'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ExperimentsPage;
