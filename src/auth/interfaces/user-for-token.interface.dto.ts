import { Prisma, UserStatus, UserType } from '@prisma/client';

export interface UserForTokenDto {
    id: string;
    email: string;
    fullName: string;
    userType: UserType;
    status: UserStatus;
    city?: string | null;
    country?: string | null;
    hasHostProfile?: boolean;
    hasVendorProfile?: boolean;
    hasAttendeeProfile?: boolean;
}

export type UserWithProfiles = Prisma.UserGetPayload<{
  include: {
    hostProfile: true;
    vendorProfile: true;
    attendeeProfile: true;
  };
}>;