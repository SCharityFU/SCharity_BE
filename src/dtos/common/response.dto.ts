// ── Common response wrappers ────────────────────────────────────────────────

export interface ApiResponseDto<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errors?: unknown;
}

export interface PaginationMetaDto {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginatedResponseDto<T> {
  success: boolean;
  message: string;
  data: T[];
  pagination: PaginationMetaDto;
}

export interface MessageOnlyResponseDto {
  success: boolean;
  message: string;
  data: null;
}
