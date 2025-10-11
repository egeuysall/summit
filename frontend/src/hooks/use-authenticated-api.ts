'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useApi } from '@/hooks/use-api';

export function useAuthenticatedApi() {
	const { user, loading: authLoading } = useAuth();
	const { execute, loading: apiLoading, error } = useApi();
	const [isReady, setIsReady] = useState(false);

	console.log('[useAuthenticatedApi] State:', { authLoading, hasUser: !!user, apiLoading, isReady });

	useEffect(() => {
		console.log('[useAuthenticatedApi] useEffect:', { authLoading, hasUser: !!user });
		// Auth is ready when it's not loading and we have a user
		setIsReady(!authLoading && !!user);
	}, [authLoading, user]);

	const executeWhenReady = useCallback(
		async <T>(fn: (token: string) => Promise<T>): Promise<T | null> => {
			// Don't execute if auth is not ready
			if (!isReady) {
				console.log('[useAuthenticatedApi] Auth not ready, skipping execution');
				return null;
			}

			return execute(fn);
		},
		[execute, isReady]
	);

	return {
		executeWhenReady,
		isReady,
		loading: authLoading || apiLoading,
		error,
		user,
	};
}
