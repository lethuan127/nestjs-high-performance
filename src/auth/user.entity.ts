import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { IsEmail, IsNotEmpty, IsOptional, IsPhoneNumber, MinLength } from 'class-validator';

@Entity('users')
// Unique indexes for authentication fields
@Index('idx_users_email', ['email'], { unique: true })
@Index('idx_users_username', ['username'], { unique: true })
@Index('idx_users_phone', ['phone'], { unique: true })
// Hash indexes for exact matches (faster than B-tree for equality)
@Index('idx_users_email_hash', { synchronize: false }) // CREATE UNIQUE INDEX "idx_user_email" ON "users" USING HASH (email)
@Index('idx_users_username_hash', { synchronize: false }) // CREATE UNIQUE INDEX "idx_user_username" ON "users" USING HASH (username)
@Index('idx_users_phone_hash', { synchronize: false }) // CREATE UNIQUE INDEX "idx_user_phone" ON "users" USING HASH (phone)
// Composite indexes for common queries
@Index('idx_users_created_at', ['createdAt'])
@Index('idx_users_latest_login', ['latestLogin'])
export class User {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: string; // bigint

  @Column({ type: 'varchar', length: 255 })
  @IsNotEmpty()
  fullname: string;

  @Column({ type: 'varchar', length: 20, unique: true })
  @IsPhoneNumber()
  phone: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  @IsEmail()
  email: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  @IsNotEmpty()
  @MinLength(3)
  username: string;

  @Column({ type: 'varchar', length: 255 })
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @Column({ type: 'date' })
  birthday: Date;

  @Column({ name: 'latest_login', type: 'timestamp', nullable: true })
  @IsOptional()
  latestLogin: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
