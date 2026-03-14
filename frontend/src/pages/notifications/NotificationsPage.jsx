import React, { useEffect, useState } from 'react';
import { notificationService } from '../../services/api';
import toast from 'react-hot-toast';
import { BellIcon, PlusIcon, CheckIcon, CheckCircleIcon, TrashIcon } from '@heroicons/react/24/outline';
import Modal from '../../components/Modal';
import { useAuth } from '../../context/AuthContext';
import { format, formatDistanceToNow } from 'date-fns';

const typeColors = { info:'badge-blue', warning:'badge-yellow', success:'badge-green', error:'badge-red', announcement:'badge-purple' };
const typeBg    = { info:'bg-blue-50 border-blue-200', warning:'bg-yellow-50 border-yellow-200', success:'bg-green-50 border-green-200', error:'bg-red-50 border-red-200', announcement:'bg-purple-50 border-purple-200' };

const NotificationsPage = () => {
  const { user, isAdmin, isInstructor } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ title:'', message:'', type:'info', audience:'all' });

  const load = async () => {
    try { const { data } = await notificationService.getAll(); setNotifications(data.notifications); }
    catch { toast.error('Failed to load notifications'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const markRead = async (id) => {
    try { await notificationService.markRead(id); load(); }
    catch { toast.error('Failed'); }
  };

  const markAllRead = async () => {
    try { await notificationService.markAllRead(); toast.success('All marked as read'); load(); }
    catch { toast.error('Failed'); }
  };

  const deleteN = async (id) => {
    if(!window.confirm('Delete this notification?')) return;
    try { await notificationService.remove(id); toast.success('Deleted'); load(); }
    catch { toast.error('Failed to delete'); }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try { await notificationService.create(form); toast.success('Notification sent'); setModal(false); setForm({ title:'', message:'', type:'info', audience:'all' }); load(); }
    catch { toast.error('Failed to send'); }
  };

  const unread = notifications.filter(n => !n.readBy?.includes(user?._id));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="page-title">Notifications</h1>
          <p className="page-subtitle">{unread.length > 0 ? `${unread.length} unread notification${unread.length>1?'s':''}` : 'All caught up!'}</p>
        </div>
        <div className="flex gap-2">
          {unread.length > 0 && (
            <button onClick={markAllRead} className="btn-outline">
              <CheckCircleIcon className="w-4 h-4" />Mark All Read
            </button>
          )}
          {(isAdmin || isInstructor) && (
            <button onClick={() => setModal(true)} className="btn-primary">
              <PlusIcon className="w-4 h-4" />New Notification
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" /></div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-16"><BellIcon className="w-12 h-12 mx-auto text-gray-300 mb-3" /><p className="text-gray-500">No notifications yet</p></div>
      ) : (
        <div className="space-y-3">
          {notifications.map(n => {
            const isRead = n.readBy?.includes(user?._id);
            return (
              <div key={n._id} className={`card border ${typeBg[n.type] || 'bg-gray-50 border-gray-200'} ${!isRead ? 'shadow-md' : 'opacity-75'}`}>
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={`badge ${typeColors[n.type] || 'badge-gray'}`}>{n.type}</span>
                      <span className="badge badge-gray">{n.audience}</span>
                      {!isRead && <span className="w-2 h-2 bg-primary-600 rounded-full" />}
                    </div>
                    <h3 className={`font-semibold text-gray-900 ${!isRead ? 'font-bold' : ''}`}>{n.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">{n.message}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                      <span>By {n.createdBy?.name || 'System'}</span>
                      <span>·</span>
                      <span title={format(new Date(n.createdAt), 'PPpp')}>{formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {!isRead && <button onClick={() => markRead(n._id)} title="Mark as read" className="btn-ghost p-1.5 text-green-600 hover:bg-green-50"><CheckIcon className="w-4 h-4" /></button>}
                    {isAdmin && <button onClick={() => deleteN(n._id)} title="Delete" className="btn-ghost p-1.5 text-red-500 hover:bg-red-50"><TrashIcon className="w-4 h-4" /></button>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title="Send Notification" size="md">
        <form onSubmit={handleCreate} className="space-y-4">
          <div><label className="label">Title</label><input className="input" required value={form.title} onChange={e=>setForm(p=>({...p,title:e.target.value}))} /></div>
          <div><label className="label">Message</label><textarea className="input" rows={4} required value={form.message} onChange={e=>setForm(p=>({...p,message:e.target.value}))} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Type</label>
              <select className="input" value={form.type} onChange={e=>setForm(p=>({...p,type:e.target.value}))}>
                {['info','warning','success','error','announcement'].map(t=><option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>)}
              </select>
            </div>
            <div><label className="label">Audience</label>
              <select className="input" value={form.audience} onChange={e=>setForm(p=>({...p,audience:e.target.value}))}>
                {['all','admin','instructor','student','specific'].map(a=><option key={a} value={a}>{a.charAt(0).toUpperCase()+a.slice(1)}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={() => setModal(false)} className="btn-outline">Cancel</button>
            <button type="submit" className="btn-primary">Send</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default NotificationsPage;
