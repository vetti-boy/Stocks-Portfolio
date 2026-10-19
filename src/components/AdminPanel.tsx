'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  ShieldCheck,
  UserPlus,
  Users,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  X,
  Mail,
  Loader2,
  Eye,
  Briefcase,
  Activity,
  UserX,
  UserCheck,
  Trash2,
} from 'lucide-react';
import { UserRole } from '@/types/stock';

export const AdminPanel: React.FC = () => {
  const { user } = useAuth();

  const [usersList, setUsersList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Pre-authorize User Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('USER');

  // User Portfolio Inspection Modal State
  const [inspectingUser, setInspectingUser] = useState<any | null>(null);
  const [inspectingPortfolio, setInspectingPortfolio] = useState<any | null>(null);
  const [isInspectingLoading, setIsInspectingLoading] = useState(false);

  const isAdmin = user?.role === 'ADMIN' || user?.email === 'mailfortempusage@gmail.com';

  const fetchUsers = async () => {
    if (!isAdmin) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/users?adminRole=${user?.role || 'ADMIN'}`);
      const data = await res.json();
      if (data.users) {
        setUsersList(data.users);
      }
    } catch {
      console.warn('Could not connect to MongoDB server for user directory');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [isAdmin]);

  const handleCreateUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);

    if (!email || !name) return;

    try {
      const res = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminUserId: user?.id,
          adminRole: user?.role || 'ADMIN',
          name,
          email,
          role,
          currency: 'INR',
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setStatusMsg({ type: 'error', text: data.error || 'Failed to authorize user account' });
        return;
      }

      setStatusMsg({
        type: 'success',
        text: `Google account authorized for ${data.user.name} (${data.user.email}).`,
      });

      setName('');
      setEmail('');
      fetchUsers();
    } catch {
      setStatusMsg({
        type: 'error',
        text: 'Network error creating user account.',
      });
    }
  };

  // Admin User Portfolio Inspection Handler
  const handleInspectUserPortfolio = async (targetUser: any) => {
    setInspectingUser(targetUser);
    setInspectingPortfolio(null);
    setIsInspectingLoading(true);

    try {
      const res = await fetch(
        `/api/admin/user-portfolio?targetUserId=${targetUser.id}&adminRole=${user?.role || 'ADMIN'}`
      );
      const data = await res.json();
      if (data.success && data.data) {
        setInspectingPortfolio(data.data);
      } else {
        setInspectingPortfolio({ holdings: [], watchlist: [], tradeHistory: [] });
      }
    } catch {
      setInspectingPortfolio({ holdings: [], watchlist: [], tradeHistory: [] });
    } finally {
      setIsInspectingLoading(false);
    }
  };

  // Toggle User Account Disabled Status
  const handleToggleDisableUser = async (targetUser: any) => {
    if (targetUser.email === 'mailfortempusage@gmail.com') {
      alert('Master Administrator account status cannot be modified.');
      return;
    }

    const newStatus = !targetUser.isDisabled;
    const confirmMsg = newStatus
      ? `Are you sure you want to DISABLE "${targetUser.name}" (${targetUser.email})?\nThe user will be blocked from logging in with Google.`
      : `Re-enable account for "${targetUser.name}" (${targetUser.email})?`;

    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await fetch('/api/admin/toggle-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUserId: targetUser.id,
          isDisabled: newStatus,
          adminRole: user?.role || 'ADMIN',
        }),
      });
      const data = await res.json();
      if (data.success) {
        fetchUsers();
      } else {
        alert(data.error || 'Failed to update user account status.');
      }
    } catch {
      alert('Error updating user account status.');
    }
  };

  // Change User Role (ADMIN <-> USER)
  const handleChangeUserRole = async (targetUser: any, newRole: 'ADMIN' | 'USER') => {
    if (targetUser.email === 'mailfortempusage@gmail.com') {
      alert('System Administrator role cannot be changed.');
      return;
    }

    const confirmMsg = `Change role of "${targetUser.name}" (${targetUser.email}) to ${newRole}?`;
    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await fetch('/api/admin/change-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUserId: targetUser.id,
          newRole,
          adminRole: user?.role || 'ADMIN',
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        alert(data.error || 'Failed to change user role.');
      } else {
        fetchUsers();
      }
    } catch {
      alert('Network error changing user role.');
    }
  };

  // Permanently Delete User Account
  const handleDeleteUser = async (targetUser: any) => {
    if (targetUser.email === 'mailfortempusage@gmail.com') {
      alert('Master Administrator account cannot be deleted.');
      return;
    }

    if (
      !window.confirm(
        `PERMANENT DELETION WARNING:\nAre you sure you want to permanently delete user account "${targetUser.name}" (${targetUser.email})?\n\nThis will destroy all their cloud portfolio holdings in MongoDB permanently.`
      )
    ) {
      return;
    }

    try {
      const res = await fetch(
        `/api/admin/delete-user?targetUserId=${targetUser.id}&adminRole=${user?.role || 'ADMIN'}`,
        { method: 'DELETE' }
      );
      const data = await res.json();
      if (data.success) {
        fetchUsers();
      } else {
        alert(data.error || 'Failed to delete user account.');
      }
    } catch {
      alert('Error deleting user account.');
    }
  };

  if (!isAdmin) {
    return (
      <div className="bg-[#0D1218] p-12 text-center space-y-4 max-w-xl mx-auto border border-rose-500/30 rounded-2xl">
        <ShieldCheck className="h-12 w-12 text-rose-400 mx-auto" />
        <h3 className="text-xl font-bold text-white">Admin Authorization Required</h3>
        <p className="text-xs text-[#8D99A8]">
          User account management can only be performed by an authenticated Administrator.
        </p>
        <p className="text-xs font-mono text-[#38BDF8]">
          Sign in with the Administrator Google Account (mailfortempusage@gmail.com).
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-[#0D1218] rounded-xl p-5 border border-[#202A35] shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-extrabold text-[#F4F7FA] flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-[#38BDF8]" /> Enterprise Admin Console
          </h2>
          <p className="text-xs text-[#8D99A8] mt-1">
            Manage authenticated Google accounts and inspect user stock portfolios stored in MongoDB.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-lg bg-[#080B10] border border-[#202A35] px-3 py-1.5 text-xs font-mono">
            <Users className="h-4 w-4 text-[#38BDF8]" />
            <span className="text-[#8D99A8]">Total Accounts:</span>
            <span className="rounded bg-[#38BDF8]/10 text-[#38BDF8] px-2 py-0.5 text-xs font-bold border border-[#38BDF8]/20">
              {usersList.length}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Pre-authorize Google User (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-[#0D1218] rounded-xl p-6 space-y-4 border border-[#202A35] shadow-lg">
            <h3 className="text-xs font-bold text-[#F4F7FA] uppercase tracking-wider border-b border-[#202A35] pb-3 flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-[#38BDF8]" /> PRE-AUTHORIZE GOOGLE ACCOUNT
            </h3>

            {statusMsg && (
              <div
                className={`p-3 rounded-lg text-xs flex items-center gap-2 border ${
                  statusMsg.type === 'success'
                    ? 'bg-[#22C55E]/10 text-[#22C55E] border-[#22C55E]/30'
                    : 'bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/30'
                }`}
              >
                {statusMsg.type === 'success' ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                ) : (
                  <AlertCircle className="h-4 w-4 shrink-0" />
                )}
                <span>{statusMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleCreateUserSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#8D99A8] mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kumar"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#080B10] text-[#F4F7FA] border border-[#202A35] rounded-lg p-2.5 text-xs outline-none focus:border-[#38BDF8]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#8D99A8] mb-1">
                  Google Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="ramesh.trader@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#080B10] text-[#F4F7FA] border border-[#202A35] rounded-lg p-2.5 text-xs outline-none focus:border-[#38BDF8]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#8D99A8] mb-1">Account Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full bg-[#080B10] text-[#F4F7FA] border border-[#202A35] rounded-lg p-2.5 text-xs outline-none focus:border-[#38BDF8]"
                >
                  <option value="USER">USER (Standard Trader)</option>
                  <option value="ADMIN">ADMIN (System Admin)</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#38BDF8] hover:bg-[#38BDF8]/90 py-2.5 text-xs font-bold text-[#080B10] shadow transition active:scale-95 cursor-pointer"
              >
                <UserPlus className="h-4 w-4" /> Pre-Authorize Google Account
              </button>
            </form>
          </div>
        </div>

        {/* Right: Registered Users Directory (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-[#0D1218] rounded-xl p-6 space-y-4 border border-[#202A35] shadow-lg">
            <div className="flex items-center justify-between border-b border-[#202A35] pb-3">
              <h3 className="text-xs font-bold text-[#F4F7FA] uppercase tracking-wider flex items-center gap-2">
                <Users className="h-4 w-4 text-[#22C55E]" /> GOOGLE ACCOUNTS DIRECTORY ({usersList.length})
              </h3>
              <button
                onClick={fetchUsers}
                className="text-xs text-[#8D99A8] hover:text-[#F4F7FA] flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
              </button>
            </div>

            {/* User Directory Table (Desktop & Tablet) */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left text-xs text-[#8D99A8]">
                <thead className="bg-[#080B10] uppercase text-[#596574] font-semibold border-b border-[#202A35] font-mono">
                  <tr>
                    <th className="px-4 py-3">User</th>
                    <th className="px-3 py-3">Role</th>
                    <th className="px-3 py-3 text-center">Status</th>
                    <th className="px-3 py-3 text-center">Portfolio</th>
                    <th className="px-3 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#202A35]">
                  {usersList.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-[#8D99A8]">
                        No users registered in MongoDB yet.
                      </td>
                    </tr>
                  ) : (
                    usersList.map((u, i) => (
                      <tr key={i} className="hover:bg-[#111820] transition">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            {u.avatar ? (
                              <img
                                src={u.avatar}
                                alt={u.name}
                                className="h-7 w-7 rounded-full object-cover border border-[#38BDF8]/30"
                              />
                            ) : (
                              <div className="h-7 w-7 rounded-full bg-gradient-to-tr from-[#38BDF8] to-[#8B5CF6] flex items-center justify-center font-bold text-[10px] text-black">
                                {u.name?.charAt(0)?.toUpperCase() || 'U'}
                              </div>
                            )}
                            <div>
                              <div className="font-bold text-[#F4F7FA] flex items-center gap-2">
                                <span>{u.name}</span>
                              </div>
                              <div className="text-[11px] text-[#8D99A8] font-mono">{u.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          {u.email === 'mailfortempusage@gmail.com' ? (
                            <span className="rounded bg-[#8B5CF6]/20 text-[#8B5CF6] px-2 py-0.5 text-[10px] font-bold font-mono border border-[#8B5CF6]/30">
                              ADMIN
                            </span>
                          ) : (
                            <select
                              value={u.role || 'USER'}
                              onChange={(e) => handleChangeUserRole(u, e.target.value as 'ADMIN' | 'USER')}
                              title="Click to switch user role between USER and ADMIN"
                              className={`rounded px-2 py-1 text-[10px] font-bold font-mono outline-none border cursor-pointer transition ${
                                u.role === 'ADMIN'
                                  ? 'bg-[#8B5CF6]/20 text-[#8B5CF6] border-[#8B5CF6]/40 hover:bg-[#8B5CF6]/30'
                                  : 'bg-[#111820] text-[#38BDF8] border-[#202A35] hover:border-[#38BDF8]/40'
                              }`}
                            >
                              <option value="USER" className="bg-[#0D1218] text-white">USER</option>
                              <option value="ADMIN" className="bg-[#0D1218] text-[#8B5CF6]">ADMIN</option>
                            </select>
                          )}
                        </td>
                        <td className="px-3 py-3 text-center font-mono">
                          {u.isDisabled ? (
                            <span className="rounded-full bg-[#EF4444]/20 text-[#EF4444] px-2 py-0.5 text-[10px] font-bold border border-[#EF4444]/30">
                              DISABLED
                            </span>
                          ) : (
                            <span className="rounded-full bg-[#22C55E]/20 text-[#22C55E] px-2 py-0.5 text-[10px] font-bold border border-[#22C55E]/30">
                              ACTIVE
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-3 text-center">
                          <button
                            onClick={() => handleInspectUserPortfolio(u)}
                            className="flex items-center gap-1.5 rounded-lg border border-[#38BDF8]/30 bg-[#38BDF8]/10 hover:bg-[#38BDF8]/20 px-2.5 py-1 text-[11px] font-semibold text-[#38BDF8] transition mx-auto font-mono cursor-pointer"
                          >
                            <Eye className="h-3 w-3 text-[#38BDF8]" /> Inspect
                          </button>
                        </td>
                        <td className="px-3 py-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {u.email !== 'mailfortempusage@gmail.com' && (
                              <>
                                <button
                                  onClick={() => handleToggleDisableUser(u)}
                                  title={u.isDisabled ? 'Enable user account' : 'Disable user account'}
                                  className={`flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-semibold transition font-mono cursor-pointer ${
                                    u.isDisabled
                                      ? 'border-[#22C55E]/30 bg-[#22C55E]/10 text-[#22C55E] hover:bg-[#22C55E]/20'
                                      : 'border-[#F59E0B]/30 bg-[#F59E0B]/10 text-[#F59E0B] hover:bg-[#F59E0B]/20'
                                  }`}
                                >
                                  {u.isDisabled ? (
                                    <>
                                      <UserCheck className="h-3 w-3 text-[#22C55E]" /> Enable
                                    </>
                                  ) : (
                                    <>
                                      <UserX className="h-3 w-3 text-[#F59E0B]" /> Disable
                                    </>
                                  )}
                                </button>

                                <button
                                  onClick={() => handleDeleteUser(u)}
                                  title="Delete user account"
                                  className="rounded-lg border border-[#EF4444]/30 bg-[#EF4444]/10 hover:bg-[#EF4444]/20 p-1 text-[#EF4444] transition cursor-pointer"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="block sm:hidden divide-y divide-[#202A35]">
              {usersList.length === 0 ? (
                <div className="py-6 text-center text-[#8D99A8] text-xs">
                  No users registered in MongoDB yet.
                </div>
              ) : (
                usersList.map((u, i) => (
                  <div key={i} className="p-3.5 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-bold text-[#F4F7FA] text-xs flex items-center gap-1.5">
                          <span>{u.name}</span>
                          {u.email === 'mailfortempusage@gmail.com' ? (
                            <span className="rounded px-1.5 py-0.2 text-[9px] font-bold font-mono bg-[#8B5CF6]/20 text-[#8B5CF6] border border-[#8B5CF6]/30">
                              ADMIN
                            </span>
                          ) : (
                            <select
                              value={u.role || 'USER'}
                              onChange={(e) => handleChangeUserRole(u, e.target.value as 'ADMIN' | 'USER')}
                              className={`rounded px-1.5 py-0.5 text-[9px] font-bold font-mono outline-none border cursor-pointer ${
                                u.role === 'ADMIN' ? 'bg-[#8B5CF6]/20 text-[#8B5CF6] border-[#8B5CF6]/30' : 'bg-[#111820] text-[#38BDF8] border-[#202A35]'
                              }`}
                            >
                              <option value="USER" className="bg-[#0D1218] text-white">USER</option>
                              <option value="ADMIN" className="bg-[#0D1218] text-[#8B5CF6]">ADMIN</option>
                            </select>
                          )}
                        </div>
                        <div className="text-[11px] text-[#8D99A8] font-mono">{u.email}</div>
                      </div>
                      <div>
                        {u.isDisabled ? (
                          <span className="rounded-full bg-[#EF4444]/20 text-[#EF4444] px-2 py-0.5 text-[9px] font-bold">DISABLED</span>
                        ) : (
                          <span className="rounded-full bg-[#22C55E]/20 text-[#22C55E] px-2 py-0.5 text-[9px] font-bold">ACTIVE</span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <button
                        onClick={() => handleInspectUserPortfolio(u)}
                        className="flex items-center gap-1 rounded-lg border border-[#38BDF8]/30 bg-[#38BDF8]/10 px-2.5 py-1 text-[10px] font-semibold text-[#38BDF8] font-mono"
                      >
                        <Eye className="h-3 w-3" /> Inspect
                      </button>
                      {u.email !== 'mailfortempusage@gmail.com' && (
                        <>
                          <button
                            onClick={() => handleToggleDisableUser(u)}
                            className={`flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[10px] font-semibold font-mono ${u.isDisabled ? 'border-[#22C55E]/30 bg-[#22C55E]/10 text-[#22C55E]' : 'border-[#F59E0B]/30 bg-[#F59E0B]/10 text-[#F59E0B]'}`}
                          >
                            {u.isDisabled ? 'Enable' : 'Disable'}
                          </button>
                          <button
                            onClick={() => handleDeleteUser(u)}
                            className="p-1 rounded-lg border border-[#EF4444]/30 bg-[#EF4444]/10 text-[#EF4444]"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Admin User Portfolio Inspector Modal */}
      {inspectingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md overflow-y-auto">
          <div className="bg-[#0D1218] rounded-2xl w-full max-w-4xl p-6 space-y-5 relative border border-[#38BDF8]/40 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-[#202A35] pb-4">
              <div>
                <h3 className="text-lg font-extrabold text-[#F4F7FA] flex items-center gap-2">
                  <Eye className="h-5 w-5 text-[#38BDF8]" /> Admin User Portfolio Inspection
                </h3>
                <p className="text-xs text-[#8D99A8]">
                  Viewing portfolio for: <strong className="text-[#F4F7FA]">{inspectingUser.name}</strong> ({inspectingUser.email})
                </p>
              </div>
              <button
                onClick={() => setInspectingUser(null)}
                className="text-[#8D99A8] hover:text-[#F4F7FA] rounded-lg p-1 cursor-pointer"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {isInspectingLoading ? (
              <div className="py-16 text-center space-y-3">
                <Loader2 className="h-8 w-8 animate-spin text-[#38BDF8] mx-auto" />
                <p className="text-xs text-[#8D99A8]">Fetching user portfolio from MongoDB Atlas...</p>
              </div>
            ) : inspectingPortfolio ? (
              <div className="space-y-6">
                {/* Metrics Header */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-[#080B10] p-4 rounded-xl border border-[#202A35]">
                    <span className="text-[#8D99A8] text-xs font-semibold block">Total Invested</span>
                    <div className="text-xl font-bold font-mono text-[#F4F7FA] mt-1">
                      ₹
                      {(inspectingPortfolio.holdings || [])
                        .reduce((sum: number, h: any) => sum + (h.buyPrice || 0) * (h.quantity || 0), 0)
                        .toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </div>
                  </div>

                  <div className="bg-[#080B10] p-4 rounded-xl border border-[#202A35]">
                    <span className="text-[#8D99A8] text-xs font-semibold block">Current Market Value</span>
                    <div className="text-xl font-bold font-mono text-[#F4F7FA] mt-1">
                      ₹
                      {(inspectingPortfolio.holdings || [])
                        .reduce((sum: number, h: any) => sum + (h.currentPrice || h.buyPrice || 0) * (h.quantity || 0), 0)
                        .toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </div>
                  </div>

                  <div className="bg-[#080B10] p-4 rounded-xl border border-[#202A35]">
                    <span className="text-[#8D99A8] text-xs font-semibold block">Active Holdings</span>
                    <div className="text-xl font-bold font-mono text-[#38BDF8] mt-1">
                      {(inspectingPortfolio.holdings || []).length} Stocks
                    </div>
                  </div>
                </div>

                {/* Stock Holdings Table */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-[#F4F7FA] uppercase tracking-wider flex items-center gap-2 font-mono">
                    <Briefcase className="h-4 w-4 text-[#8B5CF6]" /> OWNED STOCK HOLDINGS ({(inspectingPortfolio.holdings || []).length})
                  </h4>

                  <div className="overflow-x-auto rounded-xl border border-[#202A35] bg-[#080B10]">
                    <table className="w-full text-left text-xs text-[#8D99A8]">
                      <thead className="bg-[#0D1218] uppercase text-[#596574] font-semibold border-b border-[#202A35] font-mono">
                        <tr>
                          <th className="px-4 py-3">Symbol</th>
                          <th className="px-4 py-3">Company</th>
                          <th className="px-3 py-3 text-right">Qty</th>
                          <th className="px-3 py-3 text-right">Buy Price</th>
                          <th className="px-3 py-3 text-right">Invested</th>
                          <th className="px-3 py-3 text-right">Current Price</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#202A35] font-mono">
                        {(!inspectingPortfolio.holdings || inspectingPortfolio.holdings.length === 0) ? (
                          <tr>
                            <td colSpan={6} className="py-8 text-center text-[#8D99A8] font-sans">
                              User has not added any owned stock holdings yet.
                            </td>
                          </tr>
                        ) : (
                          inspectingPortfolio.holdings.map((h: any, idx: number) => (
                            <tr key={idx} className="hover:bg-[#111820] transition">
                              <td className="px-4 py-3 font-bold text-[#F4F7FA]">{h.symbol}</td>
                              <td className="px-4 py-3 text-[#8D99A8] font-sans">{h.companyName}</td>
                              <td className="px-3 py-3 text-right font-bold text-[#F4F7FA]">{h.quantity}</td>
                              <td className="px-3 py-3 text-right">₹{Number(h.buyPrice).toLocaleString('en-IN')}</td>
                              <td className="px-3 py-3 text-right font-bold text-[#F4F7FA]">
                                ₹{(Number(h.buyPrice) * Number(h.quantity)).toLocaleString('en-IN')}
                              </td>
                              <td className="px-3 py-3 text-right font-bold text-[#22C55E]">
                                ₹{Number(h.currentPrice || h.buyPrice).toLocaleString('en-IN')}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Watchlist */}
                {inspectingPortfolio.watchlist && inspectingPortfolio.watchlist.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-[#F4F7FA] uppercase tracking-wider flex items-center gap-2 font-mono">
                      <Activity className="h-4 w-4 text-[#38BDF8]" /> WATCHLIST STOCKS ({inspectingPortfolio.watchlist.length})
                    </h4>

                    <div className="overflow-x-auto rounded-xl border border-[#202A35] bg-[#080B10]">
                      <table className="w-full text-left text-xs text-[#8D99A8]">
                        <thead className="bg-[#0D1218] uppercase text-[#596574] font-semibold border-b border-[#202A35] font-mono">
                          <tr>
                            <th className="px-4 py-3">Symbol</th>
                            <th className="px-4 py-3">Company</th>
                            <th className="px-3 py-3 text-right">Current Price</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#202A35] font-mono">
                          {inspectingPortfolio.watchlist.map((w: any, idx: number) => (
                            <tr key={idx} className="hover:bg-[#111820] transition">
                              <td className="px-4 py-3 font-bold text-[#F4F7FA]">{w.symbol}</td>
                              <td className="px-4 py-3 text-[#8D99A8] font-sans">{w.companyName}</td>
                              <td className="px-3 py-3 text-right font-bold text-[#38BDF8]">
                                ₹{Number(w.currentPrice || w.price || 0).toLocaleString('en-IN')}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};
