import React, { useEffect, useState } from 'react';
import { solutionService, labService } from '../../services/api';
import toast from 'react-hot-toast';
import { PlusIcon, PencilIcon, TrashIcon, BeakerIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import Modal from '../../components/Modal';
import { useAuth } from '../../context/AuthContext';

const hazardColors = { low: 'badge-green', medium: 'badge-yellow', high: 'badge-red' };

const SolutionsPage = () => {
  const { isAdmin, isInstructor } = useAuth();
  const [solutions, setSolutions] = useState([]);
  const [labs,      setLabs]      = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState('');
  const [labFilter, setLabFilter] = useState('');
  const [modal,     setModal]     = useState({ open: false, data: null });
  const [stockModal,setStockModal]= useState({ open: false, data: null, qty: '', op: 'add' });
  const [form,      setForm]      = useState({ name:'', formula:'', concentration:'', preparation:'', volume:'', storageCondition:'', shelfLife:'', hazardLevel:'low', precautions:'', lab:'', stockAvailable:0, unit:'mL', chemicals:[] });

  const load = async () => {
    try {
      const [s, l] = await Promise.all([solutionService.getAll({ lab: labFilter||undefined, search: search||undefined }), labService.getAll()]);
      setSolutions(s.data.solutions); setLabs(l.data.labs);
    } catch { toast.error('Failed to load solutions'); }
    finally  { setLoading(false); }
  };
  useEffect(() => { load(); }, [labFilter]);

  const openAdd  = () => { setForm({ name:'', formula:'', concentration:'', preparation:'', volume:'', storageCondition:'', shelfLife:'', hazardLevel:'low', precautions:'', lab:'', stockAvailable:0, unit:'mL', chemicals:[] }); setModal({ open: true, data: null }); };
  const openEdit = (s) => { setForm({ ...s, lab: s.lab?._id||s.lab, chemicals: s.chemicals||[] }); setModal({ open: true, data: s }); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (modal.data) { await solutionService.update(modal.data._id, form); toast.success('Solution updated'); }
      else            { await solutionService.create(form);                  toast.success('Solution created'); }
      setModal({ open: false, data: null }); load();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
  };

  const handleStockUpdate = async (e) => {
    e.preventDefault();
    try {
      await solutionService.updateStock(stockModal.data._id, { quantity: stockModal.qty, operation: stockModal.op });
      toast.success('Stock updated'); setStockModal({ open: false, data: null, qty: '', op: 'add' }); load();
    } catch { toast.error('Failed to update stock'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete?')) return;
    try { await solutionService.remove(id); toast.success('Deleted'); load(); }
    catch { toast.error('Failed to delete'); }
  };

  const addChemical = () => setForm(p => ({ ...p, chemicals: [...p.chemicals, { name:'', quantity:'', unit:'g' }] }));
  const updateChem  = (i, f, v) => setForm(p => { const c = [...p.chemicals]; c[i] = {...c[i],[f]:v}; return {...p, chemicals:c}; });
  const removeChem  = (i) => setForm(p => ({ ...p, chemicals: p.chemicals.filter((_,j)=>j!==i) }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div><h1 className="page-title">Chemical Solutions</h1><p className="page-subtitle">Solution formulations, preparation methods and stock tracking</p></div>
        {(isAdmin || isInstructor) && <button onClick={openAdd} className="btn-primary"><PlusIcon className="w-4 h-4" />Add Solution</button>}
      </div>

      <div className="flex gap-3 flex-wrap">
        <form onSubmit={(e)=>{e.preventDefault();setLoading(true);load();}} className="relative flex-1 min-w-[200px] flex gap-2">
          <input type="text" className="input pl-9" placeholder="Search solutions..." value={search} onChange={e=>setSearch(e.target.value)} />
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <button type="submit" className="btn-primary px-3">Search</button>
        </form>
        <select className="input w-auto" value={labFilter} onChange={e=>setLabFilter(e.target.value)}>
          <option value="">All Labs</option>{labs.map(l=><option key={l._id} value={l._id}>{l.name}</option>)}
        </select>
      </div>

      {loading ? <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" /></div> : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {solutions.map(s => (
            <div key={s._id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center"><BeakerIcon className="w-5 h-5 text-blue-600" /></div>
                <div className="flex-1">
                  <div className="font-semibold text-gray-900">{s.name}</div>
                  <div className="text-xs text-gray-500">{s.formula} {s.concentration && `• ${s.concentration}`}</div>
                </div>
                <span className={`badge ${hazardColors[s.hazardLevel]}`}>{s.hazardLevel}</span>
              </div>
              <p className="text-xs text-gray-600 line-clamp-3 mb-3">{s.preparation}</p>
              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <div>
                  <div className="text-xs text-gray-400">Stock</div>
                  <div className="font-semibold text-gray-800">{s.stockAvailable} {s.unit}</div>
                </div>
                {s.chemicals?.length > 0 && <span className="badge badge-gray">{s.chemicals.length} chemicals</span>}
                <div className="flex gap-1">
                  {(isAdmin || isInstructor) && <button onClick={() => setStockModal({ open:true, data:s, qty:'', op:'add' })} className="btn-outline py-1 px-2 text-xs">Update Stock</button>}
                  {(isAdmin || isInstructor) && <button onClick={() => openEdit(s)} className="btn-ghost p-1.5"><PencilIcon className="w-3.5 h-3.5" /></button>}
                  {isAdmin && <button onClick={() => handleDelete(s._id)} className="btn-ghost p-1.5 text-red-500 hover:bg-red-50"><TrashIcon className="w-3.5 h-3.5" /></button>}
                </div>
              </div>
            </div>
          ))}
          {solutions.length === 0 && <div className="col-span-3 text-center py-12 text-gray-400"><BeakerIcon className="w-12 h-12 mx-auto mb-2 opacity-30" /><p>No solutions found</p></div>}
        </div>
      )}

      {/* Main Modal */}
      <Modal open={modal.open} onClose={() => setModal({open:false,data:null})} title={modal.data ? 'Edit Solution' : 'Add Solution'} size="xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Solution Name</label><input type="text" className="input" required value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} /></div>
            <div><label className="label">Formula</label><input type="text" className="input" value={form.formula} onChange={e=>setForm(p=>({...p,formula:e.target.value}))} /></div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div><label className="label">Concentration</label><input type="text" className="input" placeholder="e.g. 0.1N" value={form.concentration} onChange={e=>setForm(p=>({...p,concentration:e.target.value}))} /></div>
            <div><label className="label">Volume</label><input type="text" className="input" placeholder="e.g. 1000 mL" value={form.volume} onChange={e=>setForm(p=>({...p,volume:e.target.value}))} /></div>
            <div><label className="label">Hazard Level</label>
              <select className="input" value={form.hazardLevel} onChange={e=>setForm(p=>({...p,hazardLevel:e.target.value}))}>
                {['low','medium','high'].map(h=><option key={h} value={h}>{h}</option>)}
              </select>
            </div>
          </div>
          <div><label className="label">Preparation Method</label><textarea className="input" rows={4} required value={form.preparation} onChange={e=>setForm(p=>({...p,preparation:e.target.value}))} /></div>

          {/* Chemicals */}
          <div>
            <div className="flex items-center justify-between mb-2"><label className="label mb-0">Chemicals Required</label><button type="button" onClick={addChemical} className="btn-ghost text-xs p-1"><PlusIcon className="w-4 h-4" />Add</button></div>
            <div className="space-y-2">
              {form.chemicals.map((c, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input type="text" className="input flex-1" placeholder="Chemical name" value={c.name} onChange={e=>updateChem(i,'name',e.target.value)} />
                  <input type="text" className="input w-24" placeholder="Qty" value={c.quantity} onChange={e=>updateChem(i,'quantity',e.target.value)} />
                  <input type="text" className="input w-20" placeholder="Unit" value={c.unit} onChange={e=>updateChem(i,'unit',e.target.value)} />
                  <button type="button" onClick={() => removeChem(i)} className="btn-ghost p-1.5 text-red-500"><TrashIcon className="w-4 h-4" /></button>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Storage Condition</label><input type="text" className="input" value={form.storageCondition} onChange={e=>setForm(p=>({...p,storageCondition:e.target.value}))} /></div>
            <div><label className="label">Shelf Life</label><input type="text" className="input" placeholder="e.g. 6 months" value={form.shelfLife} onChange={e=>setForm(p=>({...p,shelfLife:e.target.value}))} /></div>
          </div>
          <div><label className="label">Precautions</label><textarea className="input" rows={2} value={form.precautions} onChange={e=>setForm(p=>({...p,precautions:e.target.value}))} /></div>
          <div className="grid grid-cols-3 gap-4">
            <div><label className="label">Lab</label>
              <select className="input" value={form.lab} onChange={e=>setForm(p=>({...p,lab:e.target.value}))}>
                <option value="">Select lab</option>{labs.map(l=><option key={l._id} value={l._id}>{l.name}</option>)}
              </select>
            </div>
            <div><label className="label">Stock</label><input type="number" className="input" value={form.stockAvailable} onChange={e=>setForm(p=>({...p,stockAvailable:e.target.value}))} /></div>
            <div><label className="label">Unit</label><input type="text" className="input" value={form.unit} onChange={e=>setForm(p=>({...p,unit:e.target.value}))} /></div>
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={() => setModal({open:false,data:null})} className="btn-outline">Cancel</button>
            <button type="submit" className="btn-primary">{modal.data ? 'Update' : 'Create'}</button>
          </div>
        </form>
      </Modal>

      {/* Stock update modal */}
      <Modal open={stockModal.open} onClose={() => setStockModal({open:false,data:null,qty:'',op:'add'})} title={`Update Stock: ${stockModal.data?.name}`} size="sm">
        <form onSubmit={handleStockUpdate} className="space-y-4">
          <div><label className="label">Operation</label>
            <select className="input" value={stockModal.op} onChange={e=>setStockModal(p=>({...p,op:e.target.value}))}>
              <option value="add">Add to stock</option>
              <option value="use">Use from stock</option>
              <option value="set">Set exact value</option>
            </select>
          </div>
          <div><label className="label">Quantity ({stockModal.data?.unit})</label><input type="number" className="input" min="0" required value={stockModal.qty} onChange={e=>setStockModal(p=>({...p,qty:e.target.value}))} /></div>
          <div className="flex gap-3 justify-end">
            <button type="button" onClick={() => setStockModal({open:false,data:null,qty:'',op:'add'})} className="btn-outline">Cancel</button>
            <button type="submit" className="btn-primary">Update</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default SolutionsPage;
