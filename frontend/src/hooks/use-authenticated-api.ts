'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useApi } from '@/hooks/use-api';

export function useAuthenticatedApi() {
	const { user, loading: authLoading } = useAuth();
	const { execute, loading: apiLoading, error } = useApi();
	const [isReady, setIsReady] = useState(false);

	useEffect(() => {
		setIsReady(!authLoading && !!user);
	}, [authLoading, user]);

	const executeWhenReady = useCallback(
		async <T>(fn: (token: string) => Promise<T>): Promise<T | null> => {
			if (!isReady) {
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
