import React from 'react';

import { FeatureGate, type FeatureGateProps } from './FeatureGate';

/**
 * Gates one screen (not the navigator around it), so an unavailable screen
 * still has the tab bar and back navigation around it.
 */
export function withFeatureGate<P extends object>(
  Screen: React.ComponentType<P>,
  gate: Omit<FeatureGateProps, 'children'>
): React.FC<P> {
  const Gated: React.FC<P> = (props) => (
    <FeatureGate {...gate}>
      <Screen {...props} />
    </FeatureGate>
  );
  Gated.displayName = `Gated(${Screen.displayName ?? Screen.name ?? 'Screen'})`;
  return Gated;
}
