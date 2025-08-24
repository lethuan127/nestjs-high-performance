import { Controller, Get, Post, Body, Param, UseGuards, Request, ValidationPipe, HttpCode, HttpStatus } from '@nestjs/common';
import { PromotionsService } from './promotions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { TopupRequestDto, TopupResponseDto } from './dto/topup-request.dto';
import { CampaignResponseDto, UserPromotionResponseDto, VoucherResponseDto, PromotionEligibilityResponseDto } from './dto/promotion-response.dto';
import type { FastifyRequest } from 'fastify';

@Controller('promotions')
export class PromotionsController {
  constructor(private readonly promotionsService: PromotionsService) {}

  // Campaign Management (Admin endpoints)
  @Post('campaigns')
  @HttpCode(HttpStatus.CREATED)
  async createCampaign(@Body(ValidationPipe) createCampaignDto: CreateCampaignDto): Promise<CampaignResponseDto> {
    return this.promotionsService.createCampaign(createCampaignDto);
  }

  @Get('campaigns')
  async getActiveCampaigns(): Promise<CampaignResponseDto[]> {
    return this.promotionsService.getActiveCampaigns();
  }

  @Get('campaigns/:id')
  async getCampaignById(@Param('id') id: string): Promise<CampaignResponseDto> {
    return this.promotionsService.getCampaignById(id);
  }

  // User Promotion Endpoints
  @UseGuards(JwtAuthGuard)
  @Post('track-first-login')
  @HttpCode(HttpStatus.OK)
  async trackFirstLogin(@Request() req: FastifyRequest): Promise<PromotionEligibilityResponseDto> {
    return this.promotionsService.trackFirstLogin(req.user!.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Get('my-promotions')
  async getUserPromotions(@Request() req: FastifyRequest): Promise<UserPromotionResponseDto[]> {
    return this.promotionsService.getUserPromotions(req.user!.sub);
  }

  // Voucher Management
  @UseGuards(JwtAuthGuard)
  @Get('my-vouchers')
  async getUserVouchers(@Request() req: FastifyRequest): Promise<VoucherResponseDto[]> {
    return this.promotionsService.getUserVouchers(req.user!.sub);
  }

  @Get('vouchers/:code/validate')
  async validateVoucher(@Param('code') code: string): Promise<VoucherResponseDto> {
    return this.promotionsService.validateVoucher(code);
  }

  // Mobile Top-up
  @UseGuards(JwtAuthGuard)
  @Post('topup')
  @HttpCode(HttpStatus.OK)
  async processTopup(@Request() req: FastifyRequest, @Body(ValidationPipe) topupRequest: TopupRequestDto): Promise<TopupResponseDto> {
    return this.promotionsService.processTopup(req.user!.sub, topupRequest);
  }

  // Utility endpoints for checking promotion eligibility
  @UseGuards(JwtAuthGuard)
  @Get('eligibility')
  async checkEligibility(@Request() req: FastifyRequest): Promise<PromotionEligibilityResponseDto> {
    // This is a read-only check without actually enrolling the user
    const userId = req.user!.sub;

    // Check if user already has a promotion record
    const userPromotions = await this.promotionsService.getUserPromotions(userId);

    if (userPromotions.length > 0) {
      return {
        eligible: false,
        message: 'User has already participated in a promotion campaign',
      };
    }

    // Get active campaigns to show availability
    const activeCampaigns = await this.promotionsService.getActiveCampaigns();
    const eligibleCampaign = activeCampaigns.find((campaign) => campaign.remainingSlots > 0);

    if (!eligibleCampaign) {
      return {
        eligible: false,
        message: 'No active promotion campaigns available or all campaigns are full',
      };
    }

    return {
      eligible: true,
      campaignId: eligibleCampaign.id,
      campaignName: eligibleCampaign.name,
      message: `You are eligible for the "${eligibleCampaign.name}" promotion. ${eligibleCampaign.remainingSlots} slots remaining.`,
      remainingSlots: eligibleCampaign.remainingSlots,
    };
  }
}
