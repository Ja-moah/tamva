import {
  bulkReadResultSchema,
  notificationPageSchema,
  notificationPreferencePageSchema,
  notificationPreferenceSchema,
  notificationSchema,
} from "@tamva/client-contracts";
import { z } from "zod";

import { apiRequest } from "../../lib/api";

type Query = Record<string, string | number | boolean | null | undefined>;

export const listNotifications = (query: Query, signal?: AbortSignal) =>
  apiRequest({ path: "/notifications/", query, schema: notificationPageSchema, signal });

export const markNotificationRead = (id: string) =>
  apiRequest({
    method: "POST",
    path: `/notifications/${id}/read/`,
    schema: z.object({ data: notificationSchema }),
  });

export const bulkMarkNotificationsRead = (ids: string[]) =>
  apiRequest({
    method: "POST",
    path: "/notifications/bulk-read/",
    body: { notification_ids: ids },
    schema: bulkReadResultSchema,
  });

export const listNotificationPreferences = (signal?: AbortSignal) =>
  apiRequest({
    path: "/notification-preferences/",
    query: { page_size: 100 },
    schema: notificationPreferencePageSchema,
    signal,
  });

export const setNotificationPreference = (input: { category: string; channel: string; enabled: boolean }) =>
  apiRequest({
    method: "POST",
    path: "/notification-preferences/",
    body: input,
    schema: z.object({ data: notificationPreferenceSchema }),
  });
