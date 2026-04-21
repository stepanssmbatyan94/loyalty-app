import { Injectable, UnprocessableEntityException, HttpStatus } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

import { BusinessesService } from '../businesses/businesses.service';
import { DashboardResponseDto } from './dto/dashboard-response.dto';

export type TopCustomerRow = {
  rank: number;
  customerId: number;
  firstName: string | null;
  lastName: string | null;
  totalPointsEarned: number;
  currentBalance: number;
};

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly businessesService: BusinessesService,
  ) {}

  private async resolveBusinessId(ownerId: number): Promise<string> {
    const business = await this.businessesService.findByOwnerId(ownerId);
    if (!business) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: { business: 'notFound' },
      });
    }
    return business.id;
  }

  async getDashboard(ownerId: number): Promise<DashboardResponseDto> {
    const businessId = await this.resolveBusinessId(ownerId);
    const todayUtc = new Date();
    todayUtc.setUTCHours(0, 0, 0, 0);

    const [customers, txToday, pointsSum, rewards] = await Promise.all([
      this.dataSource.query<[{ count: string }]>(
        `SELECT COUNT(DISTINCT "customerId") AS count
         FROM loyalty_cards
         WHERE "businessId" = $1`,
        [businessId],
      ),
      this.dataSource.query<[{ count: string }]>(
        `SELECT COUNT(*) AS count
         FROM transactions t
         JOIN loyalty_cards lc ON t."cardId"::uuid = lc.id
         WHERE lc."businessId" = $1 AND t."createdAt" >= $2`,
        [businessId, todayUtc],
      ),
      this.dataSource.query<[{ total: string }]>(
        `SELECT COALESCE(SUM("totalPointsEarned"), 0) AS total
         FROM loyalty_cards
         WHERE "businessId" = $1`,
        [businessId],
      ),
      this.dataSource.query<[{ count: string }]>(
        `SELECT COUNT(*) AS count
         FROM rewards
         WHERE "businessId" = $1 AND "isActive" = true AND "deletedAt" IS NULL`,
        [businessId],
      ),
    ]);

    return {
      totalCustomers: Number(customers[0].count),
      transactionsToday: Number(txToday[0].count),
      totalPointsIssuedAllTime: Number(pointsSum[0].total),
      activeRewards: Number(rewards[0].count),
    };
  }

  async getTopCustomers(
    ownerId: number,
    page: number,
    limit: number,
  ): Promise<{
    data: TopCustomerRow[];
    meta: { page: number; limit: number; total: number; hasNextPage: boolean };
  }> {
    const businessId = await this.resolveBusinessId(ownerId);
    const offset = (page - 1) * limit;

    const [rows, totalResult] = await Promise.all([
      this.dataSource.query<
        Array<{
          customerId: number;
          firstName: string | null;
          lastName: string | null;
          totalPointsEarned: string;
          currentBalance: string;
        }>
      >(
        `SELECT lc."customerId",
                u."firstName",
                u."lastName",
                lc."totalPointsEarned",
                lc.points AS "currentBalance"
         FROM loyalty_cards lc
         JOIN "user" u ON u.id = lc."customerId"
         WHERE lc."businessId" = $1
         ORDER BY lc."totalPointsEarned" DESC
         LIMIT $2 OFFSET $3`,
        [businessId, limit, offset],
      ),
      this.dataSource.query<[{ count: string }]>(
        `SELECT COUNT(*) AS count FROM loyalty_cards WHERE "businessId" = $1`,
        [businessId],
      ),
    ]);

    const total = Number(totalResult[0].count);
    const data: TopCustomerRow[] = rows.map((row, i) => ({
      rank: offset + i + 1,
      customerId: row.customerId,
      firstName: row.firstName,
      lastName: row.lastName,
      totalPointsEarned: Number(row.totalPointsEarned),
      currentBalance: Number(row.currentBalance),
    }));

    return {
      data,
      meta: { page, limit, total, hasNextPage: offset + limit < total },
    };
  }
}
