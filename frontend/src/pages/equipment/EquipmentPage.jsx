import React, { useEffect, useState } from 'react';
import { equipmentService, labService } from '../../services/api';
import toast from 'react-hot-toast';
import { PlusIcon, PencilIcon, TrashIcon, CubeIcon, MagnifyingGlassIcon, QrCodeIcon } from '@heroicons/react/24/outline';
import Modal from '../../components/Modal';
import { useAuth } from '../../context/AuthContext';

const CATS = ['glassware','instrument','consumable','safety','other'];
const CONDS = ['good','fair','poor','damaged','maintenance'];
const condColors = { good:'badge-green', fair:'badge-yellow', poor:'badge-red', damaged:'badge-red', maintenance:'badge-purple' };

const EquipmentPage = () => {
  const { isAdmin, isInstructor } = useAuth();
  const [equipment, setEquipment] = useState([]);
  const [labs,      setLabs]      = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState('');
  const [labFilter, setLabFilter] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [qrModal,   setQrModal]   = useState({ open: false, data: null });
  const [modal,     setModal]     = useState({ open: false, data: null });
  const [form,      setForm]      = useState({ name:'', category:'glassware', lab:'', description:'', manufacturer:'', model:'', totalQuantity:1, availableQuantity:1, condition:'good', location:'', notes:'' });

  const load = async () => {
    try {
      const [e, l] = await Promise.all([equipmentService.getAll({ lab: labFilter||undefined, category: catFilter||undefined, search: search||undefined }), labService.getAll()]);
      setEquipment(e.data.equipment); setLabs(l.data.labs);
    } catch { toast.error('Failed to load equipment'); }
    finally  { setLoading(false); }
  };
  useEffect(() => { load(); }, [labFilter, catFilter]);

  const openAdd  = () => { setForm({ name:'', category:'glassware', lab:'', description:'', manufacturer:'', model:'', totalQuantity:1, availableQuantity:1, condition:'good', location:'', notes:'' }); setModal({ open: true, data: null }); };
  const openEdit = (e) => { setForm({ ...e, lab: e.lab?._id||e.lab }); setModal({ open: true, data: e }); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (modal.data) { await equipmentService.update(modal.data._id, form); toast.success('Updated'); }
      else            { await equipmentService.create(form);                  toast.success('Created'); }
      setModal({ open: false, data: null }); load();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete?')) return;
    try { await equipmentService.remove(id); toast.success('Deleted'); load(); }
    catch { toast.error('Failed'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div><h1 className="page-title">Equipment Inventory</h1><p className="page-subtitle">Track lab equipment, glassware, and instruments with QR codes</p></div>
        {isAdmin && <button onClick={openAdd} className="btn-primary"><PlusIcon className="w-4 h-4" />Add Equipment</button>}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <form onSubmit={e=>{e.preventDefault();setLoading(true);load();}} className="relative flex-1 min-w-[200px] flex gap-2">
          <input type="text" className="input pl-9" placeholder="Search equipment..." value={search} onChange={e=>setSearch(e.target.value)} />
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <button type="submit" className="btn-primary px-3">Search</button>
        </form>
        <select className="input w-40" value={labFilter} onChange={e=>setLabFilter(e.target.value)}>
          <option value="">All Labs</option>{labs.map(l=><option key={l._id} value={l._id}>{l.name}</option>)}
        </select>
        <select className="input w-40" value={catFilter} onChange={e=>setCatFilter(e.target.value)}>
          <option value="">All Categories</option>{CATS.map(c=><option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {loading ? <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" /></div> : (
        <div className="table-wrapper">
          <table className="table">
            <thead><tr><th>Equipment</th><th>Code</th><th>Category</th><th>Lab</th><th>Available</th><th>Total</th><th>Condition</th><th>Actions</th></tr></thead>
            <tbody>
              {equipment.map(e => (
                <tr key={e._id}>
                  <td>
                    <div className="font-medium text-gray-900">{e.name}</div>
                    {e.manufacturer && <div className="text-xs text-gray-500">{e.manufacturer} {e.model}</div>}
                    {e.notes && <div className="text-xs text-orange-500">{e.notes}</div>}
                  </td>
                  <td><span className="badge badge-gray text-[10px] font-mono">{e.code}</span></td>
                  <td><span className="badge badge-blue">{e.category}</span></td>
                  <td className="text-gray-500 text-xs">{e.lab?.name}</td>
                  <td>
                    <span className={`font-semibold ${e.availableQuantity <= 2 ? 'text-red-600' : 'text-gray-800'}`}>{e.availableQuantity}</span>
                    {e.availableQuantity <= 2 && <span className="ml-1 badge badge-red text-[10px]">Low</span>}
                  </td>
                  <td className="text-gray-500">{e.totalQuantity}</td>
                  <td><span className={`badge ${condColors[e.condition]}`}>{e.condition}</span></td>
                  <td>
                    <div className="flex items-center gap-1">
                      {e.qrCode && <button onClick={() => setQrModal({ open: true, data: e })} className="btn-ghost p-1.5"><QrCodeIcon className="w-4 h-4 text-gray-500" /></button>}
                      {(isAdmin || isInstructor) && <button onClick={() => openEdit(e)} className="btn-ghost p-1.5"><PencilIcon className="w-4 h-4 text-gray-500" /></button>}
                      {isAdmin && <button onClick={() => handleDelete(e._id)} className="btn-ghost p-1.5 text-red-500 hover:bg-red-50"><TrashIcon className="w-4 h-4" /></button>}
                    </div>
                  </td>
                </tr>
              ))}
              {equipment.length === 0 && <tr><td colSpan={8} className="text-center py-8 text-gray-400"><CubeIcon className="w-8 h-8 mx-auto mb-2 opacity-30" />No equipment found</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {/* QR Modal */}
      <Modal open={qrModal.open} onClose={() => setQrModal({open:false,data:null})} title={`QR Code: ${qrModal.data?.name}`} size="sm">
        {qrModal.data?.qrCode && (
          <div className="flex flex-col items-center gap-3 py-2">
            <img src={qrModal.data.qrCode} alt="QR Code" className="w-48 h-48" />
            <div className="text-center">
              <div className="font-mono text-sm font-bold">{qrModal.data.code}</div>
              <div className="text-xs text-gray-500 mt-1">{qrModal.data.name}</div>
            </div>
            <a href={qrModal.data.qrCode} download={`qr-${qrModal.data.code}.png`} className="btn-primary text-sm">Download QR</a>
          </div>
        )}
      </Modal>

      {/* Add/Edit Modal */}
      <Modal open={modal.open} onClose={() => setModal({open:false,data:null})} title={modal.data ? 'Edit Equipment' : 'Add Equipment'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Name</label><input type="text" className="input" required value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} /></div>
            <div><label className="label">Category</label>
              <select className="input" value={form.category} onChange={e=>setForm(p=>({...p,category:e.target.value}))}>
                {CATS.map(c=><option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Manufacturer</label><input type="text" className="input" value={form.manufacturer} onChange={e=>setForm(p=>({...p,manufacturer:e.target.value}))} /></div>
            <div><label className="label">Model</label><input type="text" className="input" value={form.model} onChange={e=>setForm(p=>({...p,model:e.target.value}))} /></div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div><label className="label">Lab</label>
              <select className="input" value={form.lab} onChange={e=>setForm(p=>({...p,lab:e.target.value}))}>
                <option value="">Select</option>{labs.map(l=><option key={l._id} value={l._id}>{l.name}</option>)}
              </select>
            </div>
            <div><label className="label">Total Qty</label><input type="number" className="input" min="0" value={form.totalQuantity} onChange={e=>setForm(p=>({...p,totalQuantity:e.target.value}))} /></div>
            <div><label className="label">Available Qty</label><input type="number" className="input" min="0" value={form.availableQuantity} onChange={e=>setForm(p=>({...p,availableQuantity:e.target.value}))} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Condition</label>
              <select className="input" value={form.condition} onChange={e=>setForm(p=>({...p,condition:e.target.value}))}>
                {CONDS.map(c=><option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div><label className="label">Location</label><input type="text" className="input" value={form.location} onChange={e=>setForm(p=>({...p,location:e.target.value}))} /></div>
          </div>
          <div><label className="label">Description</label><textarea className="input" rows={2} value={form.description} onChange={e=>setForm(p=>({...p,description:e.target.value}))} /></div>
          <div><label className="label">Notes</label><input type="text" className="input" value={form.notes} onChange={e=>setForm(p=>({...p,notes:e.target.value}))} /></div>
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={() => setModal({open:false,data:null})} className="btn-outline">Cancel</button>
            <button type="submit" className="btn-primary">{modal.data ? 'Update' : 'Create'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default EquipmentPage;
