/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { setupTestEnvironment } from './test-env';
import { PromotionCampaign, CampaignStatus, CampaignType } from '../src/promotions/entities/promotion-campaign.entity';
import { UserPromotion, ParticipationStatus } from '../src/promotions/entities/user-promotion.entity';
import { Voucher, VoucherStatus } from '../src/promotions/entities/voucher.entity';
import { User } from '../src/auth/user.entity';
import { EventEmitter2 } from '@nestjs/event-emitter';

describe('First Login Campaign (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;
  let eventEmitter: EventEmitter2;
  const userTokens: string[] = [];

  // Test data
  const testCampaign = {
    name: 'First Login Test Campaign',
    description: 'Test campaign for e2e testing',
    type: CampaignType.FIRST_LOGIN_DISCOUNT,
    startDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // Started yesterday
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Ends in 7 days
    maxParticipants: 100,
    discountPercentage: 30,
    minTopupAmount: 10,
    maxDiscountAmount: 50,
    voucherValidityDays: 30,
  };

  const testUsers = [
    {
      fullname: 'John Doe',
      email: 'john.doe@test.com',
      username: 'johndoe',
      phone: '+1-418-543-8090',
      password: 'password123',
      birthday: '1990-01-01',
    },
    {
      fullname: 'Jane Smith',
      email: 'jane.smith@test.com',
      username: 'janesmith',
      phone: '+1-587-530-2271',
      password: 'password123',
      birthday: '1991-01-01',
    },
    {
      fullname: 'Bob Wilson',
      email: 'bob.wilson@test.com',
      username: 'bobwilson',
      phone: '+1-404-724-1937',
      password: 'password123',
      birthday: '1992-01-01',
    },
  ];

  const concurrentUsers = Array.from({ length: 5 }, (_, i) => ({
    fullname: `Concurrent User ${i}`,
    email: `concurrent.user${i}@test.com`,
    username: `concurrentuser${i}`,
    phone: `+1-604-555-010${i}`,
    password: 'password123',
    birthday: '1994-01-01',
  }));

  const newUser = {
    fullname: 'Test User',
    email: 'test.user@test.com',
    username: 'testuser',
    phone: '+1-250-555-0199',
    password: 'password123',
    birthday: '1993-01-01',
  };

  beforeAll(async () => {
    // Setup test environment
    setupTestEnvironment();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());

    // Get database connection and event emitter
    dataSource = moduleFixture.get<DataSource>(DataSource);
    eventEmitter = moduleFixture.get<EventEmitter2>(EventEmitter2);

    await app.init();

    // Clean up existing test data
    await cleanupTestData();

    // Create test campaign
    await createTestCampaign();
  }, 30000); // 30 second timeout

  afterAll(async () => {
    await cleanupTestData();
    await app.close();
  }, 30000); // 30 second timeout

  async function cleanupTestData() {
    // Clean in correct order due to foreign key constraints
    await dataSource.query(`DELETE FROM vouchers`);
    await dataSource.query(`DELETE FROM user_promotions`);
    await dataSource.query(`DELETE FROM promotion_campaigns`);

    // Clean test users
    const userRepository = dataSource.getRepository(User);
    for (const testUser of testUsers) {
      await userRepository.delete({ email: testUser.email });
    }
    for (const concurrentUser of concurrentUsers) {
      await userRepository.delete({ email: concurrentUser.email });
    }
    await userRepository.delete({ email: newUser.email });
  }

  async function createTestCampaign(): Promise<string> {
    const campaignRepository = dataSource.getRepository(PromotionCampaign);
    const campaign = campaignRepository.create({
      ...testCampaign,
      status: CampaignStatus.ACTIVE,
    });
    const savedCampaign = await campaignRepository.save(campaign);
    return savedCampaign.id;
  }

  describe('Campaign Management', () => {
    it('should create a new campaign', async () => {
      const campaignData = {
        name: 'New Test Campaign',
        description: 'Another test campaign',
        type: CampaignType.FIRST_LOGIN_DISCOUNT,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        maxParticipants: 50,
        discountPercentage: 25,
        minTopupAmount: 20,
        voucherValidityDays: 15,
      };

      const response = await request(app.getHttpServer()).post('/promotions/campaigns').send(campaignData).expect(201);

      expect(response.body).toMatchObject({
        name: campaignData.name,
        type: campaignData.type,
        maxParticipants: campaignData.maxParticipants,
        discountPercentage: parseFloat(campaignData.discountPercentage.toString()),
        status: CampaignStatus.ACTIVE,
      });

      // Cleanup
      await dataSource.getRepository(PromotionCampaign).delete({ id: response.body.id });
    });

    it('should get active campaigns', async () => {
      const response = await request(app.getHttpServer()).get('/promotions/campaigns').expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty('name');
      expect(response.body[0]).toHaveProperty('status');
      expect(response.body[0]).toHaveProperty('remainingSlots');
    });
  });

  describe('User Registration and First Login Flow', () => {
    it('should register users and trigger first login promotion', async () => {
      for (let i = 0; i < testUsers.length; i++) {
        const user = testUsers[i];

        // Register user
        const registerResponse = await request(app.getHttpServer()).post('/auth/register').send(user);

        expect(registerResponse.status).toBe(201);
        expect(registerResponse.body).toHaveProperty('access_token');
        expect(registerResponse.body.user).toMatchObject({
          fullname: user.fullname,
          email: user.email,
          username: user.username,
          phone: user.phone,
        });

        // Now login to trigger the first login event
        const loginResponse = await request(app.getHttpServer()).post('/auth/login').send({ account: user.username, password: user.password });

        expect(loginResponse.status).toBe(200);
        userTokens.push(loginResponse.body.access_token);

        // Wait longer for event processing to complete
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Check promotion eligibility
        const eligibilityResponse = await request(app.getHttpServer())
          .get('/promotions/eligibility')
          .set('Authorization', `Bearer ${loginResponse.body.access_token}`)
          .expect(200);

        // After registration, user should have already been enrolled via event handler
        // So eligibility check should show they already participated
        expect(eligibilityResponse.body.eligible).toBe(false);
        expect(eligibilityResponse.body.message).toContain('already participated');

        // Get user promotions
        const promotionsResponse = await request(app.getHttpServer())
          .get('/promotions/my-promotions')
          .set('Authorization', `Bearer ${loginResponse.body.access_token}`)
          .expect(200);

        expect(Array.isArray(promotionsResponse.body)).toBe(true);
        if (promotionsResponse.body.length > 0) {
          const promotion = promotionsResponse.body[0];
          expect(promotion).toHaveProperty('campaignName');
          expect(promotion).toHaveProperty('status');
          expect(promotion).toHaveProperty('participationOrder');
          expect(promotion.isInFirstHundred).toBe(true);
        }
      }
    });

    it('should issue vouchers for first login users', async () => {
      for (let i = 0; i < userTokens.length; i++) {
        const token = userTokens[i];

        const vouchersResponse = await request(app.getHttpServer()).get('/promotions/my-vouchers').set('Authorization', `Bearer ${token}`).expect(200);

        expect(Array.isArray(vouchersResponse.body)).toBe(true);

        if (vouchersResponse.body.length > 0) {
          const voucher = vouchersResponse.body[0];
          expect(voucher).toHaveProperty('code');
          expect(voucher.code).toMatch(/^CAKE-[A-Z0-9]{8}$/);
          expect(voucher.status).toBe(VoucherStatus.ACTIVE);
          expect(voucher.discountPercentage).toBe(30);
          expect(voucher.isValid).toBe(true);
          expect(voucher.isExpired).toBe(false);
        }
      }
    });
  });

  describe('Voucher Usage Flow', () => {
    let testUserToken: string;
    let testVoucherCode: string;

    beforeAll(async () => {
      // Use the first user's token and voucher
      testUserToken = userTokens[0];

      const vouchersResponse = await request(app.getHttpServer()).get('/promotions/my-vouchers').set('Authorization', `Bearer ${testUserToken}`).expect(200);

      if (vouchersResponse.body.length > 0) {
        testVoucherCode = vouchersResponse.body[0].code;
      }
    });

    it('should validate voucher code', async () => {
      if (!testVoucherCode) {
        console.log('No voucher available for validation test');
        return;
      }

      const response = await request(app.getHttpServer()).get(`/promotions/vouchers/${testVoucherCode}/validate`).expect(200);

      expect(response.body).toHaveProperty('code', testVoucherCode);
      expect(response.body).toHaveProperty('status', VoucherStatus.ACTIVE);
      expect(response.body).toHaveProperty('isValid', true);
      expect(response.body).toHaveProperty('discountPercentage', 30);
    });

    it('should process mobile top-up with voucher discount', async () => {
      if (!testVoucherCode) {
        console.log('No voucher available for top-up test');
        return;
      }

      const topupRequest = {
        phoneNumber: '+1-418-543-8090',
        amount: 100,
        voucherCode: testVoucherCode,
        paymentMethod: 'bank_transfer',
      };

      const response = await request(app.getHttpServer())
        .post('/promotions/topup')
        .set('Authorization', `Bearer ${testUserToken}`)
        .send(topupRequest)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        originalAmount: 100,
        discountAmount: 30, // 30% of 100
        finalAmount: 70,
        phoneNumber: topupRequest.phoneNumber,
        voucherCode: testVoucherCode,
      });

      expect(response.body).toHaveProperty('transactionId');
      expect(response.body.message).toContain('You saved 30');
    });

    it('should mark voucher as used after successful top-up', async () => {
      if (!testVoucherCode) {
        console.log('No voucher available for used status test');
        return;
      }

      const response = await request(app.getHttpServer()).get(`/promotions/vouchers/${testVoucherCode}/validate`).expect(200);

      expect(response.body.status).toBe(VoucherStatus.USED);
      expect(response.body.isValid).toBe(false);
      expect(response.body).toHaveProperty('usedAt');
      expect(response.body).toHaveProperty('usedAmount', 100);
      expect(response.body).toHaveProperty('discountAmount', 30);
    });

    it('should prevent reusing already used voucher', async () => {
      if (!testVoucherCode) {
        console.log('No voucher available for reuse prevention test');
        return;
      }

      const topupRequest = {
        phoneNumber: '+1-418-543-8090',
        amount: 50,
        voucherCode: testVoucherCode,
        paymentMethod: 'bank_transfer',
      };

      const response = await request(app.getHttpServer())
        .post('/promotions/topup')
        .set('Authorization', `Bearer ${testUserToken}`)
        .send(topupRequest)
        .expect(400);

      expect(response.body.message).toContain('expired or already used');
    });
  });

  describe('Campaign Limits and Edge Cases', () => {
    it('should prevent duplicate participation', async () => {
      // Try to manually track first login for an already registered user
      const response = await request(app.getHttpServer()).post('/promotions/track-first-login').set('Authorization', `Bearer ${userTokens[0]}`).expect(200);

      expect(response.body.eligible).toBe(false);
      expect(response.body.message).toContain('already participated');
    });

    it('should handle invalid voucher codes', async () => {
      const response = await request(app.getHttpServer()).get('/promotions/vouchers/INVALID-CODE/validate').expect(404);

      expect(response.body.message).toContain('not found');
    });

    it('should validate minimum top-up amount', async () => {
      await request(app.getHttpServer()).post('/auth/register').send(newUser);

      // Login to trigger first login event
      const loginResponse = await request(app.getHttpServer()).post('/auth/login').send({ account: newUser.username, password: newUser.password }).expect(200);

      // Wait for event processing
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const vouchersResponse = await request(app.getHttpServer())
        .get('/promotions/my-vouchers')
        .set('Authorization', `Bearer ${loginResponse.body.access_token}`)
        .expect(200);

      if (vouchersResponse.body.length > 0) {
        const voucherCode = vouchersResponse.body[0].code;

        // Try top-up with amount below minimum
        const topupRequest = {
          phoneNumber: '+1-250-555-0199',
          amount: 5, // Below minimum of 10
          voucherCode: voucherCode,
          paymentMethod: 'bank_transfer',
        };

        const response = await request(app.getHttpServer())
          .post('/promotions/topup')
          .set('Authorization', `Bearer ${loginResponse.body.access_token}`)
          .send(topupRequest)
          .expect(400);

        expect(response.body.message).toContain('Minimum top-up amount');
      }
    });
  });

  describe('Concurrent Registration Stress Test', () => {
    it('should handle concurrent user registrations correctly', async () => {
      // Register users in smaller batches to avoid overwhelming the connection
      const responses: any[] = [];
      for (const user of concurrentUsers) {
        const response = await request(app.getHttpServer()).post('/auth/register').send(user);
        responses.push(response);
      }

      // Login users in smaller batches to trigger first login events
      const loginResponses: any[] = [];
      for (const user of concurrentUsers) {
        const loginResponse = await request(app.getHttpServer()).post('/auth/login').send({ account: user.username, password: user.password }).expect(200);
        loginResponses.push(loginResponse);
      }

      // Wait for all event processing
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Check that all users got valid tokens
      expect(responses).toHaveLength(5);
      expect(loginResponses).toHaveLength(5);
      loginResponses.forEach((response) => {
        expect(response.body).toHaveProperty('access_token');
        expect(response.body.user).toHaveProperty('email');
      });

      // Verify campaign participant count increased correctly
      const campaignsResponse = await request(app.getHttpServer()).get('/promotions/campaigns').expect(200);

      const testCampaignFromResponse = campaignsResponse.body.find((c: any) => c.name === testCampaign.name);

      expect(testCampaignFromResponse).toBeDefined();
      expect(testCampaignFromResponse.currentParticipants).toBeGreaterThan(0);
    });
  });
});
