import { AllowedCountries } from '@prisma/client';

export const COUNTRY_TIMEZONE_MAP: Record<AllowedCountries, string> = {
    NO: 'Europe/Oslo',
    SE: 'Europe/Stockholm',
    DK: 'Europe/Copenhagen',
    FI: 'Europe/Helsinki',
    IS: 'Atlantic/Reykjavik',
};

export const DEFAULT_TIMEZONE = 'Europe/Oslo';
