import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateRewardTranslationTable1776282247804 implements MigrationInterface {
  name = 'CreateRewardTranslationTable1776282247804';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "reward_translation" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "rewardId" character varying NOT NULL, "locale" character varying NOT NULL, "field" character varying NOT NULL, "value" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_rt_reward_locale_field" UNIQUE ("rewardId", "locale", "field"), CONSTRAINT "PK_be7179d6d15e2a604d969c6f8ff" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_4abaa7dde4913ee2e6bbcf3c7d" ON "reward_translation" ("rewardId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_f7f683a471885af348cb6212ff" ON "reward_translation" ("locale") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_f7f683a471885af348cb6212ff"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_4abaa7dde4913ee2e6bbcf3c7d"`,
    );
    await queryRunner.query(`DROP TABLE "reward_translation"`);
  }
}
