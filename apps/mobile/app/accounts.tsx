/**
 * Connected accounts (live), with the bundled design available only in demo mode.
 */
import React from 'react';

import { ConnectionsLive } from '../src/components/live/ConnectionsLive';
import { FeatureGate } from '../src/components/ui/FeatureGate';
import { DEMO_MODE } from '../src/config/env';
import { DemoConsentScreen } from './(tabs)/consent';

export default function AccountsScreen() {
  return (
    <FeatureGate
      capability="customer_connections"
      wired
      showBack
      title="Connected accounts"
      description="Connected accounts aren't available from TAMVA right now."
    >
      {DEMO_MODE ? <DemoConsentScreen /> : <ConnectionsLive />}
    </FeatureGate>
  );
}
