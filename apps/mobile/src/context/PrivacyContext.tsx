/**
 * TAMVA Privacy Context
 *
 * Provides application-wide state for masking sensitive financial data.
 * When enabled, all financial values (MoneyDisplay, MetricCard, TransactionRow)
 * dynamically switch between visible amounts and privacy placeholders.
 */

import React, { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react';
import { formatCurrency, maskCurrency, FormatCurrencyOptions } from '../utils/currency';

interface PrivacyContextValue {
  isPrivate: boolean;
  togglePrivacy: () => void;
  setPrivacy: (isPrivate: boolean) => void;
  /** The currency is required: amounts are shown in the currency they were recorded in. */
  formatAmount: (amount: number, options: FormatCurrencyOptions & { overridePrivate?: boolean }) => string;
}

const PrivacyContext = createContext<PrivacyContextValue | undefined>(undefined);

export interface PrivacyProviderProps {
  children: ReactNode;
  initialPrivate?: boolean;
}

export const PrivacyProvider: React.FC<PrivacyProviderProps> = ({
  children,
  initialPrivate = false,
}) => {
  const [isPrivate, setIsPrivate] = useState<boolean>(initialPrivate);

  const togglePrivacy = useCallback(() => {
    setIsPrivate((prev) => !prev);
  }, []);

  const setPrivacy = useCallback((val: boolean) => {
    setIsPrivate(val);
  }, []);

  const formatAmount = useCallback(
    (
      amount: number,
      options: FormatCurrencyOptions & { overridePrivate?: boolean }
    ): string => {
      const { overridePrivate, currency, ...rest } = options;
      const shouldMask = overridePrivate !== undefined ? overridePrivate : isPrivate;

      if (shouldMask) {
        return maskCurrency(currency);
      }

      return formatCurrency(amount, { currency, ...rest });
    },
    [isPrivate]
  );

  const value = useMemo(
    () => ({
      isPrivate,
      togglePrivacy,
      setPrivacy,
      formatAmount,
    }),
    [isPrivate, togglePrivacy, setPrivacy, formatAmount]
  );

  return <PrivacyContext.Provider value={value}>{children}</PrivacyContext.Provider>;
};

export function usePrivacy(): PrivacyContextValue {
  const context = useContext(PrivacyContext);
  if (!context) {
    throw new Error('usePrivacy must be used within a PrivacyProvider');
  }
  return context;
}
