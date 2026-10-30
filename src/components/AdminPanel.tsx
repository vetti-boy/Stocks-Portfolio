'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  ShieldCheck,
  Users,
  RefreshCw,
  X,
  Loader2,
  Eye,
  Briefcase,
  Activity,
  UserX,
  UserCheck,
  Trash2,
} from 'lucide-react';

export const AdminPanel: React.FC = () => {
  const { user } = useAuth();

  const [usersList, setUsersList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // User Portfolio Inspection Modal State
  const [inspectingUser, setInspectingUser] = useState<any | null>(null);
  const [inspectingPortfolio, setInspectingPortfolio] = useState<any | null>(null);
  const [isInspectingLoading, setIsInspectingLoading] = useState(false);

  const isAdmin = user?.role === 'ADMIN' || user?.email === 'mailfortempusage@gmail.com';

  const fetchUsers = async () => {
    if (!isAdmin) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/users`);
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

  // Admin User Portfolio Inspection Handler
  const handleInspectUserPortfolio = async (targetUser: any) => {
    setInspectingUser(targetUser);
    setInspectingPortfolio(null);
    setIsInspectingLoading(true);

    try {
      const res = await fetch(
        `/api/admin/user-portfolio?targetUserId=${targetUser.id}`
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
        `PERMANENT DELETION WARNING:\nAre you sure you want to permanently delete user account "${targetUser.name}" (${targetUser.email})?\n\nThis will permanently delete their portfolio holdings.`
      )
    ) {
      return;
    }

    try {
      const res = await fetch(
        `/api/admin/delete-user?targetUserId=${targetUser.id}`,
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
      <div className="bg-[#0B1018] p-12 text-center space-y-4 max-w-xl mx-auto border border-rose-500/30 rounded-2xl shadow-2xl">
        <ShieldCheck className="h-12 w-12 text-rose-400 mx-auto" />
        <h3 className="text-xl font-bold text-white">Admin Authorization Required</h3>
        <p className="text-xs text-slate-400">
          User account management can only be performed by an authenticated Administrator.
        </p>
        <p className="text-xs font-mono text-[#38BDF8]">
          Sign in with the Administrator Google Account (mailfortempusage@gmail.com).
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-4xl">
      {/* Top Banner */}
      <div className="glass-shell">
        <div className="glass-core p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--brand-primary)] font-mono mb-1">
              SECURITY & ENTERPRISE ACCESS
            </div>
            <h2 className="text-base sm:text-lg font-black text-[var(--text-primary)] flex items-center gap-2 font-mono">
              <ShieldCheck className="h-5 w-5 text-[var(--brand-primary)]" /> Enterprise Admin Console
            </h2>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              Manage authenticated Google accounts, configure roles, and inspect user stock portfolios.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <div className="flex items-center gap-2 rounded-lg bg-[var(--surface-muted)] border border-[var(--border)] px-3 py-1.5 text-xs font-mono">
              <Users className="h-3.5 w-3.5 text-[var(--brand-primary)]" />
              <span className="text-[var(--text-secondary)]">Total Accounts:</span>
              <span className="rounded bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] px-2 py-0.5 text-xs font-bold border border-[var(--brand-primary)]/20">
                {usersList.length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Compact Registered Users Directory */}
      <div className="space-y-4">
        <div className="glass-shell">
          <div className="glass-core p-4 sm:p-5 space-y-3.5">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <h3 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-2 font-mono">
                <Users className="h-4 w-4 text-[var(--positive)]" /> GOOGLE ACCOUNTS DIRECTORY ({usersList.length})
              </h3>
              <button
                onClick={fetchUsers}
                className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center gap-1.5 transition cursor-pointer font-mono"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Refresh Directory</span>
              </button>
            </div>

            {/* User Directory Table (Desktop & Tablet) */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left text-xs text-[var(--text-secondary)]">
                <thead className="bg-[var(--table-header-bg)] uppercase text-[var(--text-secondary)] font-bold border-b border-[var(--border)] font-mono text-[10px]">
                  <tr>
                    <th className="px-3.5 py-2.5">User</th>
                    <th className="px-3 py-2.5 w-28 text-center">Role</th>
                    <th className="px-3 py-2.5 w-24 text-center">Status</th>
                    <th className="px-3 py-2.5 w-28 text-center">Portfolio</th>
                    <th className="px-3 py-2.5 w-36 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {usersList.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-[var(--text-secondary)] font-sans">
                        No users registered yet.
                      </td>
                    </tr>
                  ) : (
                    usersList.map((u, i) => (
                      <tr key={i} className="hover:bg-[var(--table-row-hover)] transition">
                        <td className="px-3.5 py-2.5">
                          <div className="flex items-center gap-2.5">
                            {u.avatar ? (
                              <img
                                src={u.avatar}
                                alt={u.name}
                                className="h-7 w-7 rounded-full object-cover border border-[var(--border)]"
                              />
                            ) : (
                              <div className="h-7 w-7 rounded-full bg-[var(--surface-muted)] border border-[var(--border)] text-[var(--brand-primary)] flex items-center justify-center font-bold text-[10px]">
                                {u.name?.charAt(0)?.toUpperCase() || 'U'}
                              </div>
                            )}
                            <div className="min-w-0">
                              <div className="font-bold text-[var(--text-primary)] truncate">
                                {u.name}
                              </div>
                              <div className="text-[11px] text-[var(--text-secondary)] font-mono truncate">{u.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          {u.email === 'mailfortempusage@gmail.com' ? (
                            <span className="rounded bg-[var(--brand-primary)]/15 text-[var(--brand-primary)] px-2 py-0.5 text-[10px] font-bold font-mono border border-[var(--brand-primary)]/30">
                              ADMIN
                            </span>
                          ) : (
                            <select
                              value={u.role || 'USER'}
                              onChange={(e) => handleChangeUserRole(u, e.target.value as 'ADMIN' | 'USER')}
                              title="Click to switch user role between USER and ADMIN"
                              className={`rounded-md px-2 py-1 text-[10px] font-bold font-mono outline-none border cursor-pointer transition ${
                                u.role === 'ADMIN'
                                  ? 'bg-[var(--brand-primary)]/15 text-[var(--brand-primary)] border-[var(--brand-primary)]/40 hover:bg-[var(--brand-primary)]/25'
                                  : 'bg-[var(--surface-muted)] text-[var(--text-secondary)] border-[var(--border)] hover:border-[var(--brand-primary)]/40'
                              }`}
                            >
                              <option value="USER" className="bg-[var(--surface)] text-[var(--text-primary)]">USER</option>
                              <option value="ADMIN" className="bg-[var(--surface)] text-[var(--brand-primary)]">ADMIN</option>
                            </select>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-center font-mono">
                          {u.isDisabled ? (
                            <span className="rounded-full bg-rose-500/15 text-rose-500 px-2 py-0.5 text-[10px] font-bold border border-rose-500/30">
                              DISABLED
                            </span>
                          ) : (
                            <span className="rounded-full bg-[var(--positive)]/15 text-[var(--positive)] px-2 py-0.5 text-[10px] font-bold border border-[var(--positive)]/30">
                              ACTIVE
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <button
                            onClick={() => handleInspectUserPortfolio(u)}
                            className="inline-flex items-center gap-1 rounded-md border border-[var(--border)] bg-[var(--surface-muted)] hover:bg-[var(--surface-hover)] px-2.5 py-1 text-[11px] font-semibold text-[var(--text-primary)] transition font-mono cursor-pointer"
                          >
                            <Eye className="h-3 w-3 text-[var(--brand-primary)]" /> Inspect
                          </button>
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {u.email !== 'mailfortempusage@gmail.com' && (
                              <>
                                <button
                                  onClick={() => handleToggleDisableUser(u)}
                                  title={u.isDisabled ? 'Enable user account' : 'Disable user account'}
                                  className={`flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-semibold transition font-mono cursor-pointer ${
                                    u.isDisabled
                                      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20'
                                      : 'border-amber-500/30 bg-amber-500/10 text-amber-500 hover:bg-amber-500/20'
                                  }`}
                                >
                                  {u.isDisabled ? (
                                    <>
                                      <UserCheck className="h-3 w-3 text-emerald-500" /> Enable
                                    </>
                                  ) : (
                                    <>
                                      <UserX className="h-3 w-3 text-amber-500" /> Disable
                                    </>
                                  )}
                                </button>

                                <button
                                  onClick={() => handleDeleteUser(u)}
                                  title="Delete user account"
                                  className="rounded-md border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 p-1 text-rose-500 transition cursor-pointer"
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
            <div className="block sm:hidden divide-y divide-[var(--border)]">
              {usersList.length === 0 ? (
                <div className="py-6 text-center text-[var(--text-secondary)] text-xs">
                  No users registered yet.
                </div>
              ) : (
                usersList.map((u, i) => (
                  <div key={i} className="p-3.5 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-bold text-[var(--text-primary)] text-xs flex items-center gap-1.5">
                          <span>{u.name}</span>
                          {u.email === 'mailfortempusage@gmail.com' ? (
                            <span className="rounded px-1.5 py-0.5 text-[9px] font-bold font-mono bg-[var(--brand-primary)]/15 text-[var(--brand-primary)] border border-[var(--brand-primary)]/30">
                              ADMIN
                            </span>
                          ) : (
                            <select
                              value={u.role || 'USER'}
                              onChange={(e) => handleChangeUserRole(u, e.target.value as 'ADMIN' | 'USER')}
                              className={`rounded px-1.5 py-0.5 text-[9px] font-bold font-mono outline-none border cursor-pointer ${
                                u.role === 'ADMIN'
                                  ? 'bg-[var(--brand-primary)]/15 text-[var(--brand-primary)] border-[var(--brand-primary)]/30'
                                  : 'bg-[var(--surface-muted)] text-[var(--text-secondary)] border-[var(--border)]'
                              }`}
                            >
                              <option value="USER" className="bg-[var(--surface)] text-[var(--text-primary)]">USER</option>
                              <option value="ADMIN" className="bg-[var(--surface)] text-[var(--brand-primary)]">ADMIN</option>
                            </select>
                          )}
                        </div>
                        <div className="text-[11px] text-[var(--text-secondary)] font-mono">{u.email}</div>
                      </div>
                      <div>
                        {u.isDisabled ? (
                          <span className="rounded-full bg-rose-500/15 text-rose-500 px-2 py-0.5 text-[9px] font-bold border border-rose-500/30">DISABLED</span>
                        ) : (
                          <span className="rounded-full bg-[var(--positive)]/15 text-[var(--positive)] px-2 py-0.5 text-[9px] font-bold border border-[var(--positive)]/30">ACTIVE</span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <button
                        onClick={() => handleInspectUserPortfolio(u)}
                        className="flex items-center gap-1 rounded-md border border-[var(--border)] bg-[var(--surface-muted)] hover:bg-[var(--surface-hover)] px-2.5 py-1 text-[10px] font-semibold text-[var(--text-primary)] font-mono"
                      >
                        <Eye className="h-3 w-3 text-[var(--brand-primary)]" /> Inspect
                      </button>
                      {u.email !== 'mailfortempusage@gmail.com' && (
                        <>
                          <button
                            onClick={() => handleToggleDisableUser(u)}
                            className={`flex items-center gap-1 rounded-md border px-2.5 py-1 text-[10px] font-semibold font-mono ${
                              u.isDisabled
                                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-500'
                                : 'border-amber-500/30 bg-amber-500/10 text-amber-500'
                            }`}
                          >
                            {u.isDisabled ? 'Enable' : 'Disable'}
                          </button>
                          <button
                            onClick={() => handleDeleteUser(u)}
                            className="p-1 rounded-md border border-rose-500/30 bg-rose-500/10 text-rose-500"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md overflow-y-auto">
          <div className="bg-[var(--surface)] text-[var(--text-primary)] rounded-2xl w-full max-w-4xl p-6 space-y-5 relative border border-[var(--border)] shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
              <div>
                <h3 className="text-base sm:text-lg font-black text-[var(--text-primary)] flex items-center gap-2 font-mono">
                  <Eye className="h-5 w-5 text-[var(--brand-primary)]" /> Admin User Portfolio Inspection
                </h3>
                <p className="text-xs text-[var(--text-secondary)]">
                  Viewing portfolio for: <strong className="text-[var(--text-primary)]">{inspectingUser.name}</strong> ({inspectingUser.email})
                </p>
              </div>
              <button
                onClick={() => setInspectingUser(null)}
                className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-lg p-1 cursor-pointer transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {isInspectingLoading ? (
              <div className="py-16 text-center space-y-3">
                <Loader2 className="h-8 w-8 animate-spin text-[var(--brand-primary)] mx-auto" />
                <p className="text-xs text-[var(--text-secondary)]">Fetching user portfolio...</p>
              </div>
            ) : inspectingPortfolio ? (
              <div className="space-y-6">
                {/* Metrics Header */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-[var(--surface-muted)] p-4 rounded-xl border border-[var(--border)]">
                    <span className="text-[var(--text-secondary)] text-xs font-semibold block">Total Invested</span>
                    <div className="text-xl font-bold font-mono text-[var(--text-primary)] mt-1">
                      ₹
                      {(inspectingPortfolio.holdings || [])
                        .reduce((sum: number, h: any) => sum + (h.buyPrice || 0) * (h.quantity || 0), 0)
                        .toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </div>
                  </div>

                  <div className="bg-[var(--surface-muted)] p-4 rounded-xl border border-[var(--border)]">
                    <span className="text-[var(--text-secondary)] text-xs font-semibold block">Current Market Value</span>
                    <div className="text-xl font-bold font-mono text-[var(--text-primary)] mt-1">
                      ₹
                      {(inspectingPortfolio.holdings || [])
                        .reduce((sum: number, h: any) => sum + (h.currentPrice || h.buyPrice || 0) * (h.quantity || 0), 0)
                        .toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </div>
                  </div>

                  <div className="bg-[var(--surface-muted)] p-4 rounded-xl border border-[var(--border)]">
                    <span className="text-[var(--text-secondary)] text-xs font-semibold block">Active Holdings</span>
                    <div className="text-xl font-bold font-mono text-[var(--brand-primary)] mt-1">
                      {(inspectingPortfolio.holdings || []).length} Stocks
                    </div>
                  </div>
                </div>

                {/* Stock Holdings Table */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-2 font-mono">
                    <Briefcase className="h-4 w-4 text-[var(--brand-primary)]" /> OWNED STOCK HOLDINGS ({(inspectingPortfolio.holdings || []).length})
                  </h4>

                  <div className="overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--surface)]">
                    <table className="w-full text-left text-xs text-[var(--text-secondary)]">
                      <thead className="bg-[var(--table-header-bg)] uppercase text-[var(--text-secondary)] font-bold border-b border-[var(--border)] font-mono text-[10px]">
                        <tr>
                          <th className="px-4 py-3">Symbol</th>
                          <th className="px-4 py-3">Company</th>
                          <th className="px-3 py-3 text-right">Qty</th>
                          <th className="px-3 py-3 text-right">Buy Price</th>
                          <th className="px-3 py-3 text-right">Invested</th>
                          <th className="px-3 py-3 text-right">Current Price</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border)] font-mono">
                        {(!inspectingPortfolio.holdings || inspectingPortfolio.holdings.length === 0) ? (
                          <tr>
                            <td colSpan={6} className="py-8 text-center text-[var(--text-secondary)] font-sans">
                              User has not added any owned stock holdings yet.
                            </td>
                          </tr>
                        ) : (
                          inspectingPortfolio.holdings.map((h: any, idx: number) => (
                            <tr key={idx} className="hover:bg-[var(--table-row-hover)] transition">
                              <td className="px-4 py-3 font-bold text-[var(--text-primary)]">{h.symbol}</td>
                              <td className="px-4 py-3 text-[var(--text-secondary)] font-sans">{h.companyName}</td>
                              <td className="px-3 py-3 text-right font-bold text-[var(--text-primary)]">{h.quantity}</td>
                              <td className="px-3 py-3 text-right">₹{Number(h.buyPrice).toLocaleString('en-IN')}</td>
                              <td className="px-3 py-3 text-right font-bold text-[var(--text-primary)]">
                                ₹{(Number(h.buyPrice) * Number(h.quantity)).toLocaleString('en-IN')}
                              </td>
                              <td className="px-3 py-3 text-right font-bold text-[var(--positive)]">
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
                    <h4 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-2 font-mono">
                      <Activity className="h-4 w-4 text-[var(--brand-primary)]" /> WATCHLIST STOCKS ({inspectingPortfolio.watchlist.length})
                    </h4>

                    <div className="overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--surface)]">
                      <table className="w-full text-left text-xs text-[var(--text-secondary)]">
                        <thead className="bg-[var(--table-header-bg)] uppercase text-[var(--text-secondary)] font-bold border-b border-[var(--border)] font-mono text-[10px]">
                          <tr>
                            <th className="px-4 py-3">Symbol</th>
                            <th className="px-4 py-3">Company</th>
                            <th className="px-3 py-3 text-right">Current Price</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border)] font-mono">
                          {inspectingPortfolio.watchlist.map((w: any, idx: number) => (
                            <tr key={idx} className="hover:bg-[var(--table-row-hover)] transition">
                              <td className="px-4 py-3 font-bold text-[var(--text-primary)]">{w.symbol}</td>
                              <td className="px-4 py-3 text-[var(--text-secondary)] font-sans">{w.companyName}</td>
                              <td className="px-3 py-3 text-right font-bold text-[var(--brand-primary)]">
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
