import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateRedemptionsTable1776282684372 implements MigrationInterface {
  name = 'CreateRedemptionsTable1776282684372';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "redemptions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "cardId" character varying NOT NULL, "rewardId" character varying NOT NULL, "code" character varying(6) NOT NULL, "qrData" character varying NOT NULL, "pointsCost" integer NOT NULL, "status" character varying NOT NULL DEFAULT 'pending', "expiresAt" TIMESTAMP NOT NULL, "confirmedAt" TIMESTAMP, "cashierTelegramId" bigint, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_def143ab94376fea5985bb04219" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_40b719bef013a517c1795fe66e" ON "redemptions" ("cardId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ffd3fb3e7583a259ce2beecd15" ON "redemptions" ("rewardId") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_d95204b5f1c0f1a3f26247dbd0" ON "redemptions" ("code") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_56425c5ba630ac7743c58c2d16" ON "redemptions" ("expiresAt") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_56425c5ba630ac7743c58c2d16"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_d95204b5f1c0f1a3f26247dbd0"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_ffd3fb3e7583a259ce2beecd15"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_40b719bef013a517c1795fe66e"`,
    );
    await queryRunner.query(`DROP TABLE "redemptions"`);
  }
}
