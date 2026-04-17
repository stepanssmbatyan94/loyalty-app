import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateBusinessTable1776274304429 implements MigrationInterface {
  name = 'CreateBusinessTable1776274304429';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."business_earnratemode_enum" AS ENUM('per_amd_spent', 'fixed_per_visit')`,
    );
    await queryRunner.query(
      `CREATE TABLE "business" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "ownerId" integer NOT NULL, "logoUrl" character varying, "earnRateMode" "public"."business_earnratemode_enum" NOT NULL DEFAULT 'per_amd_spent', "earnRateValue" integer NOT NULL DEFAULT '100', "botToken" character varying, "botUsername" character varying, "webhookSecret" character varying, "telegramGroupChatId" character varying, "supportedLocales" text array NOT NULL DEFAULT '{en}', "defaultLocale" character varying NOT NULL DEFAULT 'en', "isActive" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_79410f4a5e9d7ba1599bb601524" UNIQUE ("botUsername"), CONSTRAINT "PK_0bd850da8dafab992e2e9b058e5" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_91230ea862c52e2aa78208c7bb" ON "business" ("ownerId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_79410f4a5e9d7ba1599bb60152" ON "business" ("botUsername") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_79410f4a5e9d7ba1599bb60152"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_91230ea862c52e2aa78208c7bb"`,
    );
    await queryRunner.query(`DROP TABLE "business"`);
    await queryRunner.query(`DROP TYPE "public"."business_earnratemode_enum"`);
  }
}
