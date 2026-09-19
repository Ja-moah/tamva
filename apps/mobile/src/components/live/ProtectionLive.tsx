import { useQuery } from '@tanstack/react-query';
import React from 'react';
import { Text } from 'react-native';

import { getSecuritySummary } from '../../api/customer';
import { useTheme } from '../../theme';
import { Card } from '../ui/Card';
import { ListRow } from '../ui/ListRow';
import { SectionHeader } from '../ui/SectionHeader';
import { QueryScreen } from './QueryScreen';
import { fmt, humanize } from './format';

/**
 * Protection: real signals only (new devices, unusual locations) plus consent and
 * Passport activity. Dark-web, breach and account-takeover detection are not
 * offered and are listed as such rather than shown as "clear".
 */
export function ProtectionLive() {
  const { theme } = useTheme();
  const query = useQuery({ queryKey: ['customer-security'], queryFn: ({ signal }) => getSecuritySummary(signal) });

  return (
    <QueryScreen title="Protection" subtitle="Signals about your accounts and devices" showBack query={query}>
      {(s) => (
        <>
          <SectionHeader title="Last 30 days" />
          <Card padding="none">
            <ListRow
              title="Security signals"
              subtitle={s.events_30d === 0 ? 'Nothing new' : Object.entries(s.by_category_30d).map(([k, n]) => `${n} ${humanize(k).toLowerCase()}`).join(' · ')}
              rightText={String(s.events_30d)}
            />
            <ListRow
              title="Latest signal"
              subtitle={s.latest_event ? `${humanize(s.latest_event.category)} · ${humanize(s.latest_event.severity)}` : 'None yet'}
              rightText={s.latest_event ? fmt.date(s.latest_event.occurred_at) : undefined}
              showDivider={false}
            />
          </Card>
          <SectionHeader title="Your devices and places" />
          <Card padding="none">
            <ListRow title="Devices TAMVA has seen" subtitle={`${s.devices.trusted} trusted · ${s.devices.flagged} flagged`} rightText={String(s.devices.known)} />
            <ListRow title="Countries seen" rightText={String(s.locations.countries_seen)} showDivider={false} />
          </Card>
          <SectionHeader title="Sharing" />
          <Card padding="none">
            <ListRow title="Active consents" rightText={String(s.active_consents)} />
            <ListRow title="Active Passport shares" rightText={String(s.active_passport_shares)} showDivider={false} />
          </Card>
          <Text style={[theme.typography.caption, { color: theme.colors.textTertiary }]}>
            TAMVA does not monitor the dark web, check for data breaches or detect account takeover. Signals here come from devices and locations reported by your institutions, so &quot;nothing new&quot; means nothing has been reported, not that nothing has happened.
          </Text>
        </>
      )}
    </QueryScreen>
  );
}
