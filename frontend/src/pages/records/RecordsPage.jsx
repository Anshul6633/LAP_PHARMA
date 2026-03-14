import React, { useEffect, useState } from 'react';
import { recordService, experimentService, labService, reportService } from '../../services/api';
import toast from 'react-hot-toast';
import { DocumentTextIcon, PlusIcon, PencilIcon, EyeIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import Modal from '../../components/Modal';
import { useAuth } from '../../context/AuthContext';
import { format } from 'date-fns';

const statusColors = { draft:'badge-gray', submitted:'badge-blue', evaluated:'badge-green', approved:'badge-purple' };

const RecordsPage = () => {
  const { user, isAdmin, isInstructor, isStudent } = useAuth();
  const [records,     setRecords]    = useState([]);
  const [experiments, setExperiments]= useState([]);
  const [labs,        setLabs]       = useState([]);
  const [loading,     setLoading]    = useState(true);
  const [modal,       setModal]      = useState({ open: false, data: null, mode:'view' });
  const [form,        setForm]       = useState({ experiment:'', lab:'', aim:'', procedure:'', observations:'', result:'', conclusion:'' });
  const [evalForm,    setEvalForm]   = useState({ marks:{ practical:0, viva:0, record:0 }, feedback:'', status:'evaluated' });

  const load = async () => {
    try {
      const [r, e, l] = await Promise.all([recordService.getAll(), experimentService.getAll(), labService.getAll()]);
      setRecords(r.data.records); setExperiments(e.data.experiments); setLabs(l.data.labs);
    } catch { toast.error('Failed to load records'); }
    finally  { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const openAdd  = () => { setForm({ experiment:'', lab:'', aim:'', procedure:'', observations:'', result:'', conclusion:'' }); setModal({ open: true, data: null, mode:'add' }); };
  const openView = (r) => { setModal({ open: true, data: r, mode:'view' }); };
  const openEval = (r) => { setEvalForm({ marks: r.marks || { practical:0, viva:0, record:0 }, feedback: r.feedback||'', status:'evaluated' }); setModal({ open: true, data: r, mode:'evaluate' }); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await recordService.create({ ...form, status: 'submitted' });
      toast.success('Record submitted'); setModal({ open: false, data: null, mode:'view' }); load();
    } catch { toast.error('Failed to submit'); }
  };

  const handleEvaluate = async (e) => {
    e.preventDefault();
    try {
      await recordService.evaluate(modal.data._id, evalForm);
      toast.success('Evaluation saved'); setModal({ open: false, data: null, mode:'view' }); load();
    } catch { toast.error('Failed to evaluate'); }
  };

  const downloadPdf = async () => {
    if (!user?._id) return toast.error('User session not ready. Please try again.');
    try {
      const { data } = await reportService.studentPdf(user._id);
      const url = window.URL.createObjectURL(new Blob([data]));
      const a = document.createElement('a'); a.href = url; a.download = 'lab_report.pdf'; a.click();
      window.URL.revokeObjectURL(url);
    } catch { toast.error('Failed to generate PDF'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div><h1 className="page-title">Lab Records</h1><p className="page-subtitle">{isStudent ? 'Your practical submissions and evaluations' : 'Student practical records and evaluation'}</p></div>
        <div className="flex gap-2">
          {isStudent && <button onClick={downloadPdf} className="btn-outline"><ArrowDownTrayIcon className="w-4 h-4" />Download Report (PDF)</button>}
          {isStudent && <button onClick={openAdd} className="btn-primary"><PlusIcon className="w-4 h-4" />Submit Record</button>}
        </div>
      </div>

      {loading ? <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" /></div> : (
        <div className="table-wrapper">
          <table className="table">
            <thead><tr><th>Experiment</th><th>Lab</th><th>Student</th><th>Submitted</th><th>Marks</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {records.map(r => (
                <tr key={r._id}>
                  <td className="font-medium text-gray-900">{r.experiment?.name || '—'}</td>
                  <td className="text-gray-500 text-xs">{r.lab?.name}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-xs font-bold">{r.student?.name?.charAt(0)}</div>
                      <div><div className="text-sm font-medium">{r.student?.name}</div><div className="text-xs text-gray-400">{r.student?.rollNumber}</div></div>
                    </div>
                  </td>
                  <td className="text-gray-500 text-xs">{format(new Date(r.submittedAt), 'dd MMM yyyy')}</td>
                  <td>
                    {r.marks?.total > 0 ? <span className="font-semibold text-gray-800">{r.marks.total}<span className="text-gray-400 font-normal">/20</span></span> : <span className="text-gray-400">—</span>}
                  </td>
                  <td><span className={`badge ${statusColors[r.status]}`}>{r.status}</span></td>
                  <td>
                    <div className="flex gap-1">
                      <button onClick={() => openView(r)} className="btn-ghost p-1.5"><EyeIcon className="w-4 h-4 text-gray-500" /></button>
                      {(isAdmin || isInstructor) && r.status === 'submitted' && <button onClick={() => openEval(r)} className="btn-success py-1 px-2 text-xs">Evaluate</button>}
                    </div>
                  </td>
                </tr>
              ))}
              {records.length === 0 && <tr><td colSpan={7} className="text-center py-8 text-gray-400"><DocumentTextIcon className="w-8 h-8 mx-auto mb-2 opacity-30" />No records found</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {/* View Modal */}
      {modal.mode === 'view' && modal.data && (
        <Modal open={modal.open} onClose={() => setModal({open:false,data:null,mode:'view'})} title={`Record: ${modal.data.experiment?.name}`} size="lg">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-gray-500">Student:</span> <span className="font-medium">{modal.data.student?.name}</span></div>
              <div><span className="text-gray-500">Roll No:</span> <span className="font-medium">{modal.data.student?.rollNumber}</span></div>
              <div><span className="text-gray-500">Status:</span> <span className={`badge ${statusColors[modal.data.status]}`}>{modal.data.status}</span></div>
              {modal.data.marks?.total > 0 && <div><span className="text-gray-500">Marks:</span> <span className="font-bold text-lg">{modal.data.marks.total}/20</span></div>}
            </div>
            {modal.data.feedback && <div className="p-3 bg-blue-50 rounded-lg"><div className="text-xs font-semibold text-blue-600 mb-1">Instructor Feedback</div><p className="text-sm text-gray-700">{modal.data.feedback}</p></div>}
            {[['Aim', modal.data.aim], ['Procedure', modal.data.procedure], ['Observations', modal.data.observations], ['Result', modal.data.result], ['Conclusion', modal.data.conclusion]].filter(([,v])=>v).map(([l,v]) => (
              <div key={l}><div className="text-xs font-semibold text-gray-500 uppercase mb-1">{l}</div><p className="text-sm text-gray-700 whitespace-pre-line">{v}</p></div>
            ))}
          </div>
        </Modal>
      )}

      {/* Add Modal */}
      {modal.mode === 'add' && (
        <Modal open={modal.open} onClose={() => setModal({open:false,data:null,mode:'view'})} title="Submit Lab Record" size="xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><label className="label">Experiment</label>
                <select className="input" required value={form.experiment} onChange={e=>setForm(p=>({...p,experiment:e.target.value}))}>
                  <option value="">Select</option>{experiments.map(e=><option key={e._id} value={e._id}>{e.name}</option>)}
                </select>
              </div>
              <div><label className="label">Lab</label>
                <select className="input" required value={form.lab} onChange={e=>setForm(p=>({...p,lab:e.target.value}))}>
                  <option value="">Select</option>{labs.map(l=><option key={l._id} value={l._id}>{l.name}</option>)}
                </select>
              </div>
            </div>
            {[['aim','Aim/Objective'],['procedure','Procedure Followed'],['observations','Observations'],['result','Result'],['conclusion','Conclusion']].map(([k,l]) => (
              <div key={k}><label className="label">{l}</label><textarea className="input" rows={3} value={form[k]} onChange={e=>setForm(p=>({...p,[k]:e.target.value}))} /></div>
            ))}
            <div className="flex gap-3 justify-end pt-2">
              <button type="button" onClick={() => setModal({open:false,data:null,mode:'view'})} className="btn-outline">Cancel</button>
              <button type="submit" className="btn-primary">Submit Record</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Evaluate Modal */}
      {modal.mode === 'evaluate' && modal.data && (
        <Modal open={modal.open} onClose={() => setModal({open:false,data:null,mode:'view'})} title={`Evaluate: ${modal.data.student?.name}`} size="md">
          <form onSubmit={handleEvaluate} className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              {[['practical','Practical',10],['viva','Viva',5],['record','Record Book',5]].map(([k,l,max]) => (
                <div key={k}><label className="label">{l} (/{max})</label><input type="number" className="input" min={0} max={max} value={evalForm.marks[k]} onChange={e=>setEvalForm(p=>({...p,marks:{...p.marks,[k]:+e.target.value}}))} /></div>
              ))}
            </div>
            <div className="p-3 bg-gray-50 rounded-lg text-center">
              <span className="text-gray-500 text-sm">Total: </span>
              <span className="text-2xl font-bold text-gray-900">{(+evalForm.marks.practical)+(+evalForm.marks.viva)+(+evalForm.marks.record)}</span>
              <span className="text-gray-400">/20</span>
            </div>
            <div><label className="label">Feedback</label><textarea className="input" rows={3} value={evalForm.feedback} onChange={e=>setEvalForm(p=>({...p,feedback:e.target.value}))} /></div>
            <div className="flex gap-3 justify-end pt-2">
              <button type="button" onClick={() => setModal({open:false,data:null,mode:'view'})} className="btn-outline">Cancel</button>
              <button type="submit" className="btn-primary">Save Evaluation</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default RecordsPage;
