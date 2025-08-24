export interface UserFirstLoginEvent {
  userId: string;
  fullname: string;
  email: string;
  username: string;
  phone: string;
  loginTimestamp: Date;
}

export enum EventQueues {
  USER_EVENTS = 'user-events',
  PROMOTION_EVENTS = 'promotion-events',
}

export const EventJobs = {
  USER_FIRST_LOGIN: 'user.first-login',
  PROMOTION_ENROLLMENT: 'promotion.enrollment',
} as const;

export type EventJobs = (typeof EventJobs)[keyof typeof EventJobs];
