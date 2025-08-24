import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migration1756050694253 implements MigrationInterface {
  name = 'Migration1756050694253';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."idx_user_phone"`);
    await queryRunner.query(`DROP INDEX "public"."idx_user_username"`);
    await queryRunner.query(`DROP INDEX "public"."idx_user_email"`);
    await queryRunner.query(`CREATE INDEX "idx_users_latest_login" ON "users" ("latest_login") `);
    await queryRunner.query(`CREATE INDEX "idx_users_created_at" ON "users" ("created_at") `);
    await queryRunner.query(`CREATE UNIQUE INDEX "idx_users_phone" ON "users" ("phone") `);
    await queryRunner.query(`CREATE UNIQUE INDEX "idx_users_username" ON "users" ("username") `);
    await queryRunner.query(`CREATE UNIQUE INDEX "idx_users_email" ON "users" ("email") `);
    await queryRunner.query(`CREATE INDEX "idx_users_phone_hash" ON "users" USING HASH(phone) `);
    await queryRunner.query(`CREATE INDEX "idx_users_username_hash" ON "users" USING HASH(username) `);
    await queryRunner.query(`CREATE INDEX "idx_users_email_hash" ON "users" USING HASH(email) `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."idx_users_email"`);
    await queryRunner.query(`DROP INDEX "public"."idx_users_username"`);
    await queryRunner.query(`DROP INDEX "public"."idx_users_phone"`);
    await queryRunner.query(`DROP INDEX "public"."idx_users_created_at"`);
    await queryRunner.query(`DROP INDEX "public"."idx_users_latest_login"`);
    await queryRunner.query(`CREATE UNIQUE INDEX "idx_user_email" ON "users" ("email") `);
    await queryRunner.query(`CREATE UNIQUE INDEX "idx_user_username" ON "users" ("username") `);
    await queryRunner.query(`CREATE UNIQUE INDEX "idx_user_phone" ON "users" ("phone") `);
  }
}
