import { useMemo } from 'react';

import { makeFormatters, type Formatters } from './format';

export function useFormatters(): Formatters {
  return useMemo(() => makeFormatters(), []);
}
