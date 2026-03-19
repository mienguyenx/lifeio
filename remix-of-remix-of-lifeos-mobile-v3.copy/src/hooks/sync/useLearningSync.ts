import { useCallback, useEffect } from 'react';
import { activeSupabase as supabase, ensureValidSession } from '@/integrations/supabase/externalClient';
import { useAuth } from '@/hooks/useAuth';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { useSyncQueue } from './useSyncQueue';
import type { Database } from '@/integrations/supabase/types';

export interface Course {
  id: string;
  title: string;
  description?: string;
  category: string;
  totalLessons: number;
  completedLessons: number;
  status: 'not_started' | 'in_progress' | 'completed';
  startedAt?: string;
  completedAt?: string;
  notes?: string;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  totalPages: number;
  currentPage: number;
  status: 'want_to_read' | 'reading' | 'completed';
  rating?: number;
  notes?: string;
  startedAt?: string;
  completedAt?: string;
}

type CourseRow = Database['public']['Tables']['learning_courses']['Row'];
type BookRow = Database['public']['Tables']['learning_books']['Row'];

// Transform Supabase row to local Course type
function transformCourseFromDB(row: CourseRow): Course {
  return {
    id: row.id,
    title: row.title,
    description: row.description || undefined,
    category: row.category,
    totalLessons: row.total_lessons,
    completedLessons: row.completed_lessons,
    status: row.status as Course['status'],
    startedAt: row.started_at || undefined,
    completedAt: row.completed_at || undefined,
    notes: row.notes || undefined,
  };
}

// Transform Supabase row to local Book type
function transformBookFromDB(row: BookRow): Book {
  return {
    id: row.id,
    title: row.title,
    author: row.author,
    totalPages: row.total_pages,
    currentPage: row.current_page,
    status: row.status as Book['status'],
    rating: row.rating || undefined,
    notes: row.notes || undefined,
    startedAt: row.started_at || undefined,
    completedAt: row.completed_at || undefined,
  };
}

// Transform local Course to Supabase insert/update format
function transformCourseToDB(course: Partial<Course>, userId: string) {
  return {
    id: course.id,
    user_id: userId,
    title: course.title,
    description: course.description || null,
    category: course.category,
    total_lessons: course.totalLessons || 0,
    completed_lessons: course.completedLessons || 0,
    status: course.status || 'not_started',
    started_at: course.startedAt || null,
    completed_at: course.completedAt || null,
    notes: course.notes || null,
  };
}

// Transform local Book to Supabase insert/update format
function transformBookToDB(book: Partial<Book>, userId: string) {
  return {
    id: book.id,
    user_id: userId,
    title: book.title,
    author: book.author,
    total_pages: book.totalPages || 0,
    current_page: book.currentPage || 0,
    status: book.status || 'want_to_read',
    rating: book.rating || null,
    notes: book.notes || null,
    started_at: book.startedAt || null,
    completed_at: book.completedAt || null,
  };
}

// Transform partial updates only
function transformCourseUpdatesToDB(updates: Partial<Course>): Record<string, unknown> {
  const data: Record<string, unknown> = {};
  
  if ('title' in updates) data.title = updates.title;
  if ('description' in updates) data.description = updates.description || null;
  if ('category' in updates) data.category = updates.category;
  if ('totalLessons' in updates) data.total_lessons = updates.totalLessons;
  if ('completedLessons' in updates) data.completed_lessons = updates.completedLessons;
  if ('status' in updates) data.status = updates.status;
  if ('startedAt' in updates) data.started_at = updates.startedAt || null;
  if ('completedAt' in updates) data.completed_at = updates.completedAt || null;
  if ('notes' in updates) data.notes = updates.notes || null;
  
  return data;
}

function transformBookUpdatesToDB(updates: Partial<Book>): Record<string, unknown> {
  const data: Record<string, unknown> = {};
  
  if ('title' in updates) data.title = updates.title;
  if ('author' in updates) data.author = updates.author;
  if ('totalPages' in updates) data.total_pages = updates.totalPages;
  if ('currentPage' in updates) data.current_page = updates.currentPage;
  if ('status' in updates) data.status = updates.status;
  if ('rating' in updates) data.rating = updates.rating || null;
  if ('notes' in updates) data.notes = updates.notes || null;
  if ('startedAt' in updates) data.started_at = updates.startedAt || null;
  if ('completedAt' in updates) data.completed_at = updates.completedAt || null;
  
  return data;
}

export function useLearningSync() {
  const { user } = useAuth();
  const { isOnline } = useOnlineStatus();
  const { queueChange } = useSyncQueue();
  
  // Debug logging
  useEffect(() => {
    console.log('[LearningSync] Hook initialized - user:', user?.id, 'isOnline:', isOnline);
  }, [user?.id, isOnline]);

  // Load courses from Supabase
  const loadCourses = useCallback(async (): Promise<Course[]> => {
    if (!user) {
      console.log('[LearningSync] No user, skipping load courses');
      return [];
    }

    try {
      console.log('[LearningSync] Loading courses for user:', user.id);
      await ensureValidSession();
      
      const { data, error } = await supabase
        .from('learning_courses')
        .select('*')
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[LearningSync] Error loading courses:', error);
        throw error;
      }

      console.log('[LearningSync] Loaded', data?.length || 0, 'courses');
      return (data || []).map(transformCourseFromDB);
    } catch (error) {
      console.error('[LearningSync] Error loading courses:', error);
      return [];
    }
  }, [user]);

  // Load books from Supabase
  const loadBooks = useCallback(async (): Promise<Book[]> => {
    if (!user) {
      console.log('[LearningSync] No user, skipping load books');
      return [];
    }

    try {
      console.log('[LearningSync] Loading books for user:', user.id);
      await ensureValidSession();
      
      const { data, error } = await supabase
        .from('learning_books')
        .select('*')
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[LearningSync] Error loading books:', error);
        throw error;
      }

      console.log('[LearningSync] Loaded', data?.length || 0, 'books');
      return (data || []).map(transformBookFromDB);
    } catch (error) {
      console.error('[LearningSync] Error loading books:', error);
      return [];
    }
  }, [user]);

  // Save course to Supabase
  const saveCourse = useCallback(async (course: Course): Promise<boolean> => {
    if (!user) return false;

    const data = transformCourseToDB(course, user.id);

    if (!isOnline) {
      await queueChange('create', 'learning_courses', course.id, data);
      return true;
    }

    try {
      await ensureValidSession();
      
      console.log('[LearningSync] Saving course to Supabase:', course.title, data);
      const { error } = await supabase
        .from('learning_courses')
        .upsert(data);

      if (error) {
        console.error('[LearningSync] Error saving course:', error);
        throw error;
      }
      
      console.log('[LearningSync] Successfully saved course to Supabase:', course.title);
      return true;
    } catch (error) {
      console.error('[LearningSync] Error saving course:', error);
      await queueChange('create', 'learning_courses', course.id, data);
      return false;
    }
  }, [user, isOnline, queueChange]);

  // Update course in Supabase
  const updateCourse = useCallback(async (id: string, updates: Partial<Course>): Promise<boolean> => {
    if (!user) return false;

    const data = transformCourseUpdatesToDB(updates);

    if (!isOnline) {
      await queueChange('update', 'learning_courses', id, data);
      return true;
    }

    try {
      await ensureValidSession();
      
      const { error } = await supabase
        .from('learning_courses')
        .update(data)
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating course:', error);
      await queueChange('update', 'learning_courses', id, data);
      return false;
    }
  }, [user, isOnline, queueChange]);

  // Delete course from Supabase (soft delete)
  const deleteCourse = useCallback(async (id: string): Promise<boolean> => {
    if (!user) return false;

    if (!isOnline) {
      await queueChange('update', 'learning_courses', id, { deleted_at: new Date().toISOString() });
      return true;
    }

    try {
      await ensureValidSession();
      
      const { error } = await supabase
        .from('learning_courses')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting course:', error);
      await queueChange('update', 'learning_courses', id, { deleted_at: new Date().toISOString() });
      return false;
    }
  }, [user, isOnline, queueChange]);

  // Save book to Supabase
  const saveBook = useCallback(async (book: Book): Promise<boolean> => {
    if (!user) return false;

    const data = transformBookToDB(book, user.id);

    if (!isOnline) {
      await queueChange('create', 'learning_books', book.id, data);
      return true;
    }

    try {
      await ensureValidSession();
      
      console.log('[LearningSync] Saving book to Supabase:', book.title, data);
      const { error } = await supabase
        .from('learning_books')
        .upsert(data);

      if (error) {
        console.error('[LearningSync] Error saving book:', error);
        throw error;
      }
      
      console.log('[LearningSync] Successfully saved book to Supabase:', book.title);
      return true;
    } catch (error) {
      console.error('[LearningSync] Error saving book:', error);
      await queueChange('create', 'learning_books', book.id, data);
      return false;
    }
  }, [user, isOnline, queueChange]);

  // Update book in Supabase
  const updateBook = useCallback(async (id: string, updates: Partial<Book>): Promise<boolean> => {
    if (!user) return false;

    const data = transformBookUpdatesToDB(updates);

    if (!isOnline) {
      await queueChange('update', 'learning_books', id, data);
      return true;
    }

    try {
      await ensureValidSession();
      
      const { error } = await supabase
        .from('learning_books')
        .update(data)
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating book:', error);
      await queueChange('update', 'learning_books', id, data);
      return false;
    }
  }, [user, isOnline, queueChange]);

  // Delete book from Supabase (soft delete)
  const deleteBook = useCallback(async (id: string): Promise<boolean> => {
    if (!user) return false;

    if (!isOnline) {
      await queueChange('update', 'learning_books', id, { deleted_at: new Date().toISOString() });
      return true;
    }

    try {
      await ensureValidSession();
      
      const { error } = await supabase
        .from('learning_books')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting book:', error);
      await queueChange('update', 'learning_books', id, { deleted_at: new Date().toISOString() });
      return false;
    }
  }, [user, isOnline, queueChange]);

  return {
    loadCourses,
    loadBooks,
    saveCourse,
    updateCourse,
    deleteCourse,
    saveBook,
    updateBook,
    deleteBook,
  };
}

