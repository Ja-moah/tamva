/**
 * Connected accounts. There is no customer connections API yet, so outside
 * demo mode this shows an honest unavailable state; the bundled design is
 * only rendered in explicit demo mode.
 */
import React from 'react';

import { FeatureGate } from '../src/components/ui/FeatureGate';
import { DemoConsentScreen } from './(tabs)/consent';

export default function AccountsScreen() {
  return (
    <FeatureGate
      capability="customer_connections"
      wired={false}
      showBack
      title="Connected accounts"
      description="Linking and viewing accounts is not available from TAMVA yet."
      detail="Consent you have already granted is listed under Consent & data sharing."
    >
      <DemoConsentScreen />
    </FeatureGate>
  );
}
