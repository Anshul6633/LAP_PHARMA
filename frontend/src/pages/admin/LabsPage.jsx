import React, { useEffect, useState } from 'react';
import { labService, semesterService, subjectService, userService } from '../../services/api';
import toast from 'react-hot-toast';
import { PlusIcon, PencilIcon, TrashIcon, BuildingLibraryIcon, MapPinIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import Modal from '../../components/Modal';
import { useAuth } from '../../context/AuthContext';

const LabsPage = () => {
  const { isAdmin } = useAuth();
  const [labs,       setLabs]       = useState([]);
  const [semesters,  setSemesters]  = useState([]);
  const [subjects,   setSubjects]   = useState([]);
  const [instructors,setInstructors]= useState([]);
  const [loading,    setLoading]    = useState(true);
  const [modal,      setModal]      = useState({ open: false, data: null });
  const [form,       setForm]       = useState({ name:'', code:'', subject:'', semester:'', description:'', location:'', capacity:30, instructors:[] });

  const load = async () => {
    try {
      if (isAdmin) {
        const [l, sem, sub, inst] = await Promise.all([
          labService.getAll(), semesterService.getAll(), subjectService.getAll(),
          userService.getAll({ role: 'instructor' }),
        ]);
        setLabs(l.data.labs);
        setSemesters(sem.data.semesters);
        setSubjects(sub.data.subjects);
        setInstructors(inst.data.users);
      } else {
        const { data } = await labService.getAll();
        setLabs(data.labs);
      }
    } catch { toast.error('Failed to load labs'); }
    finally  { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const openAdd  = () => { setForm({ name:'', code:'', subject:'', semester:'', description:'', location:'', capacity:30, instructors:[] }); setModal({ open: true, data: null }); };
  const openEdit = (l) => { setForm({ name: l.name, code: l.code, subject: l.subject?._id||l.subject, semester: l.semester?._id||l.semester, description: l.description||'', location: l.location||'', capacity: l.capacity, instructors: l.instructors?.map(i=>i._id||i)||[] }); setModal({ open: true, data: l }); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (modal.data) { await labService.update(modal.data._id, form); toast.success('Lab updated'); }
      else            { await labService.create(form);                  toast.success('Lab created'); }
      setModal({ open: false, data: null }); load();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this lab?')) return;
    try { await labService.remove(id); toast.success('Deleted'); load(); }
    catch { toast.error('Failed to delete'); }
  };

  const toggleInstructor = (id) => setForm(p => ({ ...p, instructors: p.instructors.includes(id) ? p.instructors.filter(i=>i!==id) : [...p.instructors, id] }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div><h1 className="page-title">Laboratories</h1><p className="page-subtitle">Manage Jaihind College of Pharmacy laboratories and assign instructors</p></div>
        {isAdmin && <button onClick={openAdd} className="btn-primary"><PlusIcon className="w-4 h-4" />Add Lab</button>}
      </div>

      {loading ? <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" /></div> : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {labs.map(l => (
            <div key={l._id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-11 h-11 rounded-xl bg-pharma-100 flex items-center justify-center flex-shrink-0">
                  <BuildingLibraryIcon className="w-6 h-6 text-pharma-700" />
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-gray-900">{l.name}</div>
                  <span className="badge badge-blue text-[11px]">{l.code}</span>
                </div>
                {isAdmin && <div className="flex gap-1">
                  <button onClick={() => openEdit(l)} className="btn-ghost p-1.5"><PencilIcon className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(l._id)} className="btn-ghost p-1.5 text-red-500 hover:bg-red-50"><TrashIcon className="w-4 h-4" /></button>
                </div>}
              </div>
              <div className="text-sm text-gray-500 line-clamp-2 mb-3">{l.description}</div>
              <div className="space-y-1.5 text-xs text-gray-500">
                {l.location && <div className="flex items-center gap-1.5"><MapPinIcon className="w-3.5 h-3.5" />{l.location}</div>}
                <div className="flex items-center gap-1.5"><UserGroupIcon className="w-3.5 h-3.5" />{l.instructors?.map(i => i.name).join(', ') || 'No instructors'}</div>
              </div>
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                <span className="text-xs text-gray-500">Sem {l.semester?.number}</span>
                <span className="text-gray-300">·</span>
                <span className="text-xs text-gray-500">{l.subject?.name}</span>
                <span className="badge badge-green ml-auto">{l.experiments?.length || 0} experiments</span>
              </div>
            </div>
          ))}
          {labs.length === 0 && <div className="col-span-3 text-center py-12 text-gray-400"><BuildingLibraryIcon className="w-12 h-12 mx-auto mb-2 opacity-30" /><p>No labs yet</p></div>}
        </div>
      )}

      <Modal open={modal.open} onClose={() => setModal({open:false,data:null})} title={modal.data ? 'Edit Lab' : 'Add Lab'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Lab Name</label><input type="text" className="input" required value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} /></div>
            <div><label className="label">Lab Code</label><input type="text" className="input" required placeholder="e.g. ICL-101" value={form.code} onChange={e=>setForm(p=>({...p,code:e.target.value}))} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Semester</label>
              <select className="input" required value={form.semester} onChange={e=>setForm(p=>({...p,semester:e.target.value}))}>
                <option value="">Select</option>{semesters.map(s=><option key={s._id} value={s._id}>Semester {s.number}</option>)}
              </select>
            </div>
            <div><label className="label">Subject</label>
              <select className="input" required value={form.subject} onChange={e=>setForm(p=>({...p,subject:e.target.value}))}>
                <option value="">Select</option>{subjects.map(s=><option key={s._id} value={s._id}>{s.name}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Location</label><input type="text" className="input" placeholder="Block A, Room 101" value={form.location} onChange={e=>setForm(p=>({...p,location:e.target.value}))} /></div>
            <div><label className="label">Capacity</label><input type="number" className="input" value={form.capacity} onChange={e=>setForm(p=>({...p,capacity:e.target.value}))} /></div>
          </div>
          <div><label className="label">Description</label><textarea className="input" rows={2} value={form.description} onChange={e=>setForm(p=>({...p,description:e.target.value}))} /></div>
          <div><label className="label">Assign Instructors</label>
            <div className="grid grid-cols-2 gap-2 mt-1 max-h-36 overflow-y-auto border border-gray-200 rounded-lg p-2">
              {instructors.map(i => (
                <label key={i._id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1.5 rounded">
                  <input type="checkbox" checked={form.instructors.includes(i._id)} onChange={() => toggleInstructor(i._id)} />
                  <span className="text-sm text-gray-700">{i.name}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={() => setModal({open:false,data:null})} className="btn-outline">Cancel</button>
            <button type="submit" className="btn-primary">{modal.data ? 'Update' : 'Create'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default LabsPage;
