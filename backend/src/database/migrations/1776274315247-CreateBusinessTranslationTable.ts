import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateBusinessTranslationTable1776274315247 implements MigrationInterface {
  name = 'CreateBusinessTranslationTable1776274315247';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "business_translation" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "businessId" character varying NOT NULL, "locale" character varying NOT NULL, "field" character varying NOT NULL, "value" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_bt_business_locale_field" UNIQUE ("businessId", "locale", "field"), CONSTRAINT "PK_5f5e72188af5c28031dd3cda0ea" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_5692a3e96ec10a8d33037456e4" ON "business_translation" ("businessId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_54443517f9f696e5c90255962f" ON "business_translation" ("locale") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_54443517f9f696e5c90255962f"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_5692a3e96ec10a8d33037456e4"`,
    );
    await queryRunner.query(`DROP TABLE "business_translation"`);
  }
}
