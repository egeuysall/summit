'use client';

import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';

export function useApi() {
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const { user, loading: authLoading, getAccessToken } = useAuth();

	const getToken = useCallback(async () => {
		// Wait for auth to finish loading
		if (authLoading) {
			return null;
		}

		// Check if user is authenticated
		if (!user) {
			return null;
		}

		try {
			// Add timeout to prevent hanging
			const tokenPromise = getAccessToken();
			const timeoutPromise = new Promise<null>((resolve) =>
				setTimeout(() => {
					resolve(null);
				}, 5000)
			);

			const token = await Promise.race([tokenPromise, timeoutPromise]);
			return token;
		} catch (error) {
			console.error('[useApi] getToken error:', error);
			return null;
		}
	}, [getAccessToken, user, authLoading]);

	const execute = useCallback(
		async <T>(fn: (token: string) => Promise<T>): Promise<T | null> => {
			// Don't execute if auth is still loading
			if (authLoading) {
				return null;
			}

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
				const errorMessage = err instanceof Error ? err.message : 'An error occurred';
				console.error('[useApi] Error:', errorMessage, err);
				setError(errorMessage);
				return null;
			} finally {
				setLoading(false);
			}
		},
		[getToken, authLoading, user]
	);

	const executeWhenReady = useCallback(
		async <T>(fn: (token: string) => Promise<T>): Promise<T | null> => {
			if (authLoading) {
				return null;
			}

			return execute(fn);
		},
		[execute, authLoading]
	);

	return {
		execute,
		executeWhenReady,
		loading,
		error,
		getToken,
		authLoading,
		isReady: !authLoading && !!user,
	};
}
