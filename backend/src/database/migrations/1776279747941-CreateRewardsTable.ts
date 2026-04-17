import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateRewardsTable1776279747941 implements MigrationInterface {
  name = 'CreateRewardsTable1776279747941';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "rewards" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "businessId" character varying NOT NULL, "name" character varying NOT NULL, "description" character varying, "pointsCost" integer NOT NULL, "imageUrl" character varying, "isActive" boolean NOT NULL DEFAULT true, "stock" integer, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, CONSTRAINT "PK_3d947441a48debeb9b7366f8b8c" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_fef5462e98502631a6af028949" ON "rewards" ("businessId") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_fef5462e98502631a6af028949"`,
    );
    await queryRunner.query(`DROP TABLE "rewards"`);
  }
}
