/** Explicit demo-only fixtures for reviewing the Financial Confidence design. */
export const SCORE_HISTORY = [
  { month: 'Apr', score: 64 },
  { month: 'May', score: 68 },
  { month: 'Jun', score: 71 },
  { month: 'Jul', score: 75 },
  { month: 'Aug', score: 78 },
];

export const confidenceUser = {
  initials: 'JS',
  confidenceScore: 82,
  scoreRating: 'Strong',
};

export const confidencePillars = [
  { id: 'consistency', name: 'Consistency', description: 'Regular financial habits', score: 86, color: '#00d084' },
  { id: 'resilience', name: 'Resilience', description: 'Capacity to absorb change', score: 79, color: '#75f0bd' },
  { id: 'planning', name: 'Planning', description: 'Forward-looking money choices', score: 81, color: '#fbbf24' },
];
