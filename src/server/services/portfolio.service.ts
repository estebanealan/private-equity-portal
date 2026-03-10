import { listMovements } from "@/server/repositories/movement.repository";
import {
  getPortfolioAllocations,
  getPortfolioSnapshot,
} from "@/server/repositories/portfolio.repository";

export async function getClientPortfolio(clientProfileId: string) {
  const [snapshot, allocations, recentActivity] = await Promise.all([
    getPortfolioSnapshot(clientProfileId),
    getPortfolioAllocations(clientProfileId),
    listMovements(clientProfileId),
  ]);

  return {
    snapshot,
    allocations,
    recentActivity: recentActivity.slice(0, 5),
  };
}
