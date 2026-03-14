import React, { useEffect, useState } from 'react';
import { userService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { PlusIcon, PencilIcon, TrashIcon, UserGroupIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import Modal from '../../components/Modal';

const ROLES = ['student','instructor','admin'];

const UsersPage = () => {
  const { user: currentUser } = useAuth();
  const [users,   setUsers]   = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');
  const [roleFilter,setRoleFilter] = useState('');
  const [modal,   setModal]   = useState({ open: false, data: null });
  const [form,    setForm]    = useState({
    name:'', email:'', password:'', role:'student', rollNumber:'', semester:'', division:'', assignedInstructor:'', phone:'', isActive:true,
  });

  const load = () => userService.getAll({ role: roleFilter || undefined, search: search || undefined })
    .then(({ data }) => setUsers(data.users)).catch(() => toast.error('Failed to load users')).finally(() => setLoading(false));
  useEffect(() => { load(); }, [roleFilter, search]);

  const loadInstructors = async () => {
    try {
      const { data } = await userService.getAll({ role: 'instructor' });
      setInstructors(data.users || []);
    } catch {
      toast.error('Failed to load instructors');
    }
  };
  useEffect(() => { loadInstructors(); }, []);

  const openAdd  = () => {
    setForm({ name:'', email:'', password:'', role:'student', rollNumber:'', semester:'', division:'', assignedInstructor:'', phone:'', isActive:true });
    setModal({ open: true, data: null });
  };
  const openEdit = (u) => {
    setForm({
      name: u.name,
      email: u.email,
      password: '',
      role: u.role,
      rollNumber: u.rollNumber || '',
      semester: u.semester || '',
      division: u.division || '',
      assignedInstructor: u.assignedInstructor?._id || '',
      phone: u.phone || '',
      isActive: u.isActive,
    });
    setModal({ open: true, data: u });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form };
      if (!payload.password) delete payload.password;
      if (payload.role !== 'student') {
        delete payload.rollNumber;
        delete payload.semester;
        delete payload.assignedInstructor;
      }
      if (!payload.division) delete payload.division;
      if (!payload.assignedInstructor) delete payload.assignedInstructor;
      if (modal.data) { await userService.update(modal.data._id, payload); toast.success('User updated'); }
      else            { await userService.register(payload);                toast.success('User created'); }
      setModal({ open: false, data: null }); load();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
  };

  const handleRemove = async (userId, name) => {
    const confirmed = window.confirm(`Remove user ${name}? This action cannot be undone.`);
    if (!confirmed) return;

    try {
      await userService.remove(userId);
      toast.success('User removed');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove user');
    }
  };

  const roleColors = { admin: 'badge-red', instructor: 'badge-blue', student: 'badge-green' };
  const filteredInstructors = instructors.filter((ins) => !form.division || !ins.division || ins.division === form.division);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div><h1 className="page-title">Users</h1><p className="page-subtitle">Manage admins, instructors and students</p></div>
        <button onClick={openAdd} className="btn-primary"><PlusIcon className="w-4 h-4" />Add User</button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" className="input pl-9" placeholder="Search by name..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input w-auto" value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
          <option value="">All Roles</option>
          {ROLES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase()+r.slice(1)}</option>)}
        </select>
      </div>

      {loading ? <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" /></div> : (
        <div className="table-wrapper">
          <table className="table">
            <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Roll / Semester</th><th>Division / Instructor</th><th>Phone</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {users.map(u => (
                <tr key={u._id}>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-sm">{u.name?.charAt(0)}</div>
                      <span className="font-medium text-gray-900">{u.name}</span>
                    </div>
                  </td>
                  <td className="text-gray-600">{u.email}</td>
                  <td><span className={`badge ${roleColors[u.role]}`}>{u.role}</span></td>
                  <td className="text-gray-500">{u.rollNumber || (u.semester ? `Sem ${u.semester}` : '—')}</td>
                  <td className="text-gray-500">{u.division ? `${u.division}${u.assignedInstructor?.name ? ` / ${u.assignedInstructor.name}` : ''}` : (u.assignedInstructor?.name || '—')}</td>
                  <td className="text-gray-500">{u.phone || '—'}</td>
                  <td><span className={`badge ${u.isActive ? 'badge-green' : 'badge-gray'}`}>{u.isActive ? 'Active' : 'Inactive'}</span></td>
                  <td>
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEdit(u)} className="btn-ghost p-1.5" title="Edit user">
                        <PencilIcon className="w-4 h-4 text-gray-500" />
                      </button>
                      <button
                        onClick={() => handleRemove(u._id, u.name)}
                        className="btn-ghost p-1.5"
                        title="Remove user"
                        disabled={currentUser?._id === u._id}
                      >
                        <TrashIcon className={`w-4 h-4 ${currentUser?._id === u._id ? 'text-gray-300' : 'text-red-500'}`} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && <tr><td colSpan={8} className="text-center py-8 text-gray-400"><UserGroupIcon className="w-8 h-8 mx-auto mb-2 opacity-30" />No users found</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={modal.open} onClose={() => setModal({open:false,data:null})} title={modal.data ? 'Edit User' : 'Add User'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Full Name</label><input type="text" className="input" required value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} /></div>
            <div><label className="label">Email</label><input type="email" className="input" required value={form.email} onChange={e=>setForm(p=>({...p,email:e.target.value}))} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">{modal.data ? 'New Password (optional)' : 'Password'}</label><input type="password" className="input" required={!modal.data} value={form.password} onChange={e=>setForm(p=>({...p,password:e.target.value}))} /></div>
            <div><label className="label">Role</label>
              <select className="input" value={form.role} onChange={e=>setForm(p=>({...p,role:e.target.value}))}>
                {ROLES.map(r=><option key={r} value={r}>{r.charAt(0).toUpperCase()+r.slice(1)}</option>)}
              </select>
            </div>
          </div>
          {(form.role === 'student' || form.role === 'instructor') && (
            <div><label className="label">Division</label><input type="text" className="input" placeholder="e.g. A" value={form.division} onChange={e=>setForm(p=>({...p,division:e.target.value.toUpperCase()}))} /></div>
          )}
          {form.role === 'student' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="label">Roll Number</label><input type="text" className="input" value={form.rollNumber} onChange={e=>setForm(p=>({...p,rollNumber:e.target.value}))} /></div>
                <div><label className="label">Semester</label><input type="number" className="input" min={1} max={8} value={form.semester} onChange={e=>setForm(p=>({...p,semester:e.target.value}))} /></div>
              </div>
              <div>
                <label className="label">Assigned Instructor</label>
                <select className="input" value={form.assignedInstructor} onChange={e=>setForm(p=>({...p,assignedInstructor:e.target.value}))}>
                  <option value="">Select instructor</option>
                  {filteredInstructors.map((ins) => (
                    <option key={ins._id} value={ins._id}>{ins.name}{ins.division ? ` (Division ${ins.division})` : ''}</option>
                  ))}
                </select>
              </div>
            </>
          )}
          <div><label className="label">Phone</label><input type="text" className="input" value={form.phone} onChange={e=>setForm(p=>({...p,phone:e.target.value}))} /></div>
          <div className="flex items-center gap-2"><input type="checkbox" id="ua" checked={form.isActive} onChange={e=>setForm(p=>({...p,isActive:e.target.checked}))} /><label htmlFor="ua" className="text-sm text-gray-700">Active Account</label></div>
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={() => setModal({open:false,data:null})} className="btn-outline">Cancel</button>
            <button type="submit" className="btn-primary">{modal.data ? 'Update' : 'Create'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default UsersPage;
