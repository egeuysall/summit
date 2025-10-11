'use client';

import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';

export function useApi() {
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const { user, loading: authLoading, getAccessToken } = useAuth();

	const getToken = useCallback(async () => {
		console.log('[useApi] getToken called, authLoading:', authLoading, 'user:', !!user);

		// Wait for auth to finish loading
		if (authLoading) {
			console.log('[useApi] getToken: auth still loading');
			return null;
		}

		// Check if user is authenticated
		if (!user) {
			console.log('[useApi] getToken: no user');
			return null;
		}

		console.log('[useApi] getToken: calling getAccessToken...');
		try {
			// Add timeout to prevent hanging
			const tokenPromise = getAccessToken();
			const timeoutPromise = new Promise<null>((resolve) =>
				setTimeout(() => {
					console.log('[useApi] getToken: timeout reached');
					resolve(null);
				}, 5000)
			);

			const token = await Promise.race([tokenPromise, timeoutPromise]);
			console.log('[useApi] getToken: token retrieved:', !!token);
			return token;
		} catch (error) {
			console.error('[useApi] getToken error:', error);
			return null;
		}
	}, [getAccessToken, user, authLoading]);

	const execute = useCallback(
		async <T>(fn: (token: string) => Promise<T>): Promise<T | null> => {
			console.log('[useApi] Execute called, authLoading:', authLoading, 'user:', !!user);

			// Don't execute if auth is still loading
			if (authLoading) {
				console.log('[useApi] Auth still loading, skipping execution');
				return null;
			}

			setLoading(true);
			setError(null);
			try {
				console.log('[useApi] Getting token...');
				const token = await getToken();
				console.log('[useApi] Token received:', !!token);
				if (!token) {
					throw new Error('Not authenticated');
				}
				console.log('[useApi] Executing function...');
				const result = await fn(token);
				console.log('[useApi] Function executed successfully, result:', !!result);
				return result;
			} catch (err) {
				const errorMessage = err instanceof Error ? err.message : 'An error occurred';
				console.error('[useApi] Error:', errorMessage, err);
				setError(errorMessage);
				return null;
			} finally {
				console.log('[useApi] Setting loading to false');
				setLoading(false);
			}
		},
		[getToken, authLoading, user]
	);

	const executeWhenReady = useCallback(
		async <T>(fn: (token: string) => Promise<T>): Promise<T | null> => {
			// Wait for auth to be ready
			if (authLoading) {
				console.log('[useApi] Waiting for auth to be ready...');
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
