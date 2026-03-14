import React, { useEffect, useState } from 'react';
import { attendanceService, labService, experimentService, userService } from '../../services/api';
import toast from 'react-hot-toast';
import { PlusIcon, ClipboardDocumentListIcon } from '@heroicons/react/24/outline';
import Modal from '../../components/Modal';
import { useAuth } from '../../context/AuthContext';
import { format } from 'date-fns';

const STATUS_OPTS = ['present','absent','late','excused'];
const statusColors = { present:'badge-green', absent:'badge-red', late:'badge-yellow', excused:'badge-gray' };

const AttendancePage = () => {
  const { user, isAdmin, isInstructor, isStudent } = useAuth();
  const [attendance, setAttendance] = useState([]);
  const [labs,       setLabs]       = useState([]);
  const [experiments,setExperiments]= useState([]);
  const [students,   setStudents]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [modal,      setModal]      = useState({ open: false });
  const [form,       setForm]       = useState({ lab:'', experiment:'', date: new Date().toISOString().slice(0,10), records:[] });

  const load = async () => {
    try {
      const params = isStudent && user?._id ? { student: user._id } : {};
      const [att, labList] = await Promise.all([attendanceService.getAll(params), labService.getAll()]);
      setAttendance(att.data.attendance); setLabs(labList.data.labs);
    } catch { toast.error('Failed to load attendance'); }
    finally  { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const openModal = async () => {
    const stuRes = await userService.getAll({ role: 'student' });
    setStudents(stuRes.data.users);
    setForm({ lab:'', experiment:'', date: new Date().toISOString().slice(0,10),
      records: stuRes.data.users.map(s => ({ student: s._id, studentName: s.name, status:'present', remarks:'' })) });
    setModal({ open: true });
  };

  const loadExperiments = async (labId) => {
    if (!labId) return;
    const res = await experimentService.getAll({ lab: labId });
    setExperiments(res.data.experiments);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await attendanceService.create({ ...form, records: form.records.map(r => ({ student: r.student, status: r.status, remarks: r.remarks })) });
      toast.success('Attendance marked'); setModal({ open: false }); load();
    } catch { toast.error('Failed to save attendance'); }
  };

  const updateRec = (i, field, value) => setForm(p => { const r = [...p.records]; r[i] = { ...r[i], [field]: value }; return { ...p, records: r }; });
  const markAll   = (status) => setForm(p => ({ ...p, records: p.records.map(r => ({ ...r, status })) }));

  // Student: attendance summary
  const [summary, setSummary] = useState(null);
  useEffect(() => {
    if (isStudent && user?._id) {
      attendanceService.studentSummary(user._id)
        .then(({ data }) => setSummary(data))
        .catch(() => {});
    }
  }, [isStudent, user?._id]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div><h1 className="page-title">Attendance</h1><p className="page-subtitle">{isStudent ? 'Your lab attendance record' : 'Mark and track student lab attendance'}</p></div>
        {(isAdmin || isInstructor) && <button onClick={openModal} className="btn-primary"><PlusIcon className="w-4 h-4" />Mark Attendance</button>}
      </div>

      {/* Student summary */}
      {isStudent && summary && (
        <div className="grid grid-cols-3 gap-4">
          {[{ label:'Total Classes', value: summary.total, color:'bg-blue-50 text-blue-700' }, { label:'Present', value: summary.present, color:'bg-green-50 text-green-700' }, { label:'Percentage', value: `${summary.percentage}%`, color:'bg-purple-50 text-purple-700' }].map(s => (
            <div key={s.label} className={`card text-center ${s.color}`}>
              <div className="text-3xl font-bold">{s.value}</div>
              <div className="text-sm mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {loading ? <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" /></div> : (
        <div className="table-wrapper">
          <table className="table">
            <thead><tr><th>Date</th><th>Lab</th><th>Experiment</th>{!isStudent && <th>Students</th>}<th>Marked By</th></tr></thead>
            <tbody>
              {attendance.map(a => (
                <tr key={a._id}>
                  <td>{format(new Date(a.date), 'dd MMM yyyy')}</td>
                  <td className="font-medium">{a.lab?.name}</td>
                  <td className="text-gray-500">{a.experiment?.name || '—'}</td>
                  {!isStudent && <td>
                    <div className="flex flex-wrap gap-1">
                      {a.records?.slice(0,3).map(r => <span key={r.student?._id} className={`badge ${statusColors[r.status]}`}>{r.student?.name?.split(' ')[0]} • {r.status}</span>)}
                      {a.records?.length > 3 && <span className="badge badge-gray">+{a.records.length-3}</span>}
                    </div>
                  </td>}
                  <td className="text-gray-500">{a.markedBy?.name}</td>
                </tr>
              ))}
              {attendance.length === 0 && <tr><td colSpan={5} className="text-center py-8 text-gray-400"><ClipboardDocumentListIcon className="w-8 h-8 mx-auto mb-2 opacity-30" />No attendance records</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={modal.open} onClose={() => setModal({open:false})} title="Mark Attendance" size="xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div><label className="label">Lab</label>
              <select className="input" required value={form.lab} onChange={e=>{ setForm(p=>({...p,lab:e.target.value})); loadExperiments(e.target.value); }}>
                <option value="">Select lab</option>{labs.map(l=><option key={l._id} value={l._id}>{l.name}</option>)}
              </select>
            </div>
            <div><label className="label">Experiment (optional)</label>
              <select className="input" value={form.experiment} onChange={e=>setForm(p=>({...p,experiment:e.target.value}))}>
                <option value="">Select</option>{experiments.map(e=><option key={e._id} value={e._id}>{e.name}</option>)}
              </select>
            </div>
            <div><label className="label">Date</label><input type="date" className="input" required value={form.date} onChange={e=>setForm(p=>({...p,date:e.target.value}))} /></div>
          </div>
          <div className="flex gap-2 items-center">
            <span className="text-sm text-gray-500">Mark all as:</span>
            {STATUS_OPTS.map(s=><button key={s} type="button" onClick={()=>markAll(s)} className="btn-outline py-1 px-2 text-xs capitalize">{s}</button>)}
          </div>
          <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
            {form.records.map((r, i) => (
              <div key={i} className="flex items-center gap-3 px-3 py-2">
                <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-xs font-bold">{r.studentName?.charAt(0)}</div>
                <span className="flex-1 text-sm text-gray-800">{r.studentName}</span>
                <select className="input w-28 py-1 text-xs" value={r.status} onChange={e=>updateRec(i,'status',e.target.value)}>
                  {STATUS_OPTS.map(s=><option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            ))}
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={() => setModal({open:false})} className="btn-outline">Cancel</button>
            <button type="submit" className="btn-primary">Save Attendance</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AttendancePage;
