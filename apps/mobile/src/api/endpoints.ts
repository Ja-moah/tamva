import {
  actorContextEnvelopeSchema,
  bulkReadResultSchema,
  capabilitiesResponseSchema,
  consentEnvelopeSchema,
  consentPageSchema,
  notificationPageSchema,
  notificationPreferencePageSchema,
  notificationPreferenceEnvelopeSchema,
  notificationEnvelopeSchema,
  versionSchema,
  type ActorContext,
  type CapabilitiesResponse,
  type VersionInfo,
  type Consent,
  type NotificationItem,
  type NotificationPreference,
  type Paginated,
  type BulkReadResult,
} from '@tamva/client-contracts';

import { apiClient } from './client';

export const getMe = async (signal?: AbortSignal): Promise<ActorContext> =>
  (await apiClient.request({ path: '/me/', schema: actorContextEnvelopeSchema, signal })).data;

export async function login(identifier: string, password: string): Promise<ActorContext> {
  const result = await apiClient.request({
    method: 'POST',
    path: '/auth/login/',
    body: { identifier, password },
    schema: actorContextEnvelopeSchema,
  });
  return result.data;
}

export const logout = async (): Promise<void> => {
  await apiClient.requestVoid({ method: 'POST', path: '/auth/logout/' });
};

export const getCapabilities = async (signal?: AbortSignal): Promise<CapabilitiesResponse['data']> =>
  (await apiClient.request({ path: '/capabilities/', schema: capabilitiesResponseSchema, signal })).data;

export const getVersion = async (signal?: AbortSignal): Promise<VersionInfo> =>
  (await apiClient.request({ path: '/meta/version/', schema: versionSchema, signal })).data;

// ---- notifications (a customer only ever sees their own)
export const listNotifications = (
  query: Record<string, string | number | boolean | undefined> = {},
  signal?: AbortSignal
) => apiClient.request({ path: '/notifications/', query, schema: notificationPageSchema, signal });

export const markNotificationRead = async (id: string): Promise<NotificationItem> =>
  (
    await apiClient.request({
      method: 'POST',
      path: `/notifications/${id}/read/`,
      schema: notificationEnvelopeSchema,
    })
  ).data;

export const markNotificationsRead = async (ids: string[]): Promise<BulkReadResult> =>
  (
    await apiClient.request({
      method: 'POST',
      path: '/notifications/bulk-read/',
      body: { notification_ids: ids },
      schema: bulkReadResultSchema,
    })
  ).data;

export const listNotificationPreferences = (signal?: AbortSignal): Promise<Paginated<NotificationPreference>> =>
  apiClient.request({
    path: '/notification-preferences/',
    query: { page_size: 100 },
    schema: notificationPreferencePageSchema,
    signal,
  });

export const setNotificationPreference = async (input: {
  category: string;
  channel: string;
  enabled: boolean;
}): Promise<NotificationPreference> =>
  (
    await apiClient.request({
      method: 'POST',
      path: '/notification-preferences/',
      body: input,
      schema: notificationPreferenceEnvelopeSchema,
    })
  ).data;

// ---- consent (list and revoke; granting needs an institution/purpose catalog)
export const listConsents = (signal?: AbortSignal): Promise<Paginated<Consent>> =>
  apiClient.request({ path: '/consents/', query: { page_size: 100 }, schema: consentPageSchema, signal });

export const revokeConsent = async (id: string): Promise<Consent> =>
  (
    await apiClient.request({
      method: 'POST',
      path: `/consents/${id}/revoke/`,
      schema: consentEnvelopeSchema,
    })
  ).data;
