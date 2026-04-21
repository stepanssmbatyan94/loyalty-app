import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBusinessIdToUser1776783628640 implements MigrationInterface {
  name = 'AddBusinessIdToUser1776783628640';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user" ADD "businessId" character varying`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_324f2c4c7b658100d7f994e57b" ON "user" ("businessId") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_324f2c4c7b658100d7f994e57b"`,
    );
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "businessId"`);
  }
}
