import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateScanTokensTable1776726611344 implements MigrationInterface {
  name = 'CreateScanTokensTable1776726611344';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "scan_tokens" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "cardId" character varying NOT NULL, "businessId" character varying NOT NULL, "token" character varying(32) NOT NULL, "expiresAt" TIMESTAMP NOT NULL, "usedAt" TIMESTAMP, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_f79de6def937e4716976e2bfba4" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_2a9a952bd91f6ef281c992d502" ON "scan_tokens" ("cardId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_5e1d4c1d1bf73ee0ca20fc4d38" ON "scan_tokens" ("businessId") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_176da3053bcc019ca7b07207a9" ON "scan_tokens" ("token") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_3cccf2ffe80fde82299cc02e09" ON "scan_tokens" ("expiresAt") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_3cccf2ffe80fde82299cc02e09"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_176da3053bcc019ca7b07207a9"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_5e1d4c1d1bf73ee0ca20fc4d38"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_2a9a952bd91f6ef281c992d502"`,
    );
    await queryRunner.query(`DROP TABLE "scan_tokens"`);
  }
}
