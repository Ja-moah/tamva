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
  registrationEnvelopeSchema,
  tokenEnvelopeSchema,
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

/** Signs in with a bearer token pair; the client adopts the tokens. */
export async function login(identifier: string, password: string, deviceLabel = ''): Promise<void> {
  const result = await apiClient.request({
    method: 'POST',
    path: '/auth/token/',
    body: { identifier, password, device_label: deviceLabel },
    schema: tokenEnvelopeSchema,
    anonymous: true,
  });
  await apiClient.setTokens(result.data);
}

/** Ends the session server-side (revokes the token family), then forgets local tokens. */
export const logout = async (): Promise<void> => {
  const refresh = apiClient.getRefreshToken();
  try {
    await apiClient.requestVoid({
      method: 'POST',
      path: '/auth/token/revoke/',
      body: refresh ? { refresh_token: refresh } : {},
      anonymous: true,
    });
  } finally {
    await apiClient.clearTokens();
  }
};

export const register = async (input: {
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
}) =>
  (
    await apiClient.request({
      method: 'POST',
      path: '/customer/register/',
      body: { ...input, accepted_terms: true },
      schema: registrationEnvelopeSchema,
      anonymous: true,
    })
  ).data;

export const requestRecovery = async (email: string): Promise<void> => {
  await apiClient.requestVoid({ method: 'POST', path: '/auth/recovery/request/', body: { email }, anonymous: true });
};

export const confirmRecovery = async (token: string, newPassword: string): Promise<void> => {
  await apiClient.requestVoid({
    method: 'POST',
    path: '/auth/recovery/confirm/',
    body: { token, new_password: newPassword },
    anonymous: true,
  });
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
