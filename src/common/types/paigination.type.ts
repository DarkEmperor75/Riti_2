export type PaginationMeta = {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
};

export type Paginated<T> = {
    items: T[];
    meta: PaginationMeta;
};

export type PaginatedQuery<T> = { page: number; limit: number; status?: T };
