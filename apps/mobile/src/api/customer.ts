/** Customer-owned resources. Every call is scoped to the signed-in customer by the backend. */
import {
  activityPageSchema,
  confidenceCurrentSchema,
  confidenceHistoryPageSchema,
  consentCatalogueSchema,
  consentEnvelopeSchema,
  consentPageSchema,
  customerConnectionEnvelopeSchema,
  customerConnectionPageSchema,
  customerHomeSchema,
  passportCurrentSchema,
  passportGenerateSchema,
  passportShareCreatedSchema,
  passportShareEnvelopeSchema,
  passportSharePageSchema,
  profileCurrentSchema,
  securitySummarySchema,
} from '@tamva/client-contracts';

import { apiClient } from './client';

type Query = Record<string, string | number | boolean | null | undefined>;
const post = { method: 'POST' as const };

export const getHome = async (signal?: AbortSignal) =>
  (await apiClient.request({ path: '/customer/home/', schema: customerHomeSchema, signal })).data;

export const listActivity = (query: Query, signal?: AbortSignal) =>
  apiClient.request({ path: '/customer/activity/', query, schema: activityPageSchema, signal });

export const getProfile = async (signal?: AbortSignal) =>
  (await apiClient.request({ path: '/customer/profile/current/', schema: profileCurrentSchema, signal })).data;

export const getConfidence = async (signal?: AbortSignal) =>
  (await apiClient.request({ path: '/customer/financial-confidence/current/', schema: confidenceCurrentSchema, signal })).data;

export const getConfidenceHistory = (signal?: AbortSignal) =>
  apiClient.request({
    path: '/customer/financial-confidence/history/',
    query: { page_size: 24 },
    schema: confidenceHistoryPageSchema,
    signal,
  });

export const listConnections = (signal?: AbortSignal) =>
  apiClient.request({ path: '/customer/connections/', query: { page_size: 100 }, schema: customerConnectionPageSchema, signal });

export const startConnection = async (body: {
  institution_id: string;
  provider: string;
  purpose_code: string;
  scope_code: string;
  external_reference: string;
}) =>
  (await apiClient.request({ ...post, path: '/customer/connections/', body, schema: customerConnectionEnvelopeSchema })).data;

export const disconnectConnection = async (id: string) =>
  (await apiClient.request({ ...post, path: `/customer/connections/${id}/disconnect/`, schema: customerConnectionEnvelopeSchema })).data;

export const getConsentCatalogue = async (signal?: AbortSignal) =>
  (await apiClient.request({ path: '/customer/consent/catalogue/', schema: consentCatalogueSchema, signal })).data;

export const listCustomerConsents = (signal?: AbortSignal) =>
  apiClient.request({ path: '/customer/consents/', query: { page_size: 100 }, schema: consentPageSchema, signal });

export const grantConsent = async (body: {
  institution_id: string;
  purpose_code: string;
  scope_codes: string[];
  expires_at: string;
}) => (await apiClient.request({ ...post, path: '/customer/consents/', body, schema: consentEnvelopeSchema })).data;

export const revokeCustomerConsent = async (id: string) =>
  (await apiClient.request({ ...post, path: `/customer/consents/${id}/revoke/`, schema: consentEnvelopeSchema })).data;

export const getPassport = async (signal?: AbortSignal) =>
  (await apiClient.request({ path: '/customer/passport/current/', schema: passportCurrentSchema, signal })).data;

export const generatePassport = async (institutionId: string) =>
  (
    await apiClient.request({
      ...post,
      path: '/customer/passport/generate/',
      body: { institution_id: institutionId },
      schema: passportGenerateSchema,
    })
  ).data;

export const listPassportShares = (signal?: AbortSignal) =>
  apiClient.request({ path: '/customer/passport/shares/', query: { page_size: 100 }, schema: passportSharePageSchema, signal });

export const createPassportShare = async (body: {
  issuer_institution_id: string;
  recipient_institution_id: string;
  purpose_code: string;
  allowed_sections: string[];
  expires_at: string;
}) => (await apiClient.request({ ...post, path: '/customer/passport/shares/', body, schema: passportShareCreatedSchema })).data;

export const revokePassportShare = async (id: string) =>
  (await apiClient.request({ ...post, path: `/customer/passport/shares/${id}/revoke/`, schema: passportShareEnvelopeSchema })).data;

export const getSecuritySummary = async (signal?: AbortSignal) =>
  (await apiClient.request({ path: '/customer/security/summary/', schema: securitySummarySchema, signal })).data;
