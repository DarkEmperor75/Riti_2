import {
    Injectable,
    BadRequestException,
    InternalServerErrorException,
    Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

type BucketType = 'events' | 'spaces' | 'profiles';

@Injectable()
export class StorageService {
    private readonly logger = new Logger(StorageService.name);
    private supabase: SupabaseClient;
    private readonly MAX_IMAGE_SIZE = 25 * 1024 * 1024;

    constructor(private configService: ConfigService) {
        const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
        const supabaseKey = this.configService.get<string>('SUPABASE_KEY');
        if (!supabaseUrl || !supabaseKey) {
            this.logger.warn(
                '⚠️ Supabase not configured - file uploads (avatars, resumes, reports) will not work. Set SUPABASE_URL and SUPABASE_KEY to enable file storage.',
            );
            return;
        }

        this.supabase = createClient(supabaseUrl, supabaseKey, {
            auth: {
                persistSession: false,
                autoRefreshToken: false,
            },
        });

        this.logger.log('✅ Supabase storage initialized successfully');
    }

    async uploadImage(
        file: Express.Multer.File,
        bucket: BucketType,
        userId: string,
    ): Promise<{ url: string; fileName: string; size: number }> {
        if (!this.supabase) {
            throw new InternalServerErrorException(
                'File storage not available. Storage is not configured',
            );
        }

        const allowedTypes = [
            'image/jpeg',
            'image/jpg',
            'image/png',
            'image/webp',
        ];

        if (!allowedTypes.includes(file.mimetype)) {
            throw new BadRequestException(
                'Invalid file type. Allowed: jpg, png, webp',
            );
        }

        const maxSize = this.MAX_IMAGE_SIZE;

        if (file.size > maxSize)
            throw new BadRequestException('File size exceeds 5MB limit');

        const fileExt = file.originalname.split('.').pop();
        const fileName = `${userId}/${uuidv4()}.${fileExt}`;

        try {
            this.logger.log('Uploading image to Supabase storage');

            const { data, error } = await this.supabase.storage
                .from(bucket)
                .upload(fileName, file.buffer, {
                    contentType: file.mimetype,
                    upsert: false,
                });

            if (error)
                throw new InternalServerErrorException(
                    `Upload failed: ${error.message}`,
                );

            this.logger.log(`File uploaded successfully to ${data.path}`);

            const { data: urlData } = this.supabase.storage
                .from(bucket)
                .getPublicUrl(fileName);

            return {
                url: urlData.publicUrl,
                fileName: fileName,
                size: file.size,
            };
        } catch (error) {
            this.logger.error(
                'Error uploading image to Supabase storage',
                error,
            );
            throw new InternalServerErrorException(
                'Error uploading image to Supabase storage',
            );
        }
    }

    async uploadPdf(
        file: Express.Multer.File,
        bucket: BucketType,
        userId: string,
    ): Promise<{ url: string; fileName: string; size: number }> {
        if (!this.supabase) {
            throw new InternalServerErrorException(
                'File storage not available. Storage is not configured',
            );
        }

        if (file.mimetype !== 'application/pdf')
            throw new BadRequestException(
                'Invalid file type. Only PDF is allowed',
            );

        const maxSize = this.MAX_IMAGE_SIZE;

        if (file.size > maxSize)
            throw new BadRequestException('File size exceeds 25MB limit');

        const fileName = `${userId}/${uuidv4()}.pdf`;

        try {
            this.logger.log('Uploading PDF to Supabase storage');

            const { data, error } = await this.supabase.storage
                .from(bucket)
                .upload(fileName, file.buffer, {
                    contentType: 'application/pdf',
                    upsert: false,
                });

            if (error) {
                throw new InternalServerErrorException(
                    `Upload failed: ${error.message}`,
                );
            }

            this.logger.log(`PDF uploaded successfully to ${data.path}`);

            const { data: urlData } = this.supabase.storage
                .from(bucket)
                .getPublicUrl(fileName);

            return {
                url: urlData.publicUrl,
                fileName,
                size: file.size,
            };
        } catch (error) {
            this.logger.error('Error uploading PDF to Supabase storage', error);
            throw new InternalServerErrorException(
                'Error uploading PDF to Supabase storage',
            );
        }
    }

    async deleteFile(
        fileName: string,
        bucket: 'events' | 'spaces' | 'profiles',
    ): Promise<void> {
        const { error } = await this.supabase.storage
            .from(bucket)
            .remove([fileName]);

        if (error) {
            throw new InternalServerErrorException(
                `Delete failed: ${error.message}`,
            );
        }
    }
}
