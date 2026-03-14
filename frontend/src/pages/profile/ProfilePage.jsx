import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { authService, userService } from '../../services/api';
import toast from 'react-hot-toast';
import { UserCircleIcon, LockClosedIcon, PencilIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';

const roleBadge = { admin:'bg-blue-100 text-blue-700', instructor:'bg-indigo-100 text-indigo-700', student:'bg-green-100 text-green-700' };

const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  const [editing,  setEditing]  = useState(false);
  const [form,     setForm]     = useState({ name: user?.name||'', phone: user?.phone||'' });
  const [pwForm,   setPwForm]   = useState({ currentPassword:'', newPassword:'', confirmPassword:'' });
  const [saving,   setSaving]   = useState(false);
  const [savingPw, setSavingPw] = useState(false);

  const handleEditProfile = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      const { data } = await userService.update(user._id, form);
      updateUser(data.user); toast.success('Profile updated'); setEditing(false);
    } catch { toast.error('Failed to update profile'); }
    finally { setSaving(false); }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if(pwForm.newPassword !== pwForm.confirmPassword) { toast.error('Passwords do not match'); return; }
    if(pwForm.newPassword.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setSavingPw(true);
    try {
      await authService.changePassword({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      toast.success('Password changed successfully'); setPwForm({ currentPassword:'', newPassword:'', confirmPassword:'' });
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to change password'); }
    finally { setSavingPw(false); }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div><h1 className="page-title">My Profile</h1><p className="page-subtitle">Manage your account information and security</p></div>

      {/* Profile card */}
      <div className="card">
        <div className="flex items-start gap-5 mb-6">
          <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-2xl font-bold shrink-0">
            {user?.name?.charAt(0)?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-semibold text-gray-900">{user?.name}</h2>
              <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${roleBadge[user?.role]}`}>{user?.role}</span>
            </div>
            <p className="text-gray-500 text-sm">{user?.email}</p>
          </div>
          {!editing && (
            <button onClick={() => setEditing(true)} className="btn-outline shrink-0">
              <PencilIcon className="w-4 h-4" />Edit
            </button>
          )}
        </div>

        {editing ? (
          <form onSubmit={handleEditProfile} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><label className="label">Full Name</label><input className="input" value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} required /></div>
              <div><label className="label">Phone</label><input className="input" type="tel" value={form.phone} onChange={e=>setForm(p=>({...p,phone:e.target.value}))} /></div>
            </div>
            <div className="flex gap-3">
              <button type="submit" className="btn-primary" disabled={saving}><CheckIcon className="w-4 h-4" />{saving ? 'Saving…' : 'Save Changes'}</button>
              <button type="button" onClick={() => { setEditing(false); setForm({ name: user?.name||'', phone: user?.phone||'' }); }} className="btn-outline"><XMarkIcon className="w-4 h-4" />Cancel</button>
            </div>
          </form>
        ) : (
          <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
            {[
              ['Email',    user?.email],
              ['Phone',    user?.phone || '—'],
              ['Role',     user?.role],
              ['Roll No',  user?.rollNumber || '—'],
              ['Semester', user?.semester ? `Semester ${user.semester}` : '—'],
              ['Account',  user?.isActive ? 'Active' : 'Inactive'],
            ].map(([l,v]) => (
              <div key={l}>
                <dt className="text-gray-500 font-medium">{l}</dt>
                <dd className="text-gray-900 mt-0.5">{v}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>

      {/* Change Password */}
      <div className="card">
        <div className="flex items-center gap-2 mb-5">
          <LockClosedIcon className="w-5 h-5 text-gray-500" />
          <h2 className="text-lg font-semibold text-gray-800">Change Password</h2>
        </div>
        <form onSubmit={handleChangePassword} className="space-y-4 max-w-sm">
          {[
            ['currentPassword', 'Current Password'],
            ['newPassword',     'New Password'],
            ['confirmPassword', 'Confirm New Password'],
          ].map(([k, l]) => (
            <div key={k}>
              <label className="label">{l}</label>
              <input className="input" type="password" required value={pwForm[k]} onChange={e=>setPwForm(p=>({...p,[k]:e.target.value}))} />
            </div>
          ))}
          <button type="submit" className="btn-primary" disabled={savingPw}>
            <LockClosedIcon className="w-4 h-4" />{savingPw ? 'Updating…' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProfilePage;
