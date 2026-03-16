import {
    BadRequestException,
    ConflictException,
    ForbiddenException,
    Injectable,
    InternalServerErrorException,
    Logger,
    NotFoundException,
} from '@nestjs/common';
import {
    BlockDaysDto,
    BlockDaysResultItemDto,
    CreateSpaceDto,
    DiscoverSpacesQueryDto,
    FindSpacesQueryDto,
    ReplaceSpaceFilesDto,
    SpaceCalendarDto,
    SpaceCalendarResponseDto,
    SpaceListResponseDto,
    SpaceListResponseItemDto,
    SpacePublicDto,
    SpaceResponseDto,
    UpdateSpaceDto,
} from '../dto';
import { DatabaseService } from 'src/database/database.service';
import { StorageService } from 'src/common/services';
import { plainToInstance } from 'class-transformer';
import { SpaceEntity, VendorEntity } from '../entities';
import {
    BookingStatus,
    NotificationType,
    Prisma,
    SpaceStatus,
    VendorStatus,
} from '@prisma/client';
import dayjs from 'dayjs';
import { NotificationsService } from 'src/notifications/services';

@Injectable()
export class SpacesService {
    private readonly logger = new Logger(SpacesService.name);
    constructor(
        private db: DatabaseService,
        private storageService: StorageService,
        private notificationsService: NotificationsService,
    ) {}

    async createSpace(
        userId: string,
        dto: CreateSpaceDto,
        files: {
            images: Express.Multer.File[];
            instructionsPdf: Express.Multer.File[];
        },
    ): Promise<{
        success: boolean;
        message: string;
    }> {
        this.logger.debug('Creating space for user: ', userId);
        try {
            return this.db.$transaction(
                async (tx) => {
                    const vendor = await tx.vendor.findUnique({
                        where: {
                            userId,
                        },
                        select: {
                            id: true,
                            vendorStatus: true,
                            user: {
                                select: {
                                    fullName: true,
                                    city: true,
                                },
                            },
                            spaces: {
                                select: {
                                    id: true,
                                },
                            },
                        },
                    });

                    if (!vendor)
                        throw new BadRequestException('Vendor not found');

                    VendorEntity.validateCanCreateSpace(
                        vendor.vendorStatus,
                        vendor.user.city,
                    );

                    const space = await tx.space.create({
                        data: SpaceEntity.createSpaceData(
                            dto,
                            vendor.user.city!,
                            vendor.id,
                        ),
                    });

                    SpaceEntity.validateImages(files.images);
                    const imagesUrls: string[] = await this.uploadSpaceImages(
                        files.images,
                        userId,
                    );

                    await tx.spaceImage.createMany({
                        data: imagesUrls.map((image, index) => {
                            return {
                                spaceId: space.id,
                                url: image,
                                order: index + 1,
                            };
                        }),
                    });

                    SpaceEntity.validatePdfs(files.instructionsPdf);
                    const instructionsPdfsUrls: string[] =
                        await this.uploadSpacePdfs(
                            files.instructionsPdf,
                            userId,
                        );

                    await tx.spacePdf.createMany({
                        data: instructionsPdfsUrls.map((pdf, index) => {
                            return {
                                spaceId: space.id,
                                url: pdf,
                                name:
                                    (
                                        files.instructionsPdf as Express.Multer.File[]
                                    )[index]?.originalname ?? null,
                                order: index + 1,
                            };
                        }),
                    });

                    if (VendorEntity.isFirstSpace(vendor.spaces.length)) {
                        await tx.vendor.update({
                            where: {
                                userId,
                            },
                            data: {
                                isOnBoarded: true,
                            },
                        });
                    }

                    this.notificationsService.queueNotification({
                        userId: process.env.ADMIN_USER_ID || 'riti_admin',
                        type: NotificationType.ADMIN_NOTICE,
                        title: 'New space created',
                        message: `New space created by ${vendor.user.fullName}, pending your approval`,
                        meta: {
                            spaceId: space.id,
                            vendorId: vendor.id,
                        }
                    })

                    return {
                        success: true,
                        message: 'Space created successfully',
                    };
                },
                { timeout: 30000 },
            );
        } catch (error) {
            this.logger.error('FULL ERROR:', {
                name: error.name,
                code: error.code,
                meta: error.meta,
                message: error.message,
                stack: error.stack,
            });

            if (
                error.name === 'PrismaClientKnownRequestError' &&
                error.code === 'P2002'
            ) {
                const target = (error.meta as { target?: string[] })
                    ?.target?.[0];
                throw new BadRequestException(
                    `Duplicate ${target || 'field'}: "${dto.address}". Use unique address.`,
                );
            }

            throw new InternalServerErrorException('Space creation failed', error.message);
        }
    }

    async getVendorSpaces(
        userId: string,
        query: FindSpacesQueryDto,
    ): Promise<SpaceListResponseDto> {
        const page = Number(query.page);
        const limit = Number(query.limit);
        const status = query.status;
        const skip = (page - 1) * limit;

        const [spaces, total] = await Promise.all([
            this.db.space.findMany({
                where: {
                    vendor: { userId },
                    ...(status && { status }),
                },
                include: {
                    images: {
                        take: 1,
                        orderBy: { order: 'asc' },
                    },
                    vendor: {
                        select: { businessName: true, vendorStatus: true },
                    },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            this.db.space.count({
                where: { vendor: { userId }, ...(status && { status }) },
            }),
        ]);

        return {
            spaces: plainToInstance(SpaceListResponseItemDto, spaces, {
                excludeExtraneousValues: true,
            }),
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async getVendorSpace(
        userId: string,
        spaceId: string,
    ): Promise<SpaceResponseDto> {
        const space = await this.db.space.findUnique({
            where: {
                id: spaceId,
            },
            select: {
                id: true,
                name: true,
                description: true,
                address: true,
                location: true,
                capacity: true,
                spaceType: true,
                rules: true,
                pricePerHour: true,
                status: true,
                amenities: true,
                adminReason: true,
                minBookingDurationHours: true,
                minLeadTimeHours: true,
                multiDayBookingAllowed: true,
                createdAt: true,
                updatedAt: true,
                vendor: {
                    select: {
                        userId: true,
                    },
                },
                images: {
                    select: {
                        id: true,
                        url: true,
                        order: true,
                    },
                },
                instructionsPdf: {
                    select: {
                        id: true,
                        url: true,
                        name: true,
                        order: true,
                    },
                },
            },
        });

        if (!space) throw new NotFoundException('Space not found');
        if (space.vendor.userId !== userId)
            throw new ForbiddenException('Not space owner');

        const res = plainToInstance(
            SpaceResponseDto,
            {
                ...space,
                imageUrls: space.images,
                instructionsPdfsUrls: space.instructionsPdf,
                location: space.location
            },
            {
                excludeExtraneousValues: true,
            },
        );

        this.logger.debug(
            `Space found: ${JSON.stringify(res)}, amenties: ${space.amenities}`,
        );

        return res;
    }

    async updateSpace(
        spaceId: string,
        userId: string,
        dto: UpdateSpaceDto,
    ): Promise<SpaceResponseDto> {
        return this.db.$transaction(async (tx) => {
            const space = await tx.space.findUnique({
                where: { id: spaceId },
                include: {
                    vendor: { select: { userId: true } },
                    bookings: {
                        where: { status: { in: ['APPROVED', 'PAID'] } },
                        select: { startTime: true, endTime: true },
                    },
                },
            });

            if (!space) throw new NotFoundException('Space not found');
            SpaceEntity.validateSpaceToBeUpdated(space, dto, userId);

            const updatedSpace = await tx.space.update({
                where: { id: spaceId },
                data: {
                    ...dto,
                    ...(dto.capacity ||
                    dto.spaceType ||
                    dto.pricePerHour ||
                    dto.resendForReview ||
                    dto.location ||
                    dto.address
                        ? { status: SpaceStatus.UNDER_REVIEW }
                        : {}),
                },
                include: {
                    images: { take: 1, orderBy: { order: 'asc' } },
                    vendor: {
                        select: {
                            id: true,
                            businessName: true,
                            vendorStatus: true,
                        },
                    },
                },
            });

            return plainToInstance(SpaceResponseDto, updatedSpace);
        });
    }

    async pauseSpace(
        spaceId: string,
        userId: string,
    ): Promise<SpaceResponseDto> {
        return this.db.$transaction(async (tx) => {
            const space = await tx.space.findUnique({
                where: { id: spaceId },
                include: {
                    vendor: { select: { userId: true } },
                    bookings: {
                        where: {
                            status: { in: ['APPROVED', 'PAID'] },
                            startTime: { gt: new Date() },
                        },
                        select: { id: true },
                    },
                },
            });

            if (!space) throw new NotFoundException('Space not found');
            SpaceEntity.validateSpaceToBePaused(space, userId);

            const pausedSpace = await tx.space.update({
                where: { id: spaceId },
                data: {
                    status: SpaceStatus.PAUSED,
                },
                include: {
                    images: { take: 1, orderBy: { order: 'asc' } },
                    vendor: {
                        select: {
                            id: true,
                            businessName: true,
                            vendorStatus: true,
                        },
                    },
                },
            });

            return plainToInstance(SpaceResponseDto, pausedSpace, {
                excludeExtraneousValues: true,
            });
        });
    }

    async getVendorCalendar(
        userId: string,
        query: {
            startDate: Date;
            endDate: Date;
            spaceIds?: string[];
        },
    ): Promise<SpaceCalendarResponseDto> {
        const whereSpace = {
            vendor: { userId },
            ...(query.spaceIds && { id: { in: query.spaceIds } }),
        };

        const spaces = await this.db.space.findMany({
            where: whereSpace,
            select: { id: true, name: true, status: true },
        });

        const bookings = await this.db.booking.findMany({
            where: {
                spaceId: { in: spaces.map((s) => s.id) },
                startTime: {
                    gte: query.startDate,
                    lte: query.endDate,
                },
                status: { in: ['PENDING', 'APPROVED', 'PAID'] },
            },
            include: {
                renter: { select: { fullName: true, email: true } },
            },
            orderBy: { startTime: 'asc' },
        });

        const spaceEvents: SpaceCalendarDto[] = spaces.map((space) => ({
            id: space.id,
            name: space.name,
            status: space.status,
            bookings: bookings
                .filter((b) => b.spaceId === space.id)
                .map((b) => ({
                    id: b.id,
                    title: `Booking #${b.id.slice(-4)}`,
                    status: b.status,
                    totalPrice: Number(b.totalPrice),
                    renter: {
                        fullName: b.renter.fullName,
                        email: b.renter.email,
                    },
                    startTime: b.startTime,
                    endTime: b.endTime,
                })),
            blockedSlots: [],
            isAvailableNow: space.status === 'ACTIVE',
        }));

        return {
            spaces: spaceEvents,
            summary: {
                busySlots: bookings.length,
                availableSlots: 0,
                upcomingBookings: bookings.filter(
                    (b) => b.startTime > new Date(),
                ).length,
            },
        };
    }

    async replaceSpaceFiles(
        spaceId: string,
        userId: string,
        dto: ReplaceSpaceFilesDto,
        files: {
            images?: Express.Multer.File[];
            instructionsPdf?: Express.Multer.File[];
        },
    ): Promise<SpaceResponseDto> {
        return this.db.$transaction(
            async (tx) => {
                const space = await tx.space.findUnique({
                    where: { id: spaceId },
                    include: {
                        vendor: { select: { userId: true } },
                        images: { orderBy: { order: 'asc' } },
                        instructionsPdf: { orderBy: { order: 'asc' } },
                    },
                });

                if (!space) throw new NotFoundException('Space not found');
                SpaceEntity.validateSpaceFileReplaceMent(
                    space.vendor.userId,
                    userId,
                    space.status,
                );

                if (files.images) {
                    const oldImageCount =
                        space.images.length - dto.imageReplacementData.length;
                    const newTotalImages = oldImageCount + files.images.length;
                    if (newTotalImages < 3 || newTotalImages > 5) {
                        throw new BadRequestException(
                            `Total images must be 3-5 (current: ${newTotalImages})`,
                        );
                    }

                    await Promise.all(
                        dto.imageReplacementData.map(({ id }) =>
                            tx.spaceImage.delete({ where: { id } }),
                        ),
                    );

                    const newImageUrls = await this.uploadSpaceImages(
                        files.images,
                        userId,
                    );

                    await tx.spaceImage.createMany({
                        data: newImageUrls.map((url, index) => ({
                            spaceId,
                            url,
                            order: dto.imageReplacementData[index].order,
                        })),
                    });

                    const remainingImages = await tx.spaceImage.findMany({
                        where: { spaceId },
                    });

                    await Promise.all(
                        remainingImages.map((img, i) =>
                            tx.spaceImage.update({
                                where: { id: img.id },
                                data: { order: i + 1 },
                            }),
                        ),
                    );
                }

                if (files.instructionsPdf) {
                    const oldPdfCount =
                        space.instructionsPdf.length -
                        dto.pdfReplacementData.length;
                    if (oldPdfCount + files.instructionsPdf.length > 2) {
                        throw new BadRequestException('Total PDFs must be ≤2');
                    }

                    await Promise.all(
                        dto.pdfReplacementData.map(({ id }) =>
                            tx.spacePdf.delete({ where: { id } }),
                        ),
                    );

                    const newPdfUrls = await this.uploadSpacePdfs(
                        files.instructionsPdf,
                        userId,
                    );

                    await tx.spacePdf.createMany({
                        data: newPdfUrls.map((url, index) => ({
                            spaceId,
                            url,
                            name:
                                files.instructionsPdf![index]?.originalname ??
                                null,
                            order: dto.pdfReplacementData[index].order,
                        })),
                    });

                    const remainingPdfs = await tx.spacePdf.findMany({
                        where: { spaceId },
                    });

                    await Promise.all(
                        remainingPdfs.map((pdf, i) =>
                            tx.spacePdf.update({
                                where: { id: pdf.id },
                                data: { order: i + 1 },
                            }),
                        ),
                    );
                }

                const updatedSpace = await tx.space.findUnique({
                    where: { id: spaceId },
                    include: {
                        images: true,
                        instructionsPdf: true,
                        vendor: {
                            select: { businessName: true, vendorStatus: true },
                        },
                    },
                });

                return plainToInstance(SpaceResponseDto, updatedSpace!);
            },
            {
                timeout: 20000,
            },
        );
    }

    async deleteSpaceFile(
        spaceId: string,
        fileType: 'img' | 'pdf',
        fileId: string,
        userId: string,
    ): Promise<void> {
        return this.db.$transaction(async (tx) => {
            const space = await tx.space.findUnique({
                where: { id: spaceId },
                include: {
                    vendor: { select: { userId: true } },
                    ...(fileType === 'img' && { images: true }),
                    ...(fileType === 'pdf' && { instructionsPdf: true }),
                },
            });

            if (!space) throw new NotFoundException('Space not found');
            if (space.vendor.userId !== userId)
                throw new ForbiddenException('Not space owner');
            if (space.status !== SpaceStatus.DRAFT)
                throw new ForbiddenException(
                    'Can only delete files in DRAFT status',
                );

            const fileModel = fileType === 'img' ? 'images' : 'instructionsPdf';
            const file = space[fileModel].find((f: any) => f.id === fileId);
            if (!file) throw new NotFoundException(`File ${fileId} not found`);

            const currentCount = space[fileModel].length;
            const newCount = currentCount - 1;

            if (fileType === 'img' && newCount < 3) {
                throw new BadRequestException(
                    `Cannot delete - minimum 3 images required (current: ${newCount})`,
                );
            }
            if (fileType === 'pdf' && newCount < 1) {
                throw new BadRequestException(
                    `Cannot delete - minimum 1 PDF required (current: ${newCount})`,
                );
            }

            if (fileType === 'img') {
                await tx.spaceImage.delete({ where: { id: fileId } });

                const fileName = space.images
                    .find((f) => f.id === fileId)!
                    .url.split('/')
                    .pop()!;
                await this.storageService.deleteFile(fileName, 'spaces');

                const remainingImages = await tx.spaceImage.findMany({
                    where: { spaceId },
                });
                await Promise.all(
                    remainingImages.map((img, index) =>
                        tx.spaceImage.update({
                            where: { id: img.id },
                            data: { order: index + 1 },
                        }),
                    ),
                );
            } else {
                await tx.spacePdf.delete({ where: { id: fileId } });

                const fileName = space.instructionsPdf
                    .find((f) => f.id === fileId)!
                    .url.split('/')
                    .pop()!;
                await this.storageService.deleteFile(fileName, 'spaces');

                const remainingPdfs = await tx.spacePdf.findMany({
                    where: { spaceId },
                });
                await Promise.all(
                    remainingPdfs.map((pdf, index) =>
                        tx.spacePdf.update({
                            where: { id: pdf.id },
                            data: { order: index + 1 },
                        }),
                    ),
                );
            }
        });
    }

    async discoverSpaces(
        query: DiscoverSpacesQueryDto,
    ): Promise<SpaceListResponseDto> {
        const {
            city,
            spaceType,
            capacityMin,
            priceHourlyMax,
            date,
            page,
            limit,
            sortBy = 'createdAt',
            order = 'desc',
        } = query;

        const skip = (page - 1) * limit;
        const where: Prisma.SpaceWhereInput = {
            status: SpaceStatus.ACTIVE,
            isSuspended: false,
            vendor: {
                vendorStatus: VendorStatus.APPROVED,
                stripeChargesEnabled: true,
            },
            ...(city && { city }),
            ...(spaceType && { spaceType }),
            ...(capacityMin && { capacity: { gte: capacityMin } }),
            ...(priceHourlyMax && {
                pricePerHour: { lte: new Prisma.Decimal(priceHourlyMax) },
            }),
        };

        if (date) {
            const targetDate = new Date(date);
            where.bookings = {
                none: {
                    status: { in: ['APPROVED', 'PAID'] },
                    OR: [
                        {
                            startTime: {
                                lte: new Date(
                                    targetDate.setHours(23, 59, 59, 999),
                                ),
                            },
                            endTime: { gte: new Date(date) },
                        },
                    ],
                },
            };
        }

        const [spaces, total] = await Promise.all([
            this.db.space.findMany({
                where,
                select: {
                    id: true,
                    name: true,
                    description: true,
                    capacity: true,
                    spaceType: true,
                    amenities: true,
                    city: true,
                    address: true,
                    pricePerHour: true,
                    status: true,
                    images: { take: 1, orderBy: { order: 'asc' } },
                    vendor: {
                        select: { businessName: true, vendorStatus: true },
                    },
                },
                orderBy: { [sortBy]: order },
                skip,
                take: limit,
            }),
            this.db.space.count({ where }),
        ]);

        return {
            spaces: spaces.map((space) =>
                plainToInstance(SpaceListResponseItemDto, space),
            ),
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async getPublicSpace(spaceId: string): Promise<SpacePublicDto> {
        const space = await this.db.space.findFirst({
            where: {
                id: spaceId,
                status: SpaceStatus.ACTIVE,
                isSuspended: false,
                vendor: {
                    vendorStatus: VendorStatus.APPROVED,
                    stripeChargesEnabled: true,
                },
            },
            select: {
                id: true,
                name: true,
                description: true,
                capacity: true,
                spaceType: true,
                pricePerHour: true,
                amenities: true,
                city: true,
                address: true,
                status: true,
                images: true,
                location: true,
                instructionsPdf: true,
                rules: true,
                vendor: { select: { businessName: true, vendorStatus: true } },
                bookings: {
                    where: {
                        status: { in: ['APPROVED', 'PAID'] },
                        startTime: { gt: new Date() },
                    },
                },
                daysBlocked: true,
            },
        });

        if (!space) {
            throw new NotFoundException('Space unavailable or not approved');
        }

        this.logger.debug('Got the public space ', space);

        return plainToInstance(
            SpacePublicDto,
            {
                ...space,
                coverImage: space.images[0]?.url || null,
                vendorSummary: {
                    businessName: space.vendor.businessName,
                    vendorStatus: space.vendor.vendorStatus,
                },
                isAvailable: space.bookings.length === 0,
                location: space.location,
            },
            {
                excludeExtraneousValues: true,
            },
        );
    }

    async blockDays(
        userId: string,
        spaceId: string,
        dto: BlockDaysDto,
    ): Promise<BlockDaysResultItemDto[]> {
        const space = await this.db.space.findUnique({
            where: { id: spaceId },
            select: {
                id: true,
                status: true,
                vendor: { select: { userId: true } },
            },
        });

        if (!space) throw new NotFoundException('Space not found');
        if (space.vendor.userId !== userId)
            throw new ForbiddenException('You do not own this space');
        if (space.status !== SpaceStatus.ACTIVE)
            throw new BadRequestException(
                'Space must be ACTIVE to block dates',
            );

        const results: BlockDaysResultItemDto[] = await Promise.all(
            dto.dates.map(async (item) => {
                const start = dayjs(item.startingDate).startOf('day');
                const end = dayjs(item.endingDate).endOf('day');
                const now = dayjs();
                const startLabel = start.format('YYYY-MM-DD');
                const endLabel = end.format('YYYY-MM-DD');

                if (!start.isValid() || !end.isValid()) {
                    return {
                        success: false,
                        message: `Invalid date(s): ${startLabel} - ${endLabel}`,
                    };
                }

                if (end.isBefore(start) || end.isSame(start)) {
                    return {
                        success: false,
                        message: `End date must be after start date: ${startLabel} - ${endLabel}`,
                    };
                }

                if (start.isBefore(now, 'day')) {
                    return {
                        success: false,
                        message: `Start date cannot be in the past: ${startLabel}`,
                    };
                }

                if (end.diff(start, 'day') > 365) {
                    return {
                        success: false,
                        message: `Date range cannot exceed 365 days: ${startLabel} - ${endLabel}`,
                    };
                }

                const existingBlock = await this.db.daysBlocked.findFirst({
                    where: {
                        spaceId,
                        startingDate: { lte: end.toDate() },
                        endingDate: { gte: start.toDate() },
                    },
                });

                if (existingBlock) {
                    const blockedFrom = dayjs(
                        existingBlock.startingDate,
                    ).format('YYYY-MM-DD');
                    const blockedTo = dayjs(existingBlock.endingDate).format(
                        'YYYY-MM-DD',
                    );
                    return {
                        success: false,
                        message: `Dates overlap with an existing block from ${blockedFrom} to ${blockedTo}`,
                    };
                }

                const conflictingBooking = await this.db.booking.findFirst({
                    where: {
                        spaceId,
                        status: {
                            in: [BookingStatus.APPROVED, BookingStatus.PAID],
                        },
                        startTime: { lte: end.toDate() },
                        endTime: { gte: start.toDate() },
                    },
                });

                if (conflictingBooking) {
                    const bkFrom = dayjs(conflictingBooking.startTime).format(
                        'YYYY-MM-DD',
                    );
                    const bkTo = dayjs(conflictingBooking.endTime).format(
                        'YYYY-MM-DD',
                    );
                    return {
                        success: false,
                        message: `Active bookings found between dates ${bkFrom} to ${bkTo}`,
                    };
                }

                try {
                    await this.db.daysBlocked.create({
                        data: {
                            spaceId,
                            startingDate: start.toDate(),
                            endingDate: end.toDate(),
                            reason: item.reason,
                        },
                    });

                    return {
                        success: true,
                        message: `Successfully blocked dates from ${startLabel} to ${endLabel}`,
                    };
                } catch (error) {
                    this.logger.error(error);
                    return {
                        success: false,
                        message: `Failed to block dates ${startLabel} to ${endLabel}: server error`,
                    };
                }
            }),
        );

        return results;
    }

    async deleteSpace(
        spaceId: string,
        userId: string,
    ): Promise<{ message: string }> {
        return this.db.$transaction(async (tx) => {
            const space = await tx.space.findUnique({
                where: { id: spaceId },
                include: {
                    vendor: { select: { userId: true } },
                    bookings: {
                        where: {
                            status: {
                                in: [
                                    BookingStatus.APPROVED,
                                    BookingStatus.PAID,
                                    BookingStatus.PENDING,
                                ],
                            },
                            endTime: { gt: new Date() },
                        },
                        select: { id: true },
                    },
                },
            });

            if (!space) throw new NotFoundException('Space not found');
            if (space.vendor.userId !== userId)
                throw new ForbiddenException('Not space owner');

            const deletableStatuses: SpaceStatus[] = [
                SpaceStatus.DRAFT,
                SpaceStatus.PAUSED,
                SpaceStatus.REJECTED,
                SpaceStatus.SUSPENDED,
            ];

            if (!deletableStatuses.includes(space.status)) {
                throw new BadRequestException(
                    `Cannot delete a space with status "${space.status}". Only ${deletableStatuses} spaces can be deleted.`,
                );
            }

            if (space.bookings.length > 0) {
                throw new ConflictException(
                    `Cannot delete space - ${space.bookings.length} active booking(s) exist.`,
                );
            }

            await tx.space.delete({ where: { id: spaceId } });

            return { message: `Space "${space.name}" deleted successfully.` };
        });
    }

    private async uploadSpaceImages(
        images: Express.Multer.File[],
        userId: string,
    ): Promise<string[]> {
        const uploadedImages: string[] = [];
        for (const image of images) {
            const { url } = await this.storageService.uploadImage(
                image,
                'spaces',
                userId,
            );
            uploadedImages.push(url);
        }
        return uploadedImages;
    }

    private async uploadSpacePdfs(
        pdfs: Express.Multer.File[],
        userId: string,
    ): Promise<string[]> {
        const uplodaedPdfs: string[] = [];
        for (const pdf of pdfs) {
            const { url } = await this.storageService.uploadPdf(
                pdf,
                'spaces',
                userId,
            );
            uplodaedPdfs.push(url);
        }
        return uplodaedPdfs;
    }
}
