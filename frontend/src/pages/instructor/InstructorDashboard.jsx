import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { labService, experimentService, recordService, notificationService } from '../../services/api';
import toast from 'react-hot-toast';
import {
  BuildingLibraryIcon,
  BeakerIcon,
  ClipboardDocumentListIcon,
  BellIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';

const StatCard = ({ icon: Icon, label, value, color }) => (
  <div className="card flex items-center gap-4">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
      <Icon className="w-6 h-6 text-white" />
    </div>
    <div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm font-medium text-gray-600">{label}</p>
    </div>
  </div>
);

const InstructorDashboard = () => {
  const [labs, setLabs] = useState([]);
  const [experiments, setExperiments] = useState([]);
  const [records, setRecords] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [labsRes, expRes, recRes, notifRes] = await Promise.allSettled([
          labService.getAll(),
          experimentService.getAll(),
          recordService.getAll(),
          notificationService.getAll(),
        ]);

        if (labsRes.status === 'fulfilled') setLabs(labsRes.value.data.labs || []);
        if (expRes.status === 'fulfilled') setExperiments(expRes.value.data.experiments || []);
        if (recRes.status === 'fulfilled') setRecords(recRes.value.data.records || []);
        if (notifRes.status === 'fulfilled') setNotifications(notifRes.value.data.notifications || []);
      } catch {
        toast.error('Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
      </div>
    );
  }

  const pendingRecords = records.filter((record) => record.status === 'submitted').length;
  const unread = notifications.filter((item) => !item.read).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Instructor Dashboard</h1>
        <p className="page-subtitle">Overview of your labs and student activity</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={BuildingLibraryIcon} label="My Labs" value={labs.length} color="bg-indigo-500" />
        <StatCard icon={BeakerIcon} label="Experiments" value={experiments.length} color="bg-pharma-500" />
        <StatCard icon={ClipboardDocumentListIcon} label="Pending Records" value={pendingRecords} color="bg-orange-500" />
        <StatCard icon={BellIcon} label="Unread Alerts" value={unread} color="bg-blue-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-800">Assigned Labs</h2>
            <Link to="/labs" className="text-xs text-primary-600 hover:underline">View all →</Link>
          </div>
          <div className="space-y-2">
            {labs.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No labs assigned</p>
            ) : (
              labs.slice(0, 6).map((lab) => (
                <div key={lab._id} className="flex items-center gap-2 p-2.5 rounded-lg bg-gray-50">
                  <BuildingLibraryIcon className="w-4 h-4 text-indigo-500" />
                  <p className="text-sm text-gray-700 truncate">{lab.name}</p>
                  <span className="text-xs text-gray-400 ml-auto">Sem {lab.semester?.number || '-'}</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-800">Recent Records</h2>
            <Link to="/records" className="text-xs text-primary-600 hover:underline">View all →</Link>
          </div>
          <div className="space-y-2">
            {records.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No records found</p>
            ) : (
              records.slice(0, 6).map((record) => (
                <div key={record._id} className="p-2.5 rounded-lg bg-gray-50">
                  <p className="text-sm font-medium text-gray-800 truncate">{record.student?.name || 'Student'}</p>
                  <p className="text-xs text-gray-500 truncate">{record.experiment?.name || 'Experiment'}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <UserGroupIcon className="w-5 h-5 text-primary-500" />
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Link to="/labs" className="flex items-center justify-center p-3 rounded-lg bg-indigo-50 text-indigo-700 text-sm font-medium hover:bg-indigo-100">Manage Labs</Link>
          <Link to="/experiments" className="flex items-center justify-center p-3 rounded-lg bg-pharma-50 text-pharma-700 text-sm font-medium hover:bg-pharma-100">Experiments</Link>
          <Link to="/attendance" className="flex items-center justify-center p-3 rounded-lg bg-blue-50 text-blue-700 text-sm font-medium hover:bg-blue-100">Attendance</Link>
          <Link to="/records" className="flex items-center justify-center p-3 rounded-lg bg-orange-50 text-orange-700 text-sm font-medium hover:bg-orange-100">Student Records</Link>
        </div>
      </div>
    </div>
  );
};

export default InstructorDashboard;
