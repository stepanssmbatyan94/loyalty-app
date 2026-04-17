import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateLoyaltyCardsTable1776274588044 implements MigrationInterface {
  name = 'CreateLoyaltyCardsTable1776274588044';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "loyalty_cards" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "customerId" integer NOT NULL, "businessId" character varying NOT NULL, "points" integer NOT NULL DEFAULT '0', "totalPointsEarned" integer NOT NULL DEFAULT '0', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_fb1bdd89998700e851cac1cef93" UNIQUE ("customerId", "businessId"), CONSTRAINT "PK_a6f17521640723e5ca1607904e9" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_c46e07828130c261142819057a" ON "loyalty_cards" ("customerId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_7462095d9b872ef360634a47f6" ON "loyalty_cards" ("businessId") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_7462095d9b872ef360634a47f6"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_c46e07828130c261142819057a"`,
    );
    await queryRunner.query(`DROP TABLE "loyalty_cards"`);
  }
}
