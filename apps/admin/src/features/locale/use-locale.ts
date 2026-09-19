import { localeSettingsSchema, type LocaleSettings } from "@tamva/client-contracts";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import { apiRequest } from "../../lib/api";
import { makeFormatters, type Formatters } from "../../lib/format";
import { useSession } from "../session/use-session";

export const LOCALE_KEY = ["settings", "locale"] as const;

export const getLocaleSettings = async (signal?: AbortSignal): Promise<LocaleSettings> =>
  (await apiRequest({ path: "/institution/locale/", schema: localeSettingsSchema, signal })).data;

export function useLocaleSettings() {
  const { institutionId } = useSession();
  return useQuery({
    queryKey: [...LOCALE_KEY, institutionId],
    queryFn: ({ signal }) => getLocaleSettings(signal),
    enabled: institutionId !== null,
    staleTime: 10 * 60_000,
  });
}

/** Formatters in the institution's locale and timezone (UTC/en until it loads). */
export function useFormatters(): Formatters & { locale: string; timeZone: string; currency: string | null } {
  const { data } = useLocaleSettings();
  const locale = data?.locale ?? "en";
  const timeZone = data?.timezone ?? "UTC";
  const formatters = useMemo(() => makeFormatters(locale, timeZone), [locale, timeZone]);
  return { ...formatters, locale, timeZone, currency: data?.default_currency ?? null };
}
