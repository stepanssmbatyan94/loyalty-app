import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLanguageToUser1775775610252 implements MigrationInterface {
  name = 'AddLanguageToUser1775775610252';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user" ADD "language" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "language"`);
  }
}
