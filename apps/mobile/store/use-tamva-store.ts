export interface ConfidenceUser {
  initials: string;
  confidenceScore: number;
  scoreRating: string;
}

export interface BehavioralPillar {
  id: string;
  name: string;
  description: string;
  score: number;
  color: string;
}

const confidenceUser: ConfidenceUser = {
  initials: "JS",
  confidenceScore: 82,
  scoreRating: "Strong",
};

const confidencePillars: BehavioralPillar[] = [
  { id: "consistency", name: "Consistency", description: "Regular financial habits", score: 86, color: "#00d084" },
  { id: "resilience", name: "Resilience", description: "Capacity to absorb change", score: 79, color: "#75f0bd" },
  { id: "planning", name: "Planning", description: "Forward-looking money choices", score: 81, color: "#fbbf24" },
];

export function useTamvaStore() {
  return { user: confidenceUser, behavioralPillars: confidencePillars };
}
