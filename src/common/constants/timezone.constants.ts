import { AllowedCountries } from '@prisma/client';

export const COUNTRY_TIMEZONE_MAP: Record<AllowedCountries, string> = {
    NO: 'Europe/Oslo',
    SE: 'Europe/Stockholm',
    DK: 'Europe/Copenhagen',
    FI: 'Europe/Helsinki',
    IS: 'Atlantic/Reykjavik',
    DE: 'Europe/Berlin',
    PL: 'Europe/Warsaw',
    NL: 'Europe/Amsterdam',
    HU: 'Europe/Budapest',
    BG: 'Europe/Sofia',
    RO: 'Europe/Bucharest',
};

export const DEFAULT_TIMEZONE = 'Europe/Oslo';
