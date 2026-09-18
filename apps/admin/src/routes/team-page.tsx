import {
  Check,
  Key,
  Lock,
  Search,
  Trash2,
  UserCheck,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";

import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { DeleteConfirmationModal } from "../components/ui/delete-confirmation-modal";
import { useToast } from "../components/ui/toast";

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: "Administrator" | "Risk Analyst" | "Investigator" | "Viewer";
  accessScope: string;
  mfa: "Enabled" | "Pending";
  lastActive: string;
  status: "Active" | "Pending";
}

const initialMembers: TeamMember[] = [
  {
    id: "usr-01",
    name: "Ama Mensah",
    email: "ama.mensah@partnerbank.com.gh",
    role: "Administrator",
    accessScope: "Full Institution",
    mfa: "Enabled",
    lastActive: "2 mins ago",
    status: "Active",
  },
  {
    id: "usr-02",
    name: "Kwame Owusu",
    email: "kwame.owusu@partnerbank.com.gh",
    role: "Risk Analyst",
    accessScope: "Risk + Cases",
    mfa: "Enabled",
    lastActive: "12 mins ago",
    status: "Active",
  },
  {
    id: "usr-03",
    name: "Efua Asante",
    email: "efua.asante@partnerbank.com.gh",
    role: "Investigator",
    accessScope: "Cases + Customers",
    mfa: "Enabled",
    lastActive: "1 hour ago",
    status: "Active",
  },
  {
    id: "usr-04",
    name: "Kojo Mensah",
    email: "kojo.mensah@partnerbank.com.gh",
    role: "Viewer",
    accessScope: "Analytics Read Only",
    mfa: "Pending",
    lastActive: "Yesterday",
    status: "Active",
  },
  {
    id: "usr-05",
    name: "Nana Yaa",
    email: "nana.yaa@partnerbank.com.gh",
    role: "Risk Analyst",
    accessScope: "Risk + Network",
    mfa: "Enabled",
    lastActive: "3 days ago",
    status: "Active",
  },
  {
    id: "usr-06",
    name: "Kofi Boateng",
    email: "kofi.boateng@partnerbank.com.gh",
    role: "Investigator",
    accessScope: "Cases Queue",
    mfa: "Pending",
    lastActive: "Never",
    status: "Pending",
  },
];

const permissionMatrix = [
  {
    permission: "View customer financial profiles",
    admin: true,
    analyst: true,
    investigator: true,
    viewer: false,
  },
  {
    permission: "View and filter risk events",
    admin: true,
    analyst: true,
    investigator: true,
    viewer: true,
  },
  {
    permission: "Manage and escalate cases",
    admin: true,
    analyst: true,
    investigator: true,
    viewer: false,
  },
  {
    permission: "Access network intelligence graph",
    admin: true,
    analyst: true,
    investigator: false,
    viewer: false,
  },
  {
    permission: "Generate & rotate API credentials",
    admin: true,
    analyst: false,
    investigator: false,
    viewer: false,
  },
  {
    permission: "Manage team roles & MFA policy",
    admin: true,
    analyst: false,
    investigator: false,
    viewer: false,
  },
  {
    permission: "Configure security & governance settings",
    admin: true,
    analyst: false,
    investigator: false,
    viewer: false,
  },
];

const recentAccessChanges = [
  {
    id: "acc-01",
    event: "Role Promoted",
    desc: "Kwame Owusu promoted from Investigator to Risk Analyst",
    time: "2 hours ago",
    actor: "Ama Mensah (Admin)",
  },
  {
    id: "acc-02",
    event: "Invitation Accepted",
    desc: "Efua Asante completed MFA setup and joined Risk Operations",
    time: "Yesterday",
    actor: "System",
  },
  {
    id: "acc-03",
    event: "Privileged Access Granted",
    desc: "API rotation permissions temporarily assigned to Ama Mensah",
    time: "2 days ago",
    actor: "Security Officer",
  },
];

export function TeamPage() {
  const [members, setMembers] = useState<TeamMember[]>(initialMembers);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [deleteModalState, setDeleteModalState] = useState<{
    open: boolean;
    isBulk: boolean;
    item?: TeamMember;
  }>({ open: false, isBulk: false });

  const [inviteForm, setInviteForm] = useState({
    name: "",
    email: "",
    role: "Risk Analyst" as TeamMember["role"],
    accessScope: "Risk + Cases",
  });

  const { toast } = useToast();

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredMembers.map((m) => m.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const handleConfirmDelete = () => {
    if (deleteModalState.isBulk) {
      setMembers((prev) => prev.filter((m) => !selectedIds.includes(m.id)));
      toast({
        title: "Team Members Removed",
        description: `Successfully deleted ${selectedIds.length} team members from institutional workspace.`,
        type: "info",
      });
      setSelectedIds([]);
    } else if (deleteModalState.item) {
      setMembers((prev) => prev.filter((m) => m.id !== deleteModalState.item?.id));
      toast({
        title: "Team Member Removed",
        description: `Successfully deleted ${deleteModalState.item.name} (${deleteModalState.item.email}).`,
        type: "info",
      });
    }
  };

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteForm.name || !inviteForm.email) return;

    const newMember: TeamMember = {
      id: `usr-${Math.floor(10 + Math.random() * 90)}`,
      name: inviteForm.name,
      email: inviteForm.email,
      role: inviteForm.role,
      accessScope: inviteForm.accessScope,
      mfa: "Pending",
      lastActive: "Never",
      status: "Pending",
    };

    setMembers((prev) => [newMember, ...prev]);
    setIsInviteModalOpen(false);
    setInviteForm({ name: "", email: "", role: "Risk Analyst", accessScope: "Risk + Cases" });
    toast({
      title: "Invitation Dispatched",
      description: `Sent institutional onboarding invite to ${newMember.email}`,
      type: "success",
    });
  };

  const filteredMembers = members.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === "ALL" || m.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-7">
      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        open={deleteModalState.open}
        onClose={() => setDeleteModalState({ open: false, isBulk: false })}
        onConfirm={handleConfirmDelete}
        isBulk={deleteModalState.isBulk}
        itemCount={selectedIds.length}
        itemName={deleteModalState.item?.name}
      />

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-[var(--border-subtle)]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)]">
            Team &amp; Access Management
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-0.5 font-medium">
            Manage your team, assign roles, enforce MFA, and control least-privilege access.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsInviteModalOpen(true)}
            className="gap-2 font-bold text-xs cursor-pointer shadow-sm"
          >
            <UserPlus className="size-3.5" />
            <span>Invite Member</span>
          </Button>
        </div>
      </div>

      {/* Top 4 Metrics Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4.5 bg-[var(--bg-surface-elevated)] border-[var(--border-default)]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Team Members
            </span>
            <Users className="size-4 text-[var(--accent-gold)]" />
          </div>
          <p className="mt-2 text-2xl font-extrabold text-[var(--text-primary)] font-mono">
            {members.length}
          </p>
          <p className="text-xs text-emerald-500 font-bold mt-1">+2 this month</p>
        </Card>

        <Card className="p-4.5 bg-[var(--bg-surface-elevated)] border-[var(--border-default)]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Admins &amp; Privileged
            </span>
            <Key className="size-4 text-amber-500" />
          </div>
          <p className="mt-2 text-2xl font-extrabold text-amber-500 font-mono">
            {members.filter((m) => m.role === "Administrator").length}
          </p>
          <p className="text-xs text-[var(--text-muted)] mt-1">Full Scope Access</p>
        </Card>

        <Card className="p-4.5 bg-[var(--bg-surface-elevated)] border-[var(--border-default)]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Standard Operations
            </span>
            <UserCheck className="size-4 text-sky-500" />
          </div>
          <p className="mt-2 text-2xl font-extrabold text-[var(--text-primary)] font-mono">
            {members.filter((m) => m.role !== "Administrator").length}
          </p>
          <p className="text-xs text-emerald-500 font-bold mt-1">100% RBAC Scoped</p>
        </Card>

        <Card className="p-4.5 bg-[var(--bg-surface-elevated)] border-[var(--border-default)]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Pending Invites
            </span>
            <Lock className="size-4 text-rose-500" />
          </div>
          <p className="mt-2 text-2xl font-extrabold text-rose-500 font-mono">
            {members.filter((m) => m.status === "Pending").length}
          </p>
          <p className="text-xs text-[var(--text-muted)] mt-1">Awaiting MFA Setup</p>
        </Card>
      </div>

      {/* Team Directory Table with Selection & Bulk Delete */}
      <Card className="overflow-hidden bg-[var(--bg-surface-elevated)] border-[var(--border-default)]">
        {/* Controls Bar */}
        <div className="p-4 border-b border-[var(--border-subtle)] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-[240px]">
            <div className="relative flex-1 max-w-md">
              <Search className="size-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search team by name or email..."
                className="w-full rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-default)] pl-9 pr-4 py-2 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-gold)]"
              />
            </div>

            {/* Role Filter Chips */}
            <div className="hidden md:flex items-center gap-1 bg-[var(--bg-canvas)] p-1 rounded-xl border border-[var(--border-default)] text-xs font-bold">
              {["ALL", "Administrator", "Risk Analyst", "Investigator", "Viewer"].map((r) => (
                <button
                  key={r}
                  onClick={() => setRoleFilter(r)}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    roleFilter === r
                      ? "bg-[var(--accent-gold)] text-black font-extrabold shadow-xs"
                      : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  {r === "ALL" ? "All" : r}
                </button>
              ))}
            </div>
          </div>

          {/* Bulk Action Controls */}
          {selectedIds.length > 0 && (
            <div className="flex items-center gap-2 animate-in fade-in">
              <span className="text-xs font-mono font-bold text-[var(--accent-gold)]">
                {selectedIds.length} selected
              </span>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setDeleteModalState({ open: true, isBulk: true })}
                className="bg-rose-600 hover:bg-rose-700 text-white gap-1.5 text-xs font-bold cursor-pointer"
              >
                <Trash2 className="size-3.5" />
                <span>Bulk Delete ({selectedIds.length})</span>
              </Button>
            </div>
          )}
        </div>

        {/* Table View */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-[var(--border-default)] bg-[var(--bg-canvas)] font-mono uppercase text-[var(--text-muted)]">
              <tr>
                <th className="px-4 py-3 w-8">
                  <input
                    type="checkbox"
                    checked={selectedIds.length > 0 && selectedIds.length === filteredMembers.length}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded border-[var(--border-default)] cursor-pointer"
                  />
                </th>
                <th className="px-4 py-3">Member</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Access Scope</th>
                <th className="px-4 py-3">MFA Status</th>
                <th className="px-4 py-3">Last Active</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)]">
              {filteredMembers.map((member) => {
                const isSelected = selectedIds.includes(member.id);
                return (
                  <tr
                    key={member.id}
                    className={`hover:bg-[var(--bg-canvas)] transition-colors ${
                      isSelected ? "bg-[var(--accent-gold-subtle)]/20" : ""
                    }`}
                  >
                    <td className="px-4 py-3.5">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelect(member.id)}
                        className="rounded border-[var(--border-default)] cursor-pointer"
                      />
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="font-bold text-sm text-[var(--text-primary)]">{member.name}</p>
                      <p className="text-[11px] text-[var(--text-muted)] font-mono">{member.email}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="font-bold px-2 py-0.5 rounded bg-[var(--bg-canvas)] border border-[var(--border-default)] text-[var(--text-primary)]">
                        {member.role}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-[var(--text-secondary)]">
                      {member.accessScope}
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1 font-mono text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          member.mfa === "Enabled"
                            ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                            : "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                        }`}
                      >
                        {member.mfa}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-[var(--text-muted)]">
                      {member.lastActive}
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          member.status === "Active"
                            ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                            : "bg-slate-500/10 text-slate-400 border border-slate-500/20"
                        }`}
                      >
                        {member.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <button
                        onClick={() =>
                          setDeleteModalState({ open: true, isBulk: false, item: member })
                        }
                        className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                        title="Delete member"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Role & Permission Matrix */}
      <Card className="p-5 bg-[var(--bg-surface-elevated)] border-[var(--border-default)]">
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)] mb-4">
          <div>
            <h3 className="text-base font-bold text-[var(--text-primary)]">
              Role &amp; Permission Matrix
            </h3>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Enforced at backend middleware and UI route guard levels
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-emerald-500">
            RBAC Enforced
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-[var(--border-default)] bg-[var(--bg-canvas)] font-mono uppercase text-[var(--text-muted)]">
              <tr>
                <th className="px-4 py-3">Permission Description</th>
                <th className="px-4 py-3 text-center">Admin</th>
                <th className="px-4 py-3 text-center">Risk Analyst</th>
                <th className="px-4 py-3 text-center">Investigator</th>
                <th className="px-4 py-3 text-center">Viewer</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)]">
              {permissionMatrix.map((row) => (
                <tr key={row.permission} className="hover:bg-[var(--bg-canvas)]">
                  <td className="px-4 py-3 font-semibold text-[var(--text-primary)]">
                    {row.permission}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {row.admin ? (
                      <Check className="size-4 text-emerald-500 mx-auto" />
                    ) : (
                      <span className="text-[var(--text-muted)]">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {row.analyst ? (
                      <Check className="size-4 text-emerald-500 mx-auto" />
                    ) : (
                      <span className="text-[var(--text-muted)]">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {row.investigator ? (
                      <Check className="size-4 text-emerald-500 mx-auto" />
                    ) : (
                      <span className="text-[var(--text-muted)]">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {row.viewer ? (
                      <Check className="size-4 text-emerald-500 mx-auto" />
                    ) : (
                      <span className="text-[var(--text-muted)]">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Recent Access Changes */}
      <Card className="p-5 bg-[var(--bg-surface-elevated)] border-[var(--border-default)]">
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)] mb-4">
          <div>
            <h3 className="text-base font-bold text-[var(--text-primary)]">
              Recent Access Changes
            </h3>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Audited modifications to institutional roles, invitations, and privileged scopes
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-[var(--accent-gold)]">
            Audit Log Stream
          </span>
        </div>

        <div className="space-y-3">
          {recentAccessChanges.map((item) => (
            <div
              key={item.id}
              className="p-3 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-subtle)] flex items-center justify-between text-xs"
            >
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[var(--text-primary)]">{item.event}</span>
                  <span className="text-[10px] font-mono text-[var(--text-muted)]">&bull; {item.time}</span>
                </div>
                <p className="text-[var(--text-secondary)] font-medium">{item.desc}</p>
              </div>
              <span className="font-mono text-[10px] font-bold text-[var(--text-muted)] bg-[var(--bg-surface-subtle)] px-2 py-1 rounded">
                By: {item.actor}
              </span>
            </div>
          ))}
        </div>
      </Card>

      {/* Invite Member Modal */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-2xl bg-[var(--bg-surface-elevated)] border border-[var(--border-default)] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
              <h3 className="text-lg font-bold text-[var(--text-primary)]">Invite Team Member</h3>
              <button
                onClick={() => setIsInviteModalOpen(false)}
                className="p-1 rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-canvas)] cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <label className="block text-xs font-mono font-bold uppercase text-[var(--text-muted)] mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Yaw Boateng"
                  value={inviteForm.name}
                  onChange={(e) => setInviteForm({ ...inviteForm, name: e.target.value })}
                  className="w-full rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-default)] px-3.5 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-gold)]"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-bold uppercase text-[var(--text-muted)] mb-1">
                  Institutional Email
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. yaw.boateng@partnerbank.com.gh"
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                  className="w-full rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-default)] px-3.5 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-gold)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono font-bold uppercase text-[var(--text-muted)] mb-1">
                    Assigned Role
                  </label>
                  <select
                    value={inviteForm.role}
                    onChange={(e) =>
                      setInviteForm({ ...inviteForm, role: e.target.value as TeamMember["role"] })
                    }
                    className="w-full rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-default)] px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none"
                  >
                    <option value="Risk Analyst">Risk Analyst</option>
                    <option value="Investigator">Investigator</option>
                    <option value="Administrator">Administrator</option>
                    <option value="Viewer">Viewer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold uppercase text-[var(--text-muted)] mb-1">
                    Access Scope
                  </label>
                  <select
                    value={inviteForm.accessScope}
                    onChange={(e) => setInviteForm({ ...inviteForm, accessScope: e.target.value })}
                    className="w-full rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-default)] px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none"
                  >
                    <option value="Risk + Cases">Risk + Cases</option>
                    <option value="Cases + Customers">Cases + Customers</option>
                    <option value="Full Institution">Full Institution</option>
                    <option value="Analytics Read Only">Analytics Read Only</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[var(--border-subtle)]">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsInviteModalOpen(false)}
                  className="cursor-pointer"
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" className="font-bold cursor-pointer">
                  Send Invitation
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
