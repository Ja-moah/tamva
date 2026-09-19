import {
  applicationEnvelopeSchema,
  applicationPageSchema,
  connectionPageSchema,
  credentialEnvelopeSchema,
  environmentEnvelopeSchema,
  issuedCredentialSchema,
  scopesEnvelopeSchema,
  webhookEnvelopeSchema,
} from "@tamva/client-contracts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiRequest } from "../../lib/api";

export const useApplications = () =>
  useQuery({
    queryKey: ["integrations", "applications"],
    queryFn: ({ signal }) => apiRequest({ path: "/integrations/applications/", query: { page_size: 100 }, schema: applicationPageSchema, signal }),
    select: (page) => page.results,
  });

export const useScopes = () =>
  useQuery({
    queryKey: ["integrations", "scopes"],
    queryFn: ({ signal }) => apiRequest({ path: "/integrations/scopes/", schema: scopesEnvelopeSchema, signal }),
    select: (e) => e.data,
    staleTime: 5 * 60_000,
  });

export const useConnections = (query: Record<string, string | number>) =>
  useQuery({
    queryKey: ["integrations", "connections", query],
    queryFn: ({ signal }) => apiRequest({ path: "/integrations/connections/", query, schema: connectionPageSchema, signal }),
    placeholderData: (previous) => previous,
  });

/** Write actions. Secrets come back once, from `issue` and `rotate`, and are never cached. */
export function useIntegrationActions() {
  const queryClient = useQueryClient();
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["integrations"] });
  return {
    createApplication: useMutation({
      mutationFn: (body: { name: string; slug: string; description: string }) =>
        apiRequest({ method: "POST", path: "/integrations/applications/", body, schema: applicationEnvelopeSchema }),
      onSuccess: refresh,
    }),
    addEnvironment: useMutation({
      mutationFn: (input: { applicationId: string; kind: string }) =>
        apiRequest({ method: "POST", path: `/integrations/applications/${input.applicationId}/environments/`, body: { kind: input.kind }, schema: environmentEnvelopeSchema }),
      onSuccess: refresh,
    }),
    issueCredential: useMutation({
      mutationFn: (input: { environmentId: string; name: string; scopes: string[] }) =>
        apiRequest({ method: "POST", path: `/integrations/environments/${input.environmentId}/credentials/`, body: { name: input.name, scopes: input.scopes }, schema: issuedCredentialSchema }),
      onSuccess: refresh,
      gcTime: 0,
    }),
    rotateCredential: useMutation({
      mutationFn: (credentialId: string) =>
        apiRequest({ method: "POST", path: `/integrations/credentials/${credentialId}/rotate/`, schema: issuedCredentialSchema }),
      onSuccess: refresh,
      gcTime: 0,
    }),
    revokeCredential: useMutation({
      mutationFn: (credentialId: string) =>
        apiRequest({ method: "POST", path: `/integrations/credentials/${credentialId}/revoke/`, schema: credentialEnvelopeSchema }),
      onSuccess: refresh,
    }),
    addWebhook: useMutation({
      mutationFn: (input: { environmentId: string; url: string; event_types: string[] }) =>
        apiRequest({ method: "POST", path: `/integrations/environments/${input.environmentId}/webhooks/`, body: { url: input.url, event_types: input.event_types }, schema: webhookEnvelopeSchema }),
      onSuccess: refresh,
    }),
  };
}
