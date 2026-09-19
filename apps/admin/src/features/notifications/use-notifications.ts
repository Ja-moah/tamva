import { useQuery } from "@tanstack/react-query";

import { useSession } from "../session/use-session";
import { listNotifications } from "./api";

/** Real unread count for the bell; 0 while loading or if the call fails. */
export function useUnreadNotificationCount(): number {
  const { status, institutionId } = useSession();
  const query = useQuery({
    queryKey: ["notifications", "unread-count", institutionId],
    queryFn: ({ signal }) => listNotifications({ unread: "true", page_size: 1 }, signal),
    enabled: status === "authenticated",
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
  return query.data?.count ?? 0;
}
