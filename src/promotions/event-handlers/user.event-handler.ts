import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EventJobs, type UserFirstLoginEvent } from '../../events/events.interface';
import { PromotionsService } from '../promotions.service';

@Injectable()
export class UserEventHandler {
  private readonly logger = new Logger(UserEventHandler.name);

  constructor(private readonly promotionsService: PromotionsService) {}

  @OnEvent(EventJobs.USER_FIRST_LOGIN)
  async handleUserFirstLogin(event: UserFirstLoginEvent): Promise<void> {
    this.logger.log(`Processing first login event for user ${event.userId}`, {
      userId: event.userId,
      email: event.email,
      fullname: event.fullname,
      loginTimestamp: event.loginTimestamp,
    });

    try {
      // Track first login and attempt promotion enrollment
      const promotionResult = await this.promotionsService.trackFirstLogin(event.userId);

      if (promotionResult.eligible) {
        this.logger.log(`User ${event.userId} successfully enrolled in promotion`, {
          userId: event.userId,
          campaignId: promotionResult.campaignId,
          campaignName: promotionResult.campaignName,
          participationOrder: promotionResult.participationOrder,
          remainingSlots: promotionResult.remainingSlots,
        });

        // Check if user is in first 100 and should get a voucher
        if (promotionResult.participationOrder && promotionResult.participationOrder <= 100) {
          try {
            // Get the issued voucher
            const userVouchers = await this.promotionsService.getUserVouchers(event.userId);
            const latestVoucher = userVouchers[0];

            if (latestVoucher) {
              this.logger.log(`Voucher issued for user ${event.userId}`, {
                userId: event.userId,
                voucherCode: latestVoucher.code,
                discountPercentage: latestVoucher.discountPercentage,
                expiresAt: latestVoucher.expiresAt,
              });
            }
          } catch (error) {
            this.logger.warn(`Could not retrieve voucher for user ${event.userId}`, {
              error: (error as Error).message,
              userId: event.userId,
            });
          }
        }
      } else {
        this.logger.log(`User ${event.userId} not eligible for promotion`, {
          userId: event.userId,
          reason: promotionResult.message,
        });
      }
    } catch (error) {
      this.logger.error(`Failed to process first login event for user ${event.userId}`, {
        error: (error as Error).message,
        stack: (error as Error).stack,
        userId: event.userId,
        event,
      });
    }
  }
}
