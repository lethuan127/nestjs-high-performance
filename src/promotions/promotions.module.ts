import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PromotionsService } from './promotions.service';
import { PromotionsController } from './promotions.controller';
import { UserEventHandler } from './event-handlers/user.event-handler';
import { PromotionCampaign } from './entities/promotion-campaign.entity';
import { UserPromotion } from './entities/user-promotion.entity';
import { Voucher } from './entities/voucher.entity';
import { User } from '../auth/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PromotionCampaign, UserPromotion, Voucher, User])],
  controllers: [PromotionsController],
  providers: [PromotionsService, UserEventHandler],
  exports: [PromotionsService],
})
export class PromotionsModule {}
