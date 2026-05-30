import type { Request } from 'express';

export interface AuthenticatedRequest extends Request {
  userId?: string;
  authMethod?: 'supabase' | 'apikey';
}

export interface ApiKeyRecord {
  id: string;
  user_id: string;
  key_hash: string;
  name: string;
  scopes: string[];
  created_at: string;
  last_used_at: string | null;
  expires_at: string | null;
  is_active: boolean;
}

export interface PaginationParams {
  page: number;
  limit: number;
  offset: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
