'use client';

import React from 'react';
import Link from 'next/link';
import {
  LogOut,
  Menu,
  X,
  Bell,
  ChevronDown,
  User,
  Settings,
  Lock,
  Briefcase,
  Image as ImageIcon,
  Warehouse
} from 'lucide-react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export type DashboardNavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string; size?: string | number }>;
  badge?: React.ReactNode;
  items?: DashboardNavItem[];
};

type DashboardShellProps = {
  title: string;
  description?: string;
  navItems: DashboardNavItem[];
  headerActions?: React.ReactNode;
  userPanel?: React.ReactNode;
  children: React.ReactNode;
};

export default function DashboardShell({
  title,
  description,
  navItems,
  headerActions,
  userPanel,
  children,
}: DashboardShellProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { logout, user } = useAuth();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [userMenuOpen, setUserMenuOpen] = React.useState(false);
  const [showProfileModal, setShowProfileModal] = React.useState(false);
  const [showPasswordModal, setShowPasswordModal] = React.useState(false);
  const [showImageModal, setShowImageModal] = React.useState(false);
  const userMenuRef = React.useRef<HTMLDivElement>(null);
  const isAdminSection = pathname?.startsWith('/admin') ?? false;
  const isAdminUsersPage = pathname?.startsWith('/admin/users') ?? false;
  const isAdminServicesPage = pathname?.startsWith('/admin/services') ?? false;
  const isAdminWideTablePage = isAdminUsersPage || isAdminServicesPage;
  const isWorkerSection = pathname?.startsWith('/worker') ?? false;
  const isEmployerSection = pathname?.startsWith('/employer') ?? false;
  const isProviderSection = pathname?.startsWith('/provider') ?? false;
  const isSimpleLayout = isAdminSection || isWorkerSection || isEmployerSection || isProviderSection;

  // Close user menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };

    if (userMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [userMenuOpen]);

  const [expandedItems, setExpandedItems] = React.useState<Record<string, boolean>>({
    'User Management': true
  });

  const toggleExpand = (label: string) => {
    setExpandedItems(prev => ({
      ...prev,
      [label]: !prev[label]
    }));
  };

  const renderNavLink = (item: DashboardNavItem, isSubItem = false) => {
    const hasSubItems = item.items && item.items.length > 0;
    const isExpanded = expandedItems[item.label];

    // Improved isActive logic to handle query params (e.g., ?role=worker)
    const [itemPath, itemQuery] = item.href.split('?');
    let isActive = pathname === itemPath;

    if (itemQuery) {
      const targetParams = new URLSearchParams(itemQuery);
      isActive = isActive && Array.from(targetParams.entries()).every(
        ([key, value]) => searchParams.get(key) === value
      );
    } else if (hasSubItems) {
      isActive = item.items?.some(sub => {
        const subPath = sub.href.split('?')[0];
        return pathname?.startsWith(subPath);
      }) || false;
    }

    const linkBaseClasses = isSimpleLayout
      ? `group flex items-center gap-3 rounded-xl transition-all duration-300 ${isSubItem ? 'px-4 py-2 text-[13px] mb-1' : 'px-4 py-3.5 text-sm font-bold'}`
      : `group flex items-center gap-4 rounded-2xl px-3 py-3 text-sm font-semibold transition ${isSubItem ? 'ml-4' : ''}`;

    // "Qafiif" (Light) active style for sub-items vs Solid active style for top-level
    const activeClasses = isSimpleLayout
      ? isSubItem
        ? 'bg-white/20 text-white border border-white/30 shadow-sm'
        : 'bg-white text-[#2f67ea] shadow-[0_8px_18px_rgba(0,0,0,0.2)]'
      : 'bg-white/10 text-white shadow-lg backdrop-blur';

    const inactiveClasses = isSimpleLayout
      ? 'bg-transparent text-white/90 hover:bg-white/15 hover:text-white'
      : 'text-white/70 hover:bg-white/10 hover:text-white';

    const linkStateClasses = isActive && !hasSubItems ? activeClasses : inactiveClasses;

    const iconColorClasses = isSimpleLayout
      ? (isActive && !hasSubItems)
        ? isSubItem ? 'text-white' : 'text-[#2f67ea]'
        : 'text-white/70 group-hover:text-white'
      : 'text-white';

    const content = (
      <>
        <item.icon className={`shrink-0 ${isSimpleLayout ? (isSubItem ? 'h-4 w-4' : 'h-5 w-5') : 'h-5 w-5'} ${iconColorClasses}`} />
        <span className="flex-1 whitespace-nowrap">{item.label}</span>
        {hasSubItems && (
          <ChevronDown className={`h-4 w-4 opacity-50 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
        )}
        {!isSimpleLayout && item.badge && !hasSubItems && (
          <span className="rounded-full border border-white/20 bg-white/10 px-2 py-1 text-xs font-semibold text-white/90">
            {item.badge}
          </span>
        )}
      </>
    );

    if (hasSubItems) {
      return (
        <div key={item.label} className="flex flex-col">
          <button
            onClick={() => toggleExpand(item.label)}
            className={`${linkBaseClasses} ${isSimpleLayout ? 'text-white/90' : 'text-white/80'}`}
          >
            {content}
          </button>
          {isExpanded && (
            <div className={`mt-1 flex flex-col relative ${isSimpleLayout ? 'ml-6 border-l border-blue-100 pl-2' : 'ml-6 border-l border-white/10 pl-2'}`}>
              {item.items?.map(subItem => renderNavLink(subItem, true))}
            </div>
          )}
        </div>
      );
    }

    return (
      <Link
        key={item.href}
        href={item.href}
        className={`${linkBaseClasses} ${linkStateClasses}`}
        onClick={() => setMobileOpen(false)}
      >
        {content}
      </Link>
    );
  };

  return (
    <div
      className={`flex h-screen overflow-hidden text-[#1f2a2e] ${isSimpleLayout ? 'bg-[#f8fafc]' : 'bg-[#f3f6f4]'}`}
    >
      <aside
        className={`relative hidden shrink-0 lg:flex h-screen sticky top-0 overflow-hidden ${isSimpleLayout
          ? 'w-72 bg-[#2f67ea] border-r border-[#275ad1]'
          : 'w-80 rounded-r-[48px] bg-[#1f3b2d] shadow-[40px_0_90px_rgba(15,36,28,0.35)]'
          } z-50 transition-all duration-300`}
      >
        {!isSimpleLayout && (
          <>
            <div className="absolute right-[-80px] top-[-120px] h-72 w-72 rounded-full bg-[#f5b23d]/20 blur-2xl" />
            <div className="absolute left-[-90px] bottom-[-130px] h-72 w-72 rounded-full bg-[#1ec98f]/20 blur-3xl" />
          </>
        )}

        <div className={`relative flex h-full w-full flex-col ${isSimpleLayout ? 'px-6 py-10' : 'px-8 py-10'}`}>
          {isSimpleLayout ? (
            <div className="flex flex-col items-start mb-8 w-full">
              <Link href="/" className="flex items-center justify-start py-2 gap-3 w-full">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 shadow-xl shadow-blue-600/20 shrink-0">
                  {user?.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.name || 'User'}
                      className="h-full w-full rounded-2xl object-cover"
                    />
                  ) : (
                    <Briefcase className="h-6 w-6 text-white" />
                  )}
                </div>
                <div className="text-left min-w-0">
                  <p className="text-base font-black text-white leading-tight truncate">
                    {user?.name || 'User'}
                  </p>
                  <p className="text-xs font-semibold text-white/80">
                    {user?.role === 'worker' ? 'Job Seeker' : 'Profile'}
                  </p>
                </div>
              </Link>
              <div className="mt-3 h-px w-full bg-white/20" />
            </div>
          ) : (
            <Link href="/" className="flex items-center gap-4 mb-10">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 font-semibold text-white">
                SJ
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.32em] text-white/60">
                  ZeilaLink
                </p>
                <p className="text-lg font-semibold text-white font-heading">Admin Portal</p>
              </div>
            </Link>
          )}

          <div className="flex-1 overflow-y-auto no-scrollbar py-4">
            <div className="space-y-1">
              {navItems.map(item => renderNavLink(item, false))}
            </div>
          </div>

          <div className="mt-auto pt-10">
            {isSimpleLayout ? (
              <div className="w-full">
                <button
                  onClick={logout}
                  className="flex items-center gap-3 px-2 py-2 text-base font-bold text-white/90 hover:text-white transition-colors"
                >
                  <LogOut className="h-5 w-5" />
                  <span>Logout</span>
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile Header */}
        <header className="flex items-center justify-between border-b border-slate-100 bg-white px-4 py-4 lg:hidden shrink-0 z-40">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-900 shadow-sm"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <span className="font-black text-slate-900 tracking-tighter uppercase text-lg">CONS<span className="text-blue-600">OLE</span></span>
          </div>

          <button
            onClick={logout}
            className="h-10 w-10 flex items-center justify-center rounded-xl bg-red-50 text-red-600 shadow-sm"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </header>

        {mobileOpen && (
          <div className="fixed inset-0 top-[73px] bg-white z-[60] lg:hidden p-4 overflow-y-auto">
            <div className="space-y-2">
              {navItems.map(item => renderNavLink(item, false))}
            </div>
            <div className="mt-10 pt-6 border-t border-slate-100">
              <button
                onClick={logout}
                className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl bg-red-50 text-red-600 font-bold"
              >
                <LogOut className="h-5 w-5" /> Logout
              </button>
            </div>
          </div>
        )}

        {/* Top Header Bar Desktop */}
        <header className="hidden lg:flex items-center justify-end border-b border-slate-100 bg-white px-10 py-4 shrink-0 z-40">
          <div className="flex items-center gap-8">
            {isSimpleLayout && (
              <div className="flex items-center gap-2">
                <Link
                  href={user?.role ? `/${user.role}/settings` : '/settings'}
                  className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:text-blue-600 transition-all shadow-sm"
                >
                  <Settings className="h-5 w-5" />
                </Link>
                <button className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:text-blue-600 transition-all shadow-sm">
                  <Bell className="h-5 w-5" />
                  <span className="absolute top-3 right-3 h-2 w-2 rounded-full bg-blue-600" />
                </button>
              </div>
            )}

            <div className="h-10 w-[1px] bg-slate-100" />

            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-4 group"
              >
                <div className="h-12 w-12 rounded-2xl bg-slate-100 p-0.5 border-2 border-white shadow-md ring-1 ring-slate-100 transition-transform group-hover:scale-105">
                  {user?.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.name || 'User'}
                      className="h-full w-full rounded-2xl object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center rounded-2xl bg-blue-600 text-white font-black text-lg uppercase">
                      {user?.name?.charAt(0) || 'A'}
                    </div>
                  )}
                </div>
                <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-300 ${userMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 top-[64px] w-72 rounded-3xl border border-slate-100 bg-white shadow-2xl py-3 z-[100] animate-in fade-in slide-in-from-top-4 duration-300 overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-50 bg-slate-50/50">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Signed in as</p>
                    <p className="font-bold text-slate-900 truncate text-base">{user?.name || 'User'}</p>
                    <p className="text-xs text-blue-600 font-bold mt-0.5">{user?.email || ''}</p>
                  </div>

                  <div className="py-2 px-2">
                    {[
                      { icon: User, label: 'Profile Settings', color: 'text-blue-500', onClick: () => setShowProfileModal(true) },
                      { icon: Lock, label: 'Change Password', color: 'text-blue-500', onClick: () => setShowPasswordModal(true) },
                      { icon: ImageIcon, label: 'Update Avatar', color: 'text-blue-500', onClick: () => setShowImageModal(true) },
                    ].map((item, i) => (
                      <button
                        key={i}
                        onClick={() => { item.onClick(); setUserMenuOpen(false); }}
                        className="flex items-center gap-3 w-full px-4 py-3 text-sm font-bold text-slate-600 hover:bg-blue-50/50 hover:text-blue-600 transition-all rounded-2xl"
                      >
                        <item.icon className={`h-4 w-4 ${item.color}`} />
                        {item.label}
                      </button>
                    ))}
                  </div>

                  <div className="mt-2 pt-2 px-2 border-t border-slate-50">
                    <button
                      onClick={() => { setUserMenuOpen(false); logout(); }}
                      className="flex items-center gap-3 w-full px-4 py-3 text-sm font-black text-red-600 hover:bg-red-50 hover:text-red-700 transition-all rounded-2xl"
                    >
                      <LogOut className="h-4 w-4" />
                      Logout Account
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className={`flex-1 bg-[#f8fafc]/50 no-scrollbar ${isAdminWideTablePage ? 'overflow-hidden' : 'overflow-y-auto'}`}>
          <div className={`${isAdminWideTablePage ? 'h-full w-full px-4 py-6 lg:px-6 lg:py-6' : 'max-w-[1600px] mx-auto px-10 py-12'}`}>
            {children}
          </div>
        </main>
      </div>

      {showProfileModal && <ProfileNameModal onClose={() => setShowProfileModal(false)} />}
      {showPasswordModal && <ChangePasswordModal onClose={() => setShowPasswordModal(false)} />}
      {showImageModal && <ProfileImageModal onClose={() => setShowImageModal(false)} />}
    </div>
  );
}

// Sub-components (Modals)
function ProfileNameModal({ onClose }: { onClose: () => void }) {
  const { user } = useAuth();
  const [name, setName] = React.useState(user?.name || '');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const api = (await import('@/lib/api')).default;
      await api.put('/auth/profile', { name });
      setSuccess(true);
      setTimeout(() => window.location.reload(), 1000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-[2.5rem] max-w-md w-full p-10 shadow-2xl animate-in zoom-in-95 duration-200">
        <h3 className="text-2xl font-black text-slate-900 mb-2">Update Profile</h3>
        <p className="text-slate-400 text-sm mb-8">Change your public display name</p>
        {success ? (
          <div className="text-center py-6">
            <div className="w-20 h-20 bg-emerald-50 rounded-[2rem] flex items-center justify-center mx-auto mb-4 border border-emerald-100">
              <svg className="w-10 h-10 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-emerald-600 font-black text-lg">Update Success!</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="mb-8">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:bg-white transition-all text-slate-900 font-bold"
                placeholder="Full Name"
                required
              />
            </div>
            {error && <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-2xl text-xs font-bold">{error}</div>}
            <div className="flex gap-4">
              <button type="button" onClick={onClose} className="flex-1 py-4 bg-slate-50 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-100 transition-colors">Cancel</button>
              <button type="submit" disabled={loading} className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50">{loading ? 'Saving...' : 'Save'}</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function ChangePasswordModal({ onClose }: { onClose: () => void }) {
  const [currentPassword, setCurrentPassword] = React.useState('');
  const [newPassword, setNewPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) return setError('Passwords do not match');
    setLoading(true);
    try {
      const api = (await import('@/lib/api')).default;
      await api.put('/auth/change-password', { currentPassword, newPassword });
      setSuccess(true);
      setTimeout(onClose, 2000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-[2.5rem] max-w-md w-full p-10 shadow-2xl animate-in zoom-in-95 duration-200">
        <h3 className="text-2xl font-black text-slate-900 mb-8">Security</h3>
        {success ? (
          <div className="text-center py-6 flex flex-col items-center">
            <div className="w-20 h-20 bg-emerald-50 rounded-[2rem] flex items-center justify-center mb-6"><svg className="w-10 h-10 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg></div>
            <p className="text-emerald-600 font-black">Securely Updated!</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:bg-white transition-all text-slate-900 font-bold" placeholder="Current Password" required />
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:bg-white transition-all text-slate-900 font-bold" placeholder="New Password" required />
            <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:bg-white transition-all text-slate-900 font-bold" placeholder="Confirm" required />
            {error && <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-xs font-bold">{error}</div>}
            <div className="flex gap-4 pt-4">
              <button type="button" onClick={onClose} className="flex-1 py-4 bg-slate-50 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest">Cancel</button>
              <button type="submit" disabled={loading} className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20">{loading ? '...' : 'Update'}</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function ProfileImageModal({ onClose }: { onClose: () => void }) {
  const { user } = useAuth();
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [preview, setPreview] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) return setError('Max 5MB allowed');
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('avatar', selectedFile);
      const api = (await import('@/lib/api')).default;
      await api.post('/auth/upload-avatar', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setSuccess(true);
      setTimeout(() => window.location.reload(), 1000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-[2.5rem] max-w-md w-full p-10 shadow-2xl animate-in zoom-in-95 duration-200">
        <h3 className="text-2xl font-black text-slate-900 mb-8">Profile Image</h3>
        <div className="flex flex-col items-center mb-8">
          <div className="w-40 h-40 rounded-[2.5rem] overflow-hidden bg-slate-50 mb-6 border-4 border-slate-100 shadow-inner flex items-center justify-center">
            {preview ? (
              <img src={preview} alt="Preview" className="w-full h-full object-cover" />
            ) : user?.avatarUrl ? (
              <img src={user.avatarUrl} alt="Current" className="w-full h-full object-cover" />
            ) : (
              <div className="text-4xl font-black text-slate-200">{user?.name?.charAt(0) || 'U'}</div>
            )}
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
          <button onClick={() => fileInputRef.current?.click()} className="px-8 py-3 bg-slate-50 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-100 border border-slate-200">Select Image</button>
        </div>
        {error && <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-2xl text-xs font-bold text-center">{error}</div>}
        <div className="flex gap-4">
          <button type="button" onClick={onClose} className="flex-1 py-4 bg-slate-50 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest">Cancel</button>
          <button onClick={handleSubmit} disabled={loading || !selectedFile} className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 shadow-lg shadow-blue-600/20 disabled:opacity-50">Upload</button>
        </div>
      </div>
    </div>
  );
}
