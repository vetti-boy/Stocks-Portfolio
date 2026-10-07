'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  ShieldCheck,
  UserPlus,
  Users,
  Lock,
  CheckCircle2,
  AlertCircle,
  Database,
  ShieldAlert,
  RefreshCw,
  KeyRound,
  X,
  Mail,
  Loader2,
  Eye,
  EyeOff,
  Briefcase,
  TrendingUp,
  Activity,
  DollarSign,
  PieChart,
  UserX,
  UserCheck,
  Trash2,
} from 'lucide-react';
import { UserRole } from '@/types/stock';

export const AdminPanel: React.FC = () => {
  const { user } = useAuth();

  const [usersList, setUsersList] = useState<any[]>([]);
  const [userStats, setUserStats] = useState<{ totalCount: number; mongoCount: number; fallbackCount: number }>({
    totalCount: 0,
    mongoCount: 0,
    fallbackCount: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  // New User Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<UserRole>('USER');

  // Admin Direct Password Reset Modal State
  const [resetTargetUser, setResetTargetUser] = useState<any | null>(null);
  const [resetPasswordValue, setResetPasswordValue] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [isResetSubmitting, setIsResetSubmitting] = useState(false);
  const [resetStatusMsg, setResetStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // User Portfolio Inspection Modal State
  const [inspectingUser, setInspectingUser] = useState<any | null>(null);
  const [inspectingPortfolio, setInspectingPortfolio] = useState<any | null>(null);
  const [isInspectingLoading, setIsInspectingLoading] = useState(false);

  const isAdmin = user?.role === 'ADMIN' || user?.id === 'admin_master';

  const fetchUsers = async () => {
    if (!isAdmin) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/users?adminRole=${user?.role || 'ADMIN'}`);
      const data = await res.json();
      if (data.users) {
        setUsersList(data.users);
        setUserStats({
          totalCount: data.totalCount ?? data.users.length,
          mongoCount: data.mongoCount ?? 0,
          fallbackCount: data.fallbackCount ?? 0,
        });
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

    if (!email || !password || !name) return;

    try {
      const res = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminUserId: user?.id,
          adminRole: user?.role,
          name,
          email,
          password,
          role,
          currency: 'INR',
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setStatusMsg({ type: 'error', text: data.error || 'Failed to create user account' });
        return;
      }

      setStatusMsg({
        type: 'success',
        text: `Account created for ${data.user.name} (${data.user.email}). Credentials emailed!`,
      });

      setName('');
      setEmail('');
      setPassword('');
      fetchUsers();
    } catch {
      setStatusMsg({
        type: 'error',
        text: 'Network error creating user account.',
      });
    }
  };

  // Direct Admin Password Reset Handler
  const handleAdminResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetTargetUser || !resetPasswordValue) return;

    setIsResetSubmitting(true);
    setResetStatusMsg(null);

    try {
      const res = await fetch('/api/admin/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminUserId: user?.id,
          adminRole: user?.role,
          targetUserId: resetTargetUser.id,
          targetEmail: resetTargetUser.email,
          newPassword: resetPasswordValue,
          requirePasswordChangeOnLogin: false,
        }),
      });

      const data = await res.json();
      setIsResetSubmitting(false);

      if (!res.ok || data.error) {
        setResetStatusMsg({ type: 'error', text: data.error || 'Failed to reset user password' });
      } else {
        setResetStatusMsg({
          type: 'success',
          text: `Password updated and credentials emailed to ${resetTargetUser.email}!`,
        });
        setTimeout(() => {
          setResetTargetUser(null);
          setResetPasswordValue('');
          setResetStatusMsg(null);
        }, 1500);
      }
    } catch {
      setIsResetSubmitting(false);
      setResetStatusMsg({ type: 'error', text: 'Network error resetting user password' });
    }
  };

  // Admin User Portfolio Inspection Handler
  const handleInspectUserPortfolio = async (targetUser: any) => {
    setInspectingUser(targetUser);
    setInspectingPortfolio(null);
    setIsInspectingLoading(true);

    try {
      const res = await fetch(
        `/api/admin/user-portfolio?targetUserId=${targetUser.id}&adminRole=${user?.role || 'ADMIN'}&adminUserId=${user?.id}`
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
    if (targetUser.id === 'admin_master') {
      alert('Master Admin account status cannot be modified.');
      return;
    }

    const newStatus = !targetUser.isDisabled;
    const confirmMsg = newStatus
      ? `Are you sure you want to DISABLE the account for "${targetUser.name}" (${targetUser.email})?\nThe user will be blocked from logging in until re-enabled.`
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
    if (targetUser.id === 'admin_master' || targetUser.email === 'mailfortempusage@gmail.com') {
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
    if (targetUser.id === 'admin_master') {
      alert('Master Admin account cannot be deleted.');
      return;
    }

    if (
      !window.confirm(
        `PERMANENT DELETION WARNING:\nAre you sure you want to permanently delete user account "${targetUser.name}" (${targetUser.email})?\n\nThis will destroy all their cloud encrypted holdings and account records permanently.`
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
      <div className="glass-panel p-12 text-center space-y-4 max-w-xl mx-auto border-rose-500/30">
        <ShieldAlert className="h-12 w-12 text-rose-400 mx-auto animate-bounce" />
        <h3 className="text-xl font-bold text-white">Admin Authorization Required</h3>
        <p className="text-xs text-slate-400">
          User account creation and security administration can only be performed by an authenticated
          Administrator.
        </p>
        <p className="text-xs font-mono text-cyan-400">
          Log in with Administrator credentials to manage user access.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-[#0D1218] rounded-xl p-5 border border-[#202A35] shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-extrabold text-[#F4F7FA] flex items-center gap-2 font-mono">
            <ShieldCheck className="h-5 w-5 text-[#38BDF8]" /> Enterprise Admin Console & User Provisioning
          </h2>
          <p className="text-xs text-[#8D99A8] mt-1">
            Account management restricted to System Administrator. Cloud data encrypted with AES-256-GCM.
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
        {/* Left: Admin Account Creation Form (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-[#0D1218] rounded-xl p-6 space-y-4 border border-[#202A35] shadow-lg">
            <h3 className="text-xs font-bold text-[#F4F7FA] uppercase tracking-wider border-b border-[#202A35] pb-3 flex items-center gap-2 font-mono">
              <UserPlus className="h-4 w-4 text-[#38BDF8]" /> PROVISION NEW USER ACCOUNT
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
                  User Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="ramesh.trader@stocks.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#080B10] text-[#F4F7FA] border border-[#202A35] rounded-lg p-2.5 text-xs outline-none focus:border-[#38BDF8]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#8D99A8] mb-1">
                  Initial Password (Emailed to User) *
                </label>
                <div className="relative flex items-center">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-[#080B10] text-[#F4F7FA] border border-[#202A35] rounded-lg p-2.5 text-xs font-mono pr-10 outline-none focus:border-[#38BDF8]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 text-[#596574] hover:text-[#F4F7FA] transition"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <span className="text-[10px] text-[#596574] mt-1 block">
                  User will receive this initial password via email.
                </span>
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
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#38BDF8] hover:bg-[#38BDF8]/90 py-2.5 text-xs font-bold text-[#080B10] shadow transition active:scale-95 font-mono"
              >
                <UserPlus className="h-4 w-4" /> Provision Account & Dispatch Credentials
              </button>
            </form>
          </div>
        </div>

        {/* Right: Registered Users Directory (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-[#0D1218] rounded-xl p-6 space-y-4 border border-[#202A35] shadow-lg">
            <div className="flex items-center justify-between border-b border-[#202A35] pb-3">
              <h3 className="text-xs font-bold text-[#F4F7FA] uppercase tracking-wider flex items-center gap-2 font-mono">
                <Users className="h-4 w-4 text-[#22C55E]" /> USER ACCOUNTS DIRECTORY ({usersList.length})
              </h3>
              <button
                onClick={fetchUsers}
                className="text-xs text-[#8D99A8] hover:text-[#F4F7FA] flex items-center gap-1 font-mono"
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
                        No users provisioned in MongoDB yet. Provision your first account using the form!
                      </td>
                    </tr>
                  ) : (
                    usersList.map((u, i) => (
                      <tr key={i} className="hover:bg-[#111820] transition">
                        <td className="px-4 py-3">
                          <div className="font-bold text-[#F4F7FA] flex items-center gap-2">
                            <span>{u.name}</span>
                            {u.mustChangePassword && (
                              <span className="rounded bg-[#F59E0B]/20 text-[#F59E0B] px-1.5 py-0.5 text-[9px] font-bold border border-[#F59E0B]/30 font-mono">
                                Password Reset Pending
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-[#8D99A8] font-mono">{u.email}</div>
                        </td>
                        <td className="px-3 py-3">
                          {u.id === 'admin_master' || u.email === 'mailfortempusage@gmail.com' ? (
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
                            className="flex items-center gap-1.5 rounded-lg border border-[#38BDF8]/30 bg-[#38BDF8]/10 hover:bg-[#38BDF8]/20 px-2.5 py-1 text-[11px] font-semibold text-[#38BDF8] transition mx-auto font-mono"
                          >
                            <Eye className="h-3 w-3 text-[#38BDF8]" /> Inspect
                          </button>
                        </td>
                        <td className="px-3 py-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => {
                                setResetTargetUser(u);
                                setResetPasswordValue('');
                                setResetStatusMsg(null);
                              }}
                              title="Direct Admin Password Reset"
                              className="flex items-center gap-1 rounded-lg border border-[#8B5CF6]/30 bg-[#8B5CF6]/10 hover:bg-[#8B5CF6]/20 px-2 py-1 text-[11px] font-semibold text-[#8B5CF6] transition font-mono"
                            >
                              <KeyRound className="h-3 w-3 text-[#8B5CF6]" /> Reset
                            </button>

                            {u.role !== 'ADMIN' && u.id !== 'admin_master' && u.email !== 'mailfortempusage@gmail.com' && (
                              <>
                                <button
                                  onClick={() => handleToggleDisableUser(u)}
                                  title={u.isDisabled ? 'Enable user account' : 'Disable user account'}
                                  className={`flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-semibold transition font-mono ${
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
                                  className="rounded-lg border border-[#EF4444]/30 bg-[#EF4444]/10 hover:bg-[#EF4444]/20 p-1 text-[#EF4444] transition"
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

            {/* User Directory Mobile Cards (< 640px) */}
            <div className="block sm:hidden divide-y divide-[#202A35]">
              {usersList.length === 0 ? (
                <div className="py-6 text-center text-[#8D99A8] text-xs">
                  No users provisioned in MongoDB yet.
                </div>
              ) : (
                usersList.map((u, i) => (
                  <div key={i} className="p-3.5 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-bold text-[#F4F7FA] text-xs flex items-center gap-1.5">
                          <span>{u.name}</span>
                          {u.id === 'admin_master' || u.email === 'mailfortempusage@gmail.com' ? (
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
                      <button
                        onClick={() => {
                          setResetTargetUser(u);
                          setResetPasswordValue('');
                          setResetStatusMsg(null);
                        }}
                        className="flex items-center gap-1 rounded-lg border border-[#8B5CF6]/30 bg-[#8B5CF6]/10 px-2.5 py-1 text-[10px] font-semibold text-[#8B5CF6] font-mono"
                      >
                        <KeyRound className="h-3 w-3" /> Reset
                      </button>
                      {u.role !== 'ADMIN' && u.id !== 'admin_master' && u.email !== 'mailfortempusage@gmail.com' && (
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

      {/* Modal 1: Admin Direct Password Reset Modal */}
      {resetTargetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
          <div className="bg-[#0D1218] rounded-2xl w-full max-w-md p-6 space-y-4 relative border border-[#8B5CF6]/40 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#202A35] pb-3">
              <div>
                <h3 className="text-base font-extrabold text-[#F4F7FA] flex items-center gap-2 font-mono">
                  <KeyRound className="h-5 w-5 text-[#8B5CF6]" /> Admin Direct Password Override
                </h3>
                <p className="text-xs text-[#8D99A8]">Target User: {resetTargetUser.name} ({resetTargetUser.email})</p>
              </div>
              <button
                onClick={() => setResetTargetUser(null)}
                className="text-[#8D99A8] hover:text-[#F4F7FA]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {resetStatusMsg && (
              <div
                className={`p-3 rounded-lg text-xs flex items-center gap-2 border ${
                  resetStatusMsg.type === 'success'
                    ? 'bg-[#22C55E]/10 text-[#22C55E] border-[#22C55E]/30'
                    : 'bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/30'
                }`}
              >
                {resetStatusMsg.type === 'success' ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                ) : (
                  <AlertCircle className="h-4 w-4 shrink-0" />
                )}
                <span>{resetStatusMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleAdminResetPassword} className="space-y-4">
              <div className="rounded-xl bg-[#8B5CF6]/10 border border-[#8B5CF6]/20 p-3 text-xs text-[#8B5CF6] space-y-1">
                <div className="font-bold text-[#F4F7FA] flex items-center gap-1.5 font-mono">
                  <Mail className="h-4 w-4 text-[#38BDF8]" /> Server Mail Dispatch
                </div>
                <p className="text-[11px] text-[#8D99A8]">
                  Set new password directly without current password verification. Updated password will be emailed to user.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#8D99A8] mb-1">
                  Set New Password for User *
                </label>
                <div className="relative flex items-center">
                  <input
                    type={showResetPassword ? 'text' : 'password'}
                    required
                    minLength={4}
                    placeholder="Enter new password for user"
                    value={resetPasswordValue}
                    onChange={(e) => setResetPasswordValue(e.target.value)}
                    className="w-full bg-[#080B10] text-[#F4F7FA] border border-[#202A35] rounded-lg p-2.5 font-mono text-xs pr-10 outline-none focus:border-[#38BDF8]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowResetPassword(!showResetPassword)}
                    className="absolute right-3 text-[#596574] hover:text-[#F4F7FA] transition"
                  >
                    {showResetPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setResetTargetUser(null)}
                  className="rounded-lg px-4 py-2 text-xs font-medium text-[#8D99A8] hover:text-[#F4F7FA]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isResetSubmitting}
                  className="rounded-lg bg-[#8B5CF6] hover:bg-[#8B5CF6]/90 px-5 py-2 text-xs font-bold text-white shadow flex items-center gap-2 font-mono transition"
                >
                  {isResetSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>Reset & Dispatch Email</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Admin User Portfolio Inspector Modal */}
      {inspectingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md overflow-y-auto">
          <div className="bg-[#0D1218] rounded-2xl w-full max-w-4xl p-6 space-y-5 relative border border-[#38BDF8]/40 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-[#202A35] pb-4">
              <div>
                <h3 className="text-lg font-extrabold text-[#F4F7FA] flex items-center gap-2 font-mono">
                  <Eye className="h-5 w-5 text-[#38BDF8]" /> Admin User Portfolio Inspection
                </h3>
                <p className="text-xs text-[#8D99A8]">
                  Viewing decrypted portfolio for: <strong className="text-[#F4F7FA]">{inspectingUser.name}</strong> ({inspectingUser.email})
                </p>
              </div>
              <button
                onClick={() => setInspectingUser(null)}
                className="text-[#8D99A8] hover:text-[#F4F7FA] rounded-lg p-1"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {isInspectingLoading ? (
              <div className="py-16 text-center space-y-3">
                <Loader2 className="h-8 w-8 animate-spin text-[#38BDF8] mx-auto" />
                <p className="text-xs text-[#8D99A8]">Decrypting user portfolio payload from MongoDB Cloud DB...</p>
              </div>
            ) : inspectingPortfolio ? (
              <div className="space-y-6">
                {/* User Portfolio Metrics Header */}
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
                    <span className="text-[#8D99A8] text-xs font-semibold block">Active Holdings Count</span>
                    <div className="text-xl font-bold font-mono text-[#38BDF8] mt-1">
                      {(inspectingPortfolio.holdings || []).length} Stocks
                    </div>
                  </div>
                </div>

                {/* User Owned Stock Holdings Table */}
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

                {/* User Watchlist Table - Only rendered if user actually has items in watchlist */}
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
