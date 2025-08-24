import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { IsEmail, IsNotEmpty, IsOptional, IsPhoneNumber, MinLength } from 'class-validator';

@Entity('users')
@Index('idx_user_email', ['email'], { unique: true })
@Index('idx_user_username', ['username'], { unique: true })
@Index('idx_user_phone', ['phone'], { unique: true })
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
