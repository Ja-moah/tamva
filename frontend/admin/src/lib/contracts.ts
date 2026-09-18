import { z } from "zod";

export const healthResponseSchema = z.object({
  status: z.literal("ok"),
  database: z.literal("ok"),
});

export type HealthResponse = z.infer<typeof healthResponseSchema>;

export const currencyInfoSchema = z.object({
  code: z.string(),
  name: z.string(),
  symbol: z.string(),
  flag: z.string(),
  baseRateToGHS: z.number(),
  change24h: z.number(),
  region: z.string(),
});

export type CurrencyInfo = z.infer<typeof currencyInfoSchema>;

export const currencyRatesResponseSchema = z.object({
  source: z.string(),
  timestamp: z.string(),
  baseCurrency: z.string(),
  currencies: z.array(currencyInfoSchema),
  railFees: z.record(
    z.string(),
    z.object({
      name: z.string(),
      feePercent: z.number(),
      settlementSpeed: z.string(),
    }),
  ),
});

export type CurrencyRatesResponse = z.infer<typeof currencyRatesResponseSchema>;

export const currencyConvertResponseSchema = z.object({
  fromCurrency: z.string(),
  toCurrency: z.string(),
  amount: z.number(),
  exchangeRate: z.number(),
  convertedAmount: z.number(),
  formattedConverted: z.string(),
  railEstimates: z.record(
    z.string(),
    z.object({
      railName: z.string(),
      feePercent: z.number(),
      feeAmount: z.number(),
      netSettledAmount: z.number(),
      settlementSpeed: z.string(),
    }),
  ),
  timestamp: z.string(),
});

export type CurrencyConvertResponse = z.infer<typeof currencyConvertResponseSchema>;

export const apiErrorEnvelopeSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    request_id: z.string(),
    details: z.unknown(),
  }),
});

export type ApiErrorEnvelope = z.infer<typeof apiErrorEnvelopeSchema>;
