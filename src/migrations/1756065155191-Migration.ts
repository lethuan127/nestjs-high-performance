import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migration1756065155191 implements MigrationInterface {
  name = 'Migration1756065155191';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE "public"."vouchers_type_enum" AS ENUM('mobile_topup_discount')`);
    await queryRunner.query(`CREATE TYPE "public"."vouchers_status_enum" AS ENUM('active', 'used', 'expired', 'cancelled')`);
    await queryRunner.query(
      `CREATE TABLE "vouchers" ("id" BIGSERIAL NOT NULL, "code" character varying(50) NOT NULL, "user_promotion_id" bigint NOT NULL, "type" "public"."vouchers_type_enum" NOT NULL DEFAULT 'mobile_topup_discount', "status" "public"."vouchers_status_enum" NOT NULL DEFAULT 'active', "discount_percentage" numeric(5,2) NOT NULL, "min_topup_amount" numeric(10,2) NOT NULL DEFAULT '0', "max_discount_amount" numeric(10,2), "issued_at" TIMESTAMP NOT NULL, "expires_at" TIMESTAMP NOT NULL, "used_at" TIMESTAMP, "used_amount" numeric(10,2), "discount_amount" numeric(10,2), "transaction_reference" character varying(255), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_efc30b2b9169e05e0e1e19d6dd6" UNIQUE ("code"), CONSTRAINT "PK_ed1b7dd909a696560763acdbc04" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE INDEX "idx_vouchers_type" ON "vouchers" ("type") `);
    await queryRunner.query(`CREATE INDEX "idx_vouchers_user_promotion" ON "vouchers" ("user_promotion_id") `);
    await queryRunner.query(`CREATE INDEX "idx_vouchers_expiry" ON "vouchers" ("expires_at") `);
    await queryRunner.query(`CREATE INDEX "idx_vouchers_status" ON "vouchers" ("status") `);
    await queryRunner.query(`CREATE UNIQUE INDEX "idx_vouchers_code" ON "vouchers" ("code") `);
    await queryRunner.query(`CREATE TYPE "public"."user_promotions_status_enum" AS ENUM('eligible', 'voucher_issued', 'voucher_used', 'expired')`);
    await queryRunner.query(
      `CREATE TABLE "user_promotions" ("id" BIGSERIAL NOT NULL, "user_id" bigint NOT NULL, "campaign_id" bigint NOT NULL, "status" "public"."user_promotions_status_enum" NOT NULL DEFAULT 'eligible', "first_login_at" TIMESTAMP NOT NULL, "voucher_issued_at" TIMESTAMP, "voucher_used_at" TIMESTAMP, "participation_order" integer NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_ab99032ab43c965d01373b223b5" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE INDEX "idx_user_promotions_campaign" ON "user_promotions" ("campaign_id") `);
    await queryRunner.query(`CREATE INDEX "idx_user_promotions_first_login" ON "user_promotions" ("first_login_at") `);
    await queryRunner.query(`CREATE INDEX "idx_user_promotions_status" ON "user_promotions" ("status") `);
    await queryRunner.query(`CREATE UNIQUE INDEX "idx_user_promotions_user_campaign" ON "user_promotions" ("user_id", "campaign_id") `);
    await queryRunner.query(`CREATE TYPE "public"."promotion_campaigns_type_enum" AS ENUM('first_login_discount')`);
    await queryRunner.query(`CREATE TYPE "public"."promotion_campaigns_status_enum" AS ENUM('active', 'inactive', 'expired', 'full')`);
    await queryRunner.query(
      `CREATE TABLE "promotion_campaigns" ("id" BIGSERIAL NOT NULL, "name" character varying(255) NOT NULL, "description" text, "type" "public"."promotion_campaigns_type_enum" NOT NULL DEFAULT 'first_login_discount', "status" "public"."promotion_campaigns_status_enum" NOT NULL DEFAULT 'active', "start_date" TIMESTAMP NOT NULL, "end_date" TIMESTAMP NOT NULL, "max_participants" integer NOT NULL DEFAULT '100', "current_participants" integer NOT NULL DEFAULT '0', "discount_percentage" numeric(5,2) NOT NULL DEFAULT '30', "min_topup_amount" numeric(10,2) NOT NULL DEFAULT '0', "max_discount_amount" numeric(10,2), "voucher_validity_days" integer NOT NULL DEFAULT '30', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_35aea06069957b862f524f49311" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE INDEX "idx_campaigns_type" ON "promotion_campaigns" ("type") `);
    await queryRunner.query(`CREATE INDEX "idx_campaigns_active_period" ON "promotion_campaigns" ("start_date", "end_date", "status") `);
    await queryRunner.query(`CREATE INDEX "idx_campaigns_status" ON "promotion_campaigns" ("status") `);
    await queryRunner.query(
      `ALTER TABLE "vouchers" ADD CONSTRAINT "FK_371bb6d9a974db45f1e6534312a" FOREIGN KEY ("user_promotion_id") REFERENCES "user_promotions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_promotions" ADD CONSTRAINT "FK_4dff6dac4b2c0a25bcd9b3c5138" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_promotions" ADD CONSTRAINT "FK_f4f1cdb8887a4218c6545999c10" FOREIGN KEY ("campaign_id") REFERENCES "promotion_campaigns"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user_promotions" DROP CONSTRAINT "FK_f4f1cdb8887a4218c6545999c10"`);
    await queryRunner.query(`ALTER TABLE "user_promotions" DROP CONSTRAINT "FK_4dff6dac4b2c0a25bcd9b3c5138"`);
    await queryRunner.query(`ALTER TABLE "vouchers" DROP CONSTRAINT "FK_371bb6d9a974db45f1e6534312a"`);
    await queryRunner.query(`DROP INDEX "public"."idx_campaigns_status"`);
    await queryRunner.query(`DROP INDEX "public"."idx_campaigns_active_period"`);
    await queryRunner.query(`DROP INDEX "public"."idx_campaigns_type"`);
    await queryRunner.query(`DROP TABLE "promotion_campaigns"`);
    await queryRunner.query(`DROP TYPE "public"."promotion_campaigns_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."promotion_campaigns_type_enum"`);
    await queryRunner.query(`DROP INDEX "public"."idx_user_promotions_user_campaign"`);
    await queryRunner.query(`DROP INDEX "public"."idx_user_promotions_status"`);
    await queryRunner.query(`DROP INDEX "public"."idx_user_promotions_first_login"`);
    await queryRunner.query(`DROP INDEX "public"."idx_user_promotions_campaign"`);
    await queryRunner.query(`DROP TABLE "user_promotions"`);
    await queryRunner.query(`DROP TYPE "public"."user_promotions_status_enum"`);
    await queryRunner.query(`DROP INDEX "public"."idx_vouchers_code"`);
    await queryRunner.query(`DROP INDEX "public"."idx_vouchers_status"`);
    await queryRunner.query(`DROP INDEX "public"."idx_vouchers_expiry"`);
    await queryRunner.query(`DROP INDEX "public"."idx_vouchers_user_promotion"`);
    await queryRunner.query(`DROP INDEX "public"."idx_vouchers_type"`);
    await queryRunner.query(`DROP TABLE "vouchers"`);
    await queryRunner.query(`DROP TYPE "public"."vouchers_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."vouchers_type_enum"`);
  }
}
