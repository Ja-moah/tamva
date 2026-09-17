/**
 * TAMVA Financial Protection Status Evaluation Utility
 *
 * Pure deterministic logic evaluating overall Protection status
 * from underlying account connection states and analytical signals.
 * Guarantees that the dashboard never falsely claims "Protected"
 * when underlying attention, disconnection, or access review is required.
 */

import {
  ProtectionStatus,
  ProtectionSignal,
  ProtectionAccountDetail,
  ProtectionAccountSummary,
} from '../types/protection';

export interface ProtectionStatusEvaluation {
  status: ProtectionStatus;
  statusLabel: string;
  statusDescription: string;
}

export function evaluateProtectionStatus(
  signals: ProtectionSignal[],
  accounts: ProtectionAccountDetail[],
  summary?: ProtectionAccountSummary,
  isExplicitlyUnavailable: boolean = false
): ProtectionStatusEvaluation {
  // 1. Explicitly unavailable or zero accounts
  if (isExplicitlyUnavailable) {
    return {
      status: 'unavailable',
      statusLabel: 'Protection unavailable',
      statusDescription:
        'Protection signals cannot be evaluated from the available data.\nCheck your account connections or try again later.',
    };
  }

  // 2. Attention needed: Any account with attention or disconnected, or signal with attention
  const hasAccountAttention = accounts.some(
    (acc) => acc.connectionStatus === 'attention'
  );
  const hasDisconnectedAccount = accounts.some(
    (acc) => acc.connectionStatus === 'disconnected'
  );
  const hasSignalAttention = signals.some(
    (sig) => sig.status === 'attention'
  );
  const summaryHasAttention = summary
    ? summary.attentionRequired > 0 || summary.disconnected > 0
    : false;

  if (
    hasAccountAttention ||
    hasDisconnectedAccount ||
    hasSignalAttention ||
    summaryHasAttention
  ) {
    return {
      status: 'attention',
      statusLabel: 'Attention needed',
      statusDescription:
        'One or more protection settings may need your review.\nBased on your latest consented financial data.',
    };
  }

  // 3. Monitoring (Limited coverage or neutral signals)
  const hasNeutralSignals = signals.some((sig) => sig.status === 'neutral');
  if (hasNeutralSignals || accounts.length < 3) {
    return {
      status: 'monitoring',
      statusLabel: 'Monitoring',
      statusDescription:
        'TAMVA is monitoring the latest consented data available.\nAdditional account connections can improve coverage.',
    };
  }

  // 4. Fully protected baseline
  return {
    status: 'protected',
    statusLabel: 'Protected',
    statusDescription:
      'No immediate protection actions are required.\nBased on your latest consented financial data.',
  };
}
