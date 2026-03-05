import { NextRequest, NextResponse } from "next/server";
import { getDashboardData } from "../metrics";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const data = await getDashboardData({
    area: searchParams.get("area") ?? undefined,
    phase: searchParams.get("phase") ?? undefined,
    priority: searchParams.get("priority") ?? undefined,
    period: searchParams.get("period") ?? undefined,
  });

  return NextResponse.json({
    filters: data.filters,
    portfolio: data.portfolio,
    summary: {
      total: data.portfolio.length,
      highAttention: data.committee.highAttentionProjects,
      highRisks: data.committee.highRisks,
      healthIndex: data.committee.healthIndex,
    },
  });
}
