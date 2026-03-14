import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { reportService, notificationService } from '../../services/api';
import {
  BeakerIcon, CubeIcon, UserGroupIcon, BuildingLibraryIcon,
  AcademicCapIcon, BellAlertIcon, ChartBarIcon, ArrowTrendingUpIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const StatCard = ({ label, value, icon: Icon, color, link }) => (
  <Link to={link || '#'} className="stat-card group hover:border-primary-100">
    <div className="flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div>
        <div className="text-2xl font-bold text-gray-900">{value ?? '—'}</div>
        <div className="text-sm text-gray-500">{label}</div>
      </div>
    </div>
  </Link>
);

const AdminDashboard = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    reportService.analytics()
      .then(({ data }) => setAnalytics(data.analytics))
      .catch(() => toast.error('Failed to load analytics'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
    </div>
  );

  const stats = [
    { label: 'Total Students',    value: analytics?.totalStudents,    icon: AcademicCapIcon,    color: 'bg-primary-500',  link: '/users' },
    { label: 'Instructors',       value: analytics?.totalInstructors, icon: UserGroupIcon,      color: 'bg-indigo-500',   link: '/users' },
    { label: 'Active Labs',       value: analytics?.totalLabs,        icon: BuildingLibraryIcon,color: 'bg-pharma-500',   link: '/labs' },
    { label: 'Experiments',       value: analytics?.totalExperiments, icon: BeakerIcon,         color: 'bg-orange-500',   link: '/experiments' },
    { label: 'Equipment Items',   value: analytics?.totalEquipment,   icon: CubeIcon,           color: 'bg-purple-500',   link: '/equipment' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="page-title">Admin Dashboard</h1>
        <p className="page-subtitle">Jaihind College of Pharmacy — Overview</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {stats.map((s) => <StatCard key={s.label} {...s} />)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent records */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title flex items-center gap-2"><ArrowTrendingUpIcon className="w-5 h-5 text-primary-500" />Recent Submissions</h2>
            <Link to="/records" className="text-sm text-primary-600 hover:underline">View all</Link>
          </div>
          {analytics?.recentRecords?.length > 0 ? (
            <div className="space-y-3">
              {analytics.recentRecords.map((r) => (
                <div key={r._id} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                  <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-sm">
                    {r.student?.name?.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">{r.student?.name}</div>
                    <div className="text-xs text-gray-500 truncate">{r.experiment?.name}</div>
                  </div>
                  <span className={`badge ${r.status === 'evaluated' ? 'badge-green' : r.status === 'submitted' ? 'badge-blue' : 'badge-gray'}`}>{r.status}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm text-center py-4">No recent submissions</p>
          )}
        </div>

        {/* Equipment alerts */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title flex items-center gap-2"><ExclamationTriangleIcon className="w-5 h-5 text-orange-500" />Equipment Alerts</h2>
            <Link to="/equipment" className="text-sm text-primary-600 hover:underline">Manage</Link>
          </div>
          {analytics?.equipmentAlerts?.length > 0 ? (
            <div className="space-y-3">
              {analytics.equipmentAlerts.map((eq) => (
                <div key={eq._id} className="flex items-center gap-3 p-3 rounded-lg bg-orange-50 border border-orange-100">
                  <CubeIcon className="w-5 h-5 text-orange-500 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">{eq.name}</div>
                    <div className="text-xs text-gray-500">{eq.lab?.name} • Available: {eq.availableQuantity}</div>
                  </div>
                  <span className="badge badge-yellow">{eq.condition}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-3 p-4 rounded-lg bg-green-50 text-green-700">
              <ChartBarIcon className="w-5 h-5" />
              <span className="text-sm font-medium">All equipment levels are adequate</span>
            </div>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="card">
        <h2 className="card-title mb-4 flex items-center gap-2"><BellAlertIcon className="w-5 h-5 text-primary-500" />Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Add Semester',   link: '/semesters',   color: 'bg-blue-50 text-blue-700 hover:bg-blue-100'   },
            { label: 'Add Lab',        link: '/labs',        color: 'bg-green-50 text-green-700 hover:bg-green-100' },
            { label: 'Add Experiment', link: '/experiments', color: 'bg-orange-50 text-orange-700 hover:bg-orange-100'},
            { label: 'Manage Users',   link: '/users',       color: 'bg-purple-50 text-purple-700 hover:bg-purple-100'},
          ].map((a) => (
            <Link key={a.label} to={a.link} className={`flex items-center justify-center p-4 rounded-xl font-medium text-sm transition-colors ${a.color}`}>
              {a.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
