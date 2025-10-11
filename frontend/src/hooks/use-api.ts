'use client';

import { useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

export function useApi() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const getToken = useCallback(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session?.access_token;
  }, [supabase]);

  const execute = useCallback(
    async <T,>(fn: (token: string) => Promise<T>): Promise<T | null> => {
      setLoading(true);
      setError(null);
      try {
        const token = await getToken();
        if (!token) {
          throw new Error('Not authenticated');
        }
        const result = await fn(token);
        return result;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'An error occurred';
        setError(errorMessage);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [getToken]
  );

  return { execute, loading, error, getToken };
}
