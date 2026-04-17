import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTransactionsTable1776282424551 implements MigrationInterface {
  name = 'CreateTransactionsTable1776282424551';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "transactions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "cardId" character varying NOT NULL, "type" character varying NOT NULL, "points" integer NOT NULL, "cashierTelegramId" bigint, "rewardId" character varying, "note" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_a219afd8dd77ed80f5a862f1db9" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_d1dac70b33bf7a903782df5b63" ON "transactions" ("cardId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ff9e67e892eddbf34d17df4355" ON "transactions" ("rewardId") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_ff9e67e892eddbf34d17df4355"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_d1dac70b33bf7a903782df5b63"`,
    );
    await queryRunner.query(`DROP TABLE "transactions"`);
  }
}
