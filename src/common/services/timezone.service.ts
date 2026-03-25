import { Injectable, BadRequestException } from '@nestjs/common';
import { DateTime } from 'luxon';

@Injectable()
export class TimezoneService {
    parseLocalToUTC(date: string, time: string, timezone: string): Date {
        const dt = DateTime.fromISO(`${date}T${time}`, { zone: timezone });

        if (!dt.isValid) {
            throw new BadRequestException(
                `Invalid date/time: ${dt.invalidReason} — ${dt.invalidExplanation}`,
            );
        }

        return dt.toUTC().toJSDate();
    }

    addHours(utcDate: Date, hours: number, timezone: string): Date {
        return DateTime.fromJSDate(utcDate, { zone: 'utc' })
            .setZone(timezone)
            .plus({ hours })
            .toUTC()
            .toJSDate();
    }

    toLocalDisplay(
        utcDate: Date,
        timezone: string,
        format = 'yyyy-MM-dd HH:mm',
    ): string {
        return DateTime.fromJSDate(utcDate, { zone: 'utc' })
            .setZone(timezone)
            .toFormat(format);
    }

    toLocalTime(utcDate: Date, timezone: string): string {
        return DateTime.fromJSDate(utcDate, { zone: 'utc' })
            .setZone(timezone)
            .toFormat('HH:mm');
    }

    toLocalDate(utcDate: Date, timezone: string): string {
        return DateTime.fromJSDate(utcDate, { zone: 'utc' })
            .setZone(timezone)
            .toFormat('dd/MM/yyyy');
    }

    toLocalISO(utcDate: Date, timezone: string): string {
        return DateTime.fromJSDate(utcDate, { zone: 'utc' })
            .setZone(timezone)
            .toISO()!;
    }

    doRangesOverlap(
        aStart: Date,
        aEnd: Date,
        bStart: Date,
        bEnd: Date,
    ): boolean {
        return aStart < bEnd && aEnd > bStart;
    }

    assertFuture(utcDate: Date, timezone: string): void {
        const dt = DateTime.fromJSDate(utcDate, { zone: 'utc' }).setZone(
            timezone,
        );
        if (dt <= DateTime.now().setZone(timezone)) {
            throw new BadRequestException(
                'Booking start time must be in the future',
            );
        }
    }

    getOffsetLabel(timezone: string): string {
        const dt = DateTime.now().setZone(timezone);
        const offsetMinutes = dt.offset;
        const sign = offsetMinutes >= 0 ? '+' : '-';
        const abs = Math.abs(offsetMinutes);
        const h = Math.floor(abs / 60);
        const m = abs % 60;
        return `UTC${sign}${h}${m > 0 ? `:${String(m).padStart(2, '0')}` : ''}`;
    }
}
