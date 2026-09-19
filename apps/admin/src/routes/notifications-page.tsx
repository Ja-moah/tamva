import type { NotificationItem } from "@tamva/client-contracts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { DataTable, Pagination, type DataColumn } from "../components/data/data-table";
import { FilterBar } from "../components/data/filter-bar";
import { PageHeader } from "../components/data/page";
import { EmptyState, QueryBoundary } from "../components/data/states";
import { StatusBadge } from "../components/feedback/status-badge";
import { Button } from "../components/ui/button";
import { DetailDrawer } from "../components/ui/detail-drawer";
import { useToast } from "../components/ui/toast";
import { useFormatters } from "../features/locale/use-locale";
import { useListState } from "../features/lists/use-list-state";
import { bulkMarkNotificationsRead, listNotifications, markNotificationRead } from "../features/notifications/api";
import { humanize } from "../lib/format";

const COLUMN_OPTIONS = [
  { key: "category", label: "Category" },
  { key: "channel", label: "Channel" },
  { key: "status", label: "Delivery" },
];

export function NotificationsPage() {
  const list = useListState({ ordering: "-created_at" });
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const fmt = useFormatters();
  const [open, setOpen] = useState<NotificationItem | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const notifications = useQuery({
    queryKey: ["notifications", "list", list.query],
    queryFn: ({ signal }) => listNotifications(list.query, signal),
    placeholderData: (previous) => previous,
  });
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["notifications"] });
  const markOne = useMutation({ mutationFn: markNotificationRead, onSuccess: refresh });
  const markMany = useMutation({
    mutationFn: bulkMarkNotificationsRead,
    onSuccess: (result) => {
      toast({ title: `${result.data.marked_read} marked as read`, type: "success" });
      setSelected(new Set());
      return refresh();
    },
  });

  const columns: DataColumn<NotificationItem>[] = [
    { key: "subject", header: "Notification", always: true, cell: (r) => <div className={r.read_at ? "" : "font-bold"}><p>{r.subject || humanize(r.category)}</p><p className="max-w-md truncate text-[var(--text-secondary)] font-normal">{r.body}</p></div> },
    { key: "category", header: "Category", cell: (r) => humanize(r.category) },
    { key: "channel", header: "Channel", sortKey: "channel", cell: (r) => humanize(r.channel) },
    { key: "status", header: "Delivery", sortKey: "state", cell: (r) => <StatusBadge size="sm" tone={r.status === "FAILED" ? "danger" : r.status === "SENT" ? "success" : "neutral"}>{humanize(r.status)}</StatusBadge> },
    { key: "read", header: "Read", cell: (r) => (r.read_at ? <span className="text-[var(--text-muted)]">Read</span> : <StatusBadge size="sm" tone="info">Unread</StatusBadge>) },
    { key: "created_at", header: "Received", sortKey: "created_at", always: true, cell: (r) => fmt.dateTime(r.created_at) },
  ];

  return (
    <div>
      <PageHeader eyebrow="Alerts" title="Notifications" description="Messages addressed to you. Preferences live in Settings." />
      <FilterBar resource="NOTIFICATIONS" list={list} columns={COLUMN_OPTIONS} selectedIds={[...selected]} allowExport={false}>
        {selected.size > 0 ? (
          <Button size="sm" variant="primary" loading={markMany.isPending} onClick={() => markMany.mutate([...selected])}>
            Mark {selected.size} as read
          </Button>
        ) : null}
      </FilterBar>
      <QueryBoundary query={notifications} isEmpty={(p) => p.count === 0} empty={<EmptyState title="You're all caught up">No notifications match these filters.</EmptyState>}>
        {(page) => (
          <>
            <DataTable
              caption="Notifications"
              columns={columns}
              rows={page.results}
              rowId={(r) => r.id}
              ordering={list.state.ordering}
              onOrderingChange={list.setOrdering}
              hidden={list.state.hidden}
              selected={selected}
              onSelectedChange={setSelected}
              onRowOpen={(r) => {
                setOpen(r);
                if (!r.read_at) markOne.mutate(r.id);
              }}
              isFetching={notifications.isFetching}
            />
            <Pagination page={list.state.page} pageSize={list.state.pageSize} count={page.count} onPage={list.setPage} onPageSize={list.setPageSize} />
          </>
        )}
      </QueryBoundary>
      <DetailDrawer open={open !== null} onClose={() => setOpen(null)} title={open?.subject || humanize(open?.category ?? "Notification")} subtitle={open ? fmt.dateTime(open.created_at) : undefined}>
        {open ? (
          <div className="space-y-3 text-sm">
            <p className="whitespace-pre-wrap">{open.body}</p>
            <p className="font-mono text-[10px] text-[var(--text-muted)]">{humanize(open.category)} · {humanize(open.channel)} · {humanize(open.status)}</p>
          </div>
        ) : null}
      </DetailDrawer>
    </div>
  );
}
