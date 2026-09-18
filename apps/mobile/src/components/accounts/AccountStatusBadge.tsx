/**
 * TAMVA AccountStatusBadge Component
 *
 * Refined semantic status indicator badge for financial account connections:
 * - Connected: Green success tone with check-circle icon
 * - Syncing: Blue information tone with refresh-cw icon
 * - Action Required: Amber warning tone with alert-triangle icon
 * - Disconnected: Muted neutral tone with slash icon
 *
 * Sized with restrained padding and typography to prevent oversized pills.
 */

import React from 'react';
import { ViewStyle } from 'react-native';
import { Badge, BadgeTone, BadgeSize } from '../ui/Badge';
import { AccountConnectionStatus } from '../../types/accounts';
import { FeatherIconName } from '../../constants/icons';

export interface AccountStatusBadgeProps {
  status: AccountConnectionStatus;
  size?: BadgeSize;
  style?: ViewStyle;
}

interface StatusConfig {
  label: string;
  tone: BadgeTone;
  icon: FeatherIconName;
  showDot: boolean;
}

const STATUS_CONFIG: Record<AccountConnectionStatus, StatusConfig> = {
  connected: {
    label: 'Connected',
    tone: 'success',
    icon: 'check-circle',
    showDot: false,
  },
  syncing: {
    label: 'Syncing',
    tone: 'information',
    icon: 'refresh-cw',
    showDot: false,
  },
  action_required: {
    label: 'Action Required',
    tone: 'warning',
    icon: 'alert-triangle',
    showDot: false,
  },
  disconnected: {
    label: 'Disconnected',
    tone: 'neutral',
    icon: 'slash',
    showDot: false,
  },
};

export const AccountStatusBadge: React.FC<AccountStatusBadgeProps> = ({
  status,
  size = 'md',
  style,
}) => {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.disconnected;

  return (
    <Badge
      label={config.label}
      tone={config.tone}
      size={size}
      icon={config.icon}
      showDot={config.showDot}
      style={style}
    />
  );
};
