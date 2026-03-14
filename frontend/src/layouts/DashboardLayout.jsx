import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { notificationService } from '../services/api';
import clsx from 'clsx';
import {
  HomeIcon, BeakerIcon, CubeIcon, AcademicCapIcon,
  UserGroupIcon, ClipboardDocumentListIcon, ChartBarIcon, BellIcon,
  Bars3Icon, XMarkIcon, CalendarDaysIcon, BookOpenIcon, UserCircleIcon,
  ArrowRightOnRectangleIcon, BuildingLibraryIcon, DocumentTextIcon,
} from '@heroicons/react/24/outline';

const NavItem = ({ to, icon: Icon, label, badge, onClick }) => (
  <NavLink
    to={to}
    onClick={onClick}
    className={({ isActive }) => clsx('sidebar-link', isActive ? 'sidebar-link-active' : 'sidebar-link-default')}
  >
    <Icon className="w-5 h-5 flex-shrink-0" />
    <span className="flex-1">{label}</span>
    {badge > 0 && <span className="ml-auto bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">{badge}</span>}
  </NavLink>
);

const DashboardLayout = () => {
  const { user, logout, isAdmin, isInstructor, isStudent } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    notificationService.getAll()
      .then(({ data }) => setUnread(data.unread || 0))
      .catch(() => {});
  }, []);

  const handleLogout = () => { logout(); navigate('/login'); };

  const adminLinks = [
    { to: '/dashboard',   icon: HomeIcon,                 label: 'Dashboard' },
    { to: '/semesters',   icon: CalendarDaysIcon,          label: 'Semesters' },
    { to: '/subjects',    icon: BookOpenIcon,              label: 'Subjects' },
    { to: '/labs',        icon: BuildingLibraryIcon,       label: 'Labs' },
    { to: '/experiments', icon: BeakerIcon,                label: 'Experiments' },
    { to: '/solutions',   icon: BeakerIcon,               label: 'Solutions', },
    { to: '/equipment',   icon: CubeIcon,                  label: 'Equipment' },
    { to: '/attendance',  icon: ClipboardDocumentListIcon, label: 'Attendance' },
    { to: '/records',     icon: DocumentTextIcon,          label: 'Lab Records' },
    { to: '/users',       icon: UserGroupIcon,             label: 'Users' },
    { to: '/analytics',   icon: ChartBarIcon,              label: 'Analytics' },
    { to: '/notifications', icon: BellIcon,                label: 'Notifications', badge: unread },
    { to: '/profile',     icon: UserCircleIcon,            label: 'Profile' },
  ];

  const instructorLinks = [
    { to: '/dashboard',   icon: HomeIcon,                 label: 'Dashboard' },
    { to: '/labs',        icon: BuildingLibraryIcon,       label: 'My Labs' },
    { to: '/experiments', icon: BeakerIcon,                label: 'Experiments' },
    { to: '/solutions',   icon: BeakerIcon,               label: 'Solutions' },
    { to: '/equipment',   icon: CubeIcon,                  label: 'Equipment' },
    { to: '/attendance',  icon: ClipboardDocumentListIcon, label: 'Attendance' },
    { to: '/records',     icon: DocumentTextIcon,          label: 'Student Records' },
    { to: '/notifications', icon: BellIcon,                label: 'Notifications', badge: unread },
    { to: '/profile',     icon: UserCircleIcon,            label: 'Profile' },
  ];

  const studentLinks = [
    { to: '/dashboard',   icon: HomeIcon,                 label: 'Dashboard' },
    { to: '/experiments', icon: BeakerIcon,                label: 'My Experiments' },
    { to: '/solutions',   icon: BeakerIcon,               label: 'Solutions' },
    { to: '/attendance',  icon: ClipboardDocumentListIcon, label: 'My Attendance' },
    { to: '/records',     icon: DocumentTextIcon,          label: 'My Records' },
    { to: '/notifications', icon: BellIcon,                label: 'Notifications', badge: unread },
    { to: '/profile',     icon: UserCircleIcon,            label: 'Profile' },
  ];

  const links = isAdmin ? adminLinks : isInstructor ? instructorLinks : studentLinks;
  const roleColor = isAdmin ? 'bg-primary-600' : isInstructor ? 'bg-indigo-600' : 'bg-pharma-600';
  const roleBadge = isAdmin ? 'Admin' : isInstructor ? 'Instructor' : 'Student';

  const Sidebar = ({ onClose }) => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={clsx('flex items-center gap-3 px-4 py-5', roleColor)}>
        <div className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center">
          <BeakerIcon className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="text-white font-bold text-base leading-tight">Jaihind College of Pharmacy</div>
          <div className="text-white/70 text-xs">Lab Management System</div>
        </div>
        {onClose && <button onClick={onClose} className="ml-auto text-white/80 hover:text-white"><XMarkIcon className="w-5 h-5" /></button>}
      </div>

      {/* User info */}
      <div className="px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className={clsx('w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold', roleColor)}>
            {user?.name?.charAt(0)?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-gray-900 truncate">{user?.name}</div>
            <div className="text-xs text-gray-500 truncate">{user?.email}</div>
          </div>
          <span className={clsx('badge text-white text-[10px]', roleColor)}>{roleBadge}</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
        {links.map((link) => (
          <NavItem key={link.to} {...link} onClick={onClose} />
        ))}
      </nav>

      {/* Logout */}
      <div className="px-3 py-3 border-t border-gray-100">
        <button onClick={handleLogout} className="sidebar-link sidebar-link-default w-full text-red-600 hover:bg-red-50 hover:text-red-700">
          <ArrowRightOnRectangleIcon className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col w-64 bg-white border-r border-gray-200 flex-shrink-0">
        <Sidebar />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} />
          <aside className="relative flex flex-col w-64 bg-white h-full shadow-xl z-10">
            <Sidebar onClose={() => setSidebarOpen(false)} />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-200 lg:hidden">
          <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg hover:bg-gray-100">
            <Bars3Icon className="w-5 h-5 text-gray-600" />
          </button>
          <span className="font-bold text-gray-900">Jaihind College of Pharmacy</span>
          <div className="ml-auto flex items-center gap-2">
            <NavLink to="/notifications" className="relative p-2 rounded-lg hover:bg-gray-100">
              <BellIcon className="w-5 h-5 text-gray-600" />
              {unread > 0 && <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />}
            </NavLink>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
          <footer className="mt-6 text-center text-xs text-gray-500">jaihind college of pharmacy@2026</footer>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
