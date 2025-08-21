import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migration1755762246329 implements MigrationInterface {
  name = 'Migration1755762246329';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "users" ("id" BIGSERIAL NOT NULL, "fullname" character varying(255) NOT NULL, "phone" character varying(20) NOT NULL, "email" character varying(255) NOT NULL, "username" character varying(50) NOT NULL, "password" character varying(255) NOT NULL, "birthday" date NOT NULL, "latestLogin" TIMESTAMP, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_a000cca60bcf04454e727699490" UNIQUE ("phone"), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "UQ_fe0bb3f6520ee0469504521e710" UNIQUE ("username"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE UNIQUE INDEX "idx_user_phone" ON "users" ("phone") `);
    await queryRunner.query(`CREATE UNIQUE INDEX "idx_user_username" ON "users" ("username") `);
    await queryRunner.query(`CREATE UNIQUE INDEX "idx_user_email" ON "users" ("email") `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."idx_user_email"`);
    await queryRunner.query(`DROP INDEX "public"."idx_user_username"`);
    await queryRunner.query(`DROP INDEX "public"."idx_user_phone"`);
    await queryRunner.query(`DROP TABLE "users"`);
  }
}
