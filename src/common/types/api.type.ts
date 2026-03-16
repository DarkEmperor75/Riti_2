export type ApiOk<T, Meta> = {
    success: true;
    data: T;
    warnings?: string[];
    meta?: Meta;
};

export type ApiFail<Code> = {
    success: false;
    error: {
        code: Code;
        message: string;
        details?: unknown;
    };
};

export type ApiResponse<T, Meta, Code> = ApiOk<T, Meta> | ApiFail<Code>;
