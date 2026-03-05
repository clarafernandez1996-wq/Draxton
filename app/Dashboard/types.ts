import { RagLevel } from "@prisma/client";

export type DashboardFilters = {
  area?: string;
  phase?: string;
  priority?: string;
  period?: string;
};

export type TrendPoint = {
  period: string;
  attentionHigh: number;
};

export type PortfolioRow = {
  projectId: string;
  project: string;
  area: string;
  owner: string;
  phase: string;
  plannedEnd: string;
  lastUpdate: string;
  priorityScore: number;
  planningRag: RagLevel;
  planningTrend: -1 | 0 | 1 | null;
  costRag: RagLevel;
  costTrend: -1 | 0 | 1 | null;
  progressPercent: number;
  progressTrend: -1 | 0 | 1 | null;
  riskRag: RagLevel;
  riskHigh: number;
  riskTotal: number;
  supplierRag: RagLevel;
  supplierName: string;
  attentionScore: number;
  motives: string[];
  attentionHigh: boolean;
  stale30d: boolean;
  anyRed: boolean;
  trend6m: Array<{ period: string; planning: RagLevel; cost: RagLevel; risk: RagLevel; attention: number }>;
  topHighRisks: Array<{ title: string; score: number }>;
  upcomingTasks: Array<{ title: string; due: string }>;
};

export type CommitteeMetrics = {
  healthIndex: number;
  riskPercent: number;
  highAttentionProjects: number;
  highRisks: number;
  ragByDimension: {
    planning: Record<RagLevel, number>;
    cost: Record<RagLevel, number>;
    risk: Record<RagLevel, number>;
  };
  trend6m: TrendPoint[];
  topAttention: PortfolioRow[];
  bubbles: Array<{ project: string; xProbability: number; yImpact: number; size: number; color: string }>;
  hygiene: {
    withOwnerPct: number;
    updated30dPct: number;
    withSnapshotPct: number;
  };
  alerts: Array<{ project: string; score: number; reasons: string[] }>;
};

export type DashboardData = {
  filters: Required<DashboardFilters>;
  portfolio: PortfolioRow[];
  committee: CommitteeMetrics;
};
