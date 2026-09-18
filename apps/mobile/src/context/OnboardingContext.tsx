/**
 * TAMVA Onboarding Context
 *
 * Manages first-time user onboarding completion state and persistence.
 * Safe fallback: Defaults to showing onboarding if storage cannot be read.
 * Zero new dependencies: Uses web localStorage where available, with safe in-memory state.
 */

import React, {
  createContext,
  startTransition,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
} from 'react';

const STORAGE_KEY = 'tamva_onboarding_completed';

// In-memory persistence fallback across route transitions in current session
let inMemoryOnboardingCompleted = false;

interface OnboardingContextValue {
  hasCompletedOnboarding: boolean;
  isLoading: boolean;
  completeOnboarding: () => Promise<void>;
  resetOnboarding: () => Promise<void>;
}

const OnboardingContext = createContext<OnboardingContextValue | undefined>(
  undefined
);

export interface OnboardingProviderProps {
  children: ReactNode;
  initialCompleted?: boolean;
}

export const OnboardingProvider: React.FC<OnboardingProviderProps> = ({
  children,
  initialCompleted,
}) => {
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean>(
    initialCompleted ?? inMemoryOnboardingCompleted
  );
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize storage check safely on mount
  useEffect(() => {
    let isMounted = true;

    try {
      if (initialCompleted !== undefined) {
        if (isMounted) {
          startTransition(() => {
            setHasCompletedOnboarding(initialCompleted);
            setIsLoading(false);
          });
        }
        return;
      }

      // Check localStorage if available (Web / hybrid runtimes)
      if (typeof window !== 'undefined' && window.localStorage) {
        const stored = window.localStorage.getItem(STORAGE_KEY);
        if (stored === 'true') {
          inMemoryOnboardingCompleted = true;
          if (isMounted) {
            startTransition(() => {
              setHasCompletedOnboarding(true);
              setIsLoading(false);
            });
          }
          return;
        }
      }

      // Use in-memory session state
      if (isMounted) {
        startTransition(() => {
          setHasCompletedOnboarding(inMemoryOnboardingCompleted);
          setIsLoading(false);
        });
      }
    } catch {
      // Safe fallback: default to showing onboarding on read error
      if (isMounted) {
        startTransition(() => {
          setHasCompletedOnboarding(false);
          setIsLoading(false);
        });
      }
    }

    return () => {
      isMounted = false;
    };
  }, [initialCompleted]);

  const completeOnboarding = useCallback(async () => {
    try {
      inMemoryOnboardingCompleted = true;
      setHasCompletedOnboarding(true);

      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(STORAGE_KEY, 'true');
      }
    } catch {
      // Non-blocking fallback
      setHasCompletedOnboarding(true);
    }
  }, []);

  const resetOnboarding = useCallback(async () => {
    try {
      inMemoryOnboardingCompleted = false;
      setHasCompletedOnboarding(false);

      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      setHasCompletedOnboarding(false);
    }
  }, []);

  const value = useMemo(
    () => ({
      hasCompletedOnboarding,
      isLoading,
      completeOnboarding,
      resetOnboarding,
    }),
    [hasCompletedOnboarding, isLoading, completeOnboarding, resetOnboarding]
  );

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
};

export function useOnboarding(): OnboardingContextValue {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
}
