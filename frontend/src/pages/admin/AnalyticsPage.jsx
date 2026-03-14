import React, { useEffect, useState } from 'react';
import { reportService } from '../../services/api';
import toast from 'react-hot-toast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#a855f7'];

const AnalyticsPage = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [downloading, setDownloading] = useState('');

  useEffect(() => {
    reportService.analytics()
      .then(({ data }) => setAnalytics(data.analytics))
      .catch(() => toast.error('Failed to load analytics'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" /></div>;

  const pieData = [
    { name: 'Students',    value: analytics?.totalStudents    || 0 },
    { name: 'Instructors', value: analytics?.totalInstructors || 0 },
    { name: 'Admins',      value: analytics?.totalAdmins      || 0 },
  ];

  const barData = [
    { name: 'Students',     count: analytics?.totalStudents    || 0 },
    { name: 'Instructors',  count: analytics?.totalInstructors || 0 },
    { name: 'Labs',         count: analytics?.totalLabs        || 0 },
    { name: 'Experiments',  count: analytics?.totalExperiments || 0 },
    { name: 'Equipment',    count: analytics?.totalEquipment   || 0 },
  ];

  const StatTile = ({ label, value, color }) => (
    <div className={`card border-l-4 ${color}`}>
      <div className="text-3xl font-bold text-gray-900">{value ?? 0}</div>
      <div className="text-sm text-gray-500 mt-1">{label}</div>
    </div>
  );

  const downloadInventory = async (format) => {
    setDownloading(format);
    try {
      const { data } = await reportService.inventoryExport(format);
      const blob = new Blob([data], { type: format === 'xml' ? 'application/xml' : 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `available_inventory.${format}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success(`Downloaded ${format.toUpperCase()} report`);
    } catch {
      toast.error(`Failed to download ${format.toUpperCase()} report`);
    } finally {
      setDownloading('');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div><h1 className="page-title">Analytics & Reports</h1><p className="page-subtitle">System-wide statistics and performance overview</p></div>
        <div className="flex gap-2">
          <button className="btn-outline" onClick={() => downloadInventory('xml')} disabled={downloading !== ''}>
            {downloading === 'xml' ? 'Downloading XML...' : 'Download Inventory XML'}
          </button>
          <button className="btn-primary" onClick={() => downloadInventory('pdf')} disabled={downloading !== ''}>
            {downloading === 'pdf' ? 'Downloading PDF...' : 'Download Inventory PDF'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatTile label="Students"    value={analytics?.totalStudents}    color="border-blue-500" />
        <StatTile label="Instructors" value={analytics?.totalInstructors} color="border-indigo-500" />
        <StatTile label="Labs"        value={analytics?.totalLabs}        color="border-green-500" />
        <StatTile label="Experiments" value={analytics?.totalExperiments} color="border-orange-500" />
        <StatTile label="Equipment"   value={analytics?.totalEquipment}   color="border-purple-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="card-title mb-4">System Overview (Bar)</h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#3b82f6" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h2 className="card-title mb-4">User Distribution</h2>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                {pieData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Equipment alerts */}
      {analytics?.equipmentAlerts?.length > 0 && (
        <div className="card">
          <h2 className="card-title mb-4 text-orange-600">⚠ Low Stock Equipment</h2>
          <div className="table-wrapper">
            <table className="table">
              <thead><tr><th>Equipment</th><th>Lab</th><th>Available</th><th>Condition</th></tr></thead>
              <tbody>
                {analytics.equipmentAlerts.map(e => (
                  <tr key={e._id}>
                    <td className="font-medium">{e.name}</td>
                    <td className="text-gray-500">{e.lab?.name}</td>
                    <td><span className="badge badge-red">{e.availableQuantity}</span></td>
                    <td><span className="badge badge-yellow">{e.condition}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsPage;
