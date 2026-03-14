import React, { useEffect, useState } from 'react';
import { attendanceService, recordService, experimentService, notificationService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  BeakerIcon, ClipboardDocumentListIcon, CheckCircleIcon,
  ClockIcon, BellIcon, StarIcon, ChartBarIcon,
} from '@heroicons/react/24/outline';
import { formatDistanceToNow } from 'date-fns';

const StatCard = ({ icon: Icon, label, value, sub, color }) => (
  <div className="card flex items-center gap-4">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
      <Icon className="w-6 h-6 text-white" />
    </div>
    <div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm font-medium text-gray-600">{label}</p>
      {sub && <p className="text-xs text-gray-400">{sub}</p>}
    </div>
  </div>
);

const statusColors = { draft:'bg-gray-100 text-gray-600', submitted:'bg-blue-100 text-blue-700', evaluated:'bg-green-100 text-green-700', approved:'bg-purple-100 text-purple-700' };

const StudentDashboard = () => {
  const { user } = useAuth();
  const [attendance,     setAttendance]     = useState(null);
  const [records,        setRecords]        = useState([]);
  const [experiments,    setExperiments]    = useState([]);
  const [notifications,  setNotifications]  = useState([]);
  const [loading,        setLoading]        = useState(true);

  useEffect(() => {
    if (!user?._id) return;
    const fetchAll = async () => {
      try {
        const [attRes, recRes, expRes, notifRes] = await Promise.allSettled([
          attendanceService.studentSummary(user._id),
          recordService.getAll(),
          experimentService.getAll(),
          notificationService.getAll(),
        ]);
        if (attRes.status   === 'fulfilled') setAttendance(attRes.value.data);
        if (recRes.status   === 'fulfilled') setRecords(recRes.value.data.records?.slice(0,5) || []);
        if (expRes.status   === 'fulfilled') setExperiments(expRes.value.data.experiments?.slice(0,6) || []);
        if (notifRes.status === 'fulfilled') setNotifications(notifRes.value.data.notifications?.slice(0,5) || []);
      } catch { toast.error('Failed to load dashboard'); }
      finally { setLoading(false); }
    };
    fetchAll();
  }, [user?._id]);

  const submitted  = records.filter(r=>r.status!=='draft').length;
  const evaluated  = records.filter(r=>r.status==='evaluated'||r.status==='approved').length;
  const avgMarks   = evaluated > 0 ? (records.filter(r=>r.marks?.total).reduce((a,r)=>a+r.marks.total,0)/evaluated).toFixed(1) : '—';
  const unreadNotif= notifications.filter(n=>!n.readBy?.includes(user?._id)).length;

  if (loading) return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" /></div>;

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="card bg-gradient-to-r from-pharma-600 to-pharma-700 text-white">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-pharma-100 text-sm font-medium">Welcome back,</p>
            <h1 className="text-2xl font-bold mt-0.5">{user?.name}</h1>
            <p className="text-pharma-200 text-sm mt-1">Semester {user?.semester} · Roll No: {user?.rollNumber || 'N/A'}</p>
          </div>
          <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center text-3xl font-bold">
            {user?.name?.charAt(0)}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={ChartBarIcon}          label="Attendance"          value={attendance?.percentage ? `${Number(attendance.percentage).toFixed(0)}%` : '—'}   sub={`${attendance?.present||0}/${attendance?.total||0} classes`} color="bg-blue-500" />
        <StatCard icon={ClipboardDocumentListIcon} label="Records Submitted" value={submitted}  sub={`${records.length} total records`}  color="bg-indigo-500" />
        <StatCard icon={CheckCircleIcon}        label="Evaluated"           value={evaluated}   sub="awaiting feedback"                   color="bg-green-500" />
        <StatCard icon={StarIcon}               label="Avg Marks"           value={avgMarks}    sub="out of 20"                           color="bg-pharma-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Records */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-800 flex items-center gap-2"><ClipboardDocumentListIcon className="w-5 h-5 text-gray-400" />My Lab Records</h2>
            <Link to="/records" className="text-xs text-primary-600 hover:underline">View all →</Link>
          </div>
          <div className="space-y-3">
            {records.length === 0 ? (
              <p className="text-center py-6 text-gray-400 text-sm">No records submitted yet. <Link to="/records" className="text-primary-600 hover:underline">Submit your first record</Link></p>
            ) : records.map(r => (
              <div key={r._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-pharma-100 flex items-center justify-center shrink-0"><BeakerIcon className="w-4 h-4 text-pharma-600" /></div>
                  <div className="min-w-0"><p className="text-sm font-medium text-gray-900 truncate">{r.experiment?.name || '—'}</p><p className="text-xs text-gray-400">{r.lab?.name}</p></div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  {r.marks?.total > 0 && <span className="text-sm font-bold text-gray-800">{r.marks.total}<span className="text-gray-400 font-normal">/20</span></span>}
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColors[r.status]}`}>{r.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-5">
          {/* Notifications */}
          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                <BellIcon className="w-5 h-5 text-gray-400" />Notifications
                {unreadNotif > 0 && <span className="w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">{unreadNotif}</span>}
              </h2>
              <Link to="/notifications" className="text-xs text-primary-600 hover:underline">View all →</Link>
            </div>
            <div className="space-y-2">
              {notifications.length === 0 ? <p className="text-sm text-gray-400 text-center py-3">No notifications</p> : notifications.map(n => (
                <div key={n._id} className={`p-2.5 rounded-lg border text-sm ${!n.readBy?.includes(user?._id) ? 'border-primary-200 bg-primary-50' : 'border-gray-100 bg-gray-50'}`}>
                  <p className="font-medium text-gray-800 leading-tight">{n.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Available Experiments */}
          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-gray-800 flex items-center gap-2"><BeakerIcon className="w-5 h-5 text-gray-400" />Experiments</h2>
              <Link to="/experiments" className="text-xs text-primary-600 hover:underline">View all →</Link>
            </div>
            <div className="space-y-2">
              {experiments.length === 0 ? <p className="text-sm text-gray-400 text-center py-3">No experiments yet</p> : experiments.map(e => (
                <Link key={e._id} to={`/experiments/${e._id}`} className="flex items-center gap-2 p-2.5 rounded-lg hover:bg-gray-50 group">
                  <div className="w-6 h-6 rounded-md bg-pharma-100 flex items-center justify-center text-pharma-700 text-xs font-bold shrink-0">{e.experimentNo || '#'}</div>
                  <p className="text-sm text-gray-700 group-hover:text-primary-600 truncate">{e.name}</p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Feedback from recent evaluated records */}
      {records.filter(r => r.feedback).length > 0 && (
        <div className="card">
          <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2"><StarIcon className="w-5 h-5 text-yellow-500" />Recent Feedback</h2>
          <div className="space-y-3">
            {records.filter(r => r.feedback).map(r => (
              <div key={r._id} className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-gray-700">{r.experiment?.name}</p>
                  <div className="flex items-center gap-1">
                    {[...Array(Math.round((r.marks?.total||0)/4))].map((_,i) => <StarIcon key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />)}
                    <span className="text-sm font-bold text-gray-700 ml-1">{r.marks?.total}/20</span>
                  </div>
                </div>
                <p className="text-sm text-gray-600 italic">"{r.feedback}"</p>
                <p className="text-xs text-gray-400 mt-1">By {r.evaluatedBy?.name || 'Instructor'}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
