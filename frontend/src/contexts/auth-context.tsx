'use client';

import { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import type { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { apiClient } from '@/lib/api/client';
import type { Profile } from '@/types/profiles';

interface AuthContextType {
	user: User | null;
	profile: Profile | null;
	loading: boolean;
	supabase: ReturnType<typeof createClient>;
	getAccessToken: () => Promise<string | null>;
	signIn: (email: string, password: string) => Promise<void>;
	signUp: (email: string, password: string) => Promise<void>;
	signInWithProvider: (provider: 'google' | 'github') => Promise<void>;
	signOut: () => Promise<void>;
	refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
	const [user, setUser] = useState<User | null>(null);
	const [profile, setProfile] = useState<Profile | null>(null);
	const [loading, setLoading] = useState(true);
	const [accessToken, setAccessToken] = useState<string | null>(null);
	const initializedRef = useRef(false);
	const supabase = createClient();

	const fetchProfile = useCallback(async (token?: string, setLoadingState = false) => {
		if (setLoadingState) {
			setLoading(true);
		}
		try {
			// Use provided token or get from cached state or fetch from session
			let tokenToUse = token || accessToken;
			if (!tokenToUse) {
				const session = await supabase.auth.getSession();
				tokenToUse = session.data.session?.access_token || null;
			}

			if (tokenToUse) {
				const profileData = await Promise.race([
					apiClient.getProfile(tokenToUse),
					new Promise<never>((_, reject) =>
						setTimeout(() => reject(new Error('Profile fetch timeout')), 5000)
					),
				]);
				setProfile(profileData);
			} else {
				setProfile(null);
			}
		} catch (error) {
			console.error('[Auth] Error fetching profile:', error);
			// Handle different error types
			if (error instanceof Error) {
				// 404 means profile doesn't exist yet (new user) - set to null so they can create one
				if (error.message.includes('404') || error.message.includes('not found')) {
					setProfile(null);
				}
				// 401 means auth error - clear profile
				else if (error.message.includes('401') || error.message.includes('unauthorized')) {
					setProfile(null);
				}
				// Other errors - don't clear profile, might be temporary network issue
			}
		} finally {
			if (setLoadingState) {
				setLoading(false);
			}
		}
	}, [accessToken, supabase.auth]);

	const refreshProfile = async () => {
		if (user) {
await fetchProfile();
		}
	};

	const getAccessToken = async (): Promise<string | null> => {
		try {
			// Return cached token if available
			if (accessToken) {
				return accessToken;
			}
			const {
				data: { session },
				error,
			} = await supabase.auth.getSession();
			if (error) {
				console.error('[Auth] getAccessToken error:', error);
				return null;
			}

			// Cache the token
			if (session?.access_token) {
				setAccessToken(session.access_token);
			}

			return session?.access_token || null;
		} catch (error) {
			console.error('[Auth] getAccessToken exception:', error);
			return null;
		}
	};

	useEffect(() => {
		let mounted = true;
		let initializationAttempts = 0;
		const maxRetries = 3;
		// Add a safety timeout to prevent infinite loading
		const safetyTimeout = setTimeout(() => {
			if (mounted && !initializedRef.current) {
				setLoading(false);
			}
		}, 5000); // 5 second safety timeout

		const initAuth = async () => {
			try {
				initializationAttempts++;
				const {
					data: { session },
				} = await supabase.auth.getSession();

				if (!mounted) return;

				setUser(session?.user ?? null);
				// Cache the access token
				if (session?.access_token) {
					setAccessToken(session.access_token);
				}
				if (session?.user && session?.access_token) {
					await fetchProfile(session.access_token);
				}
				initializedRef.current = true;
			} catch (error) {
				console.error('[Auth] Error initializing auth:', error);

				// Retry initialization if not at max attempts
				if (initializationAttempts < maxRetries && mounted) {
					setTimeout(() => {
						if (mounted) initAuth();
					}, 1000);
					return;
				}
			} finally {
				if (mounted && (initializedRef.current || initializationAttempts >= maxRetries)) {
					clearTimeout(safetyTimeout);
					setLoading(false);
				}
			}
		};

		initAuth();

		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange(async (event, session) => {
			if (!mounted) return;

			// Handle different auth events
			if (event === 'SIGNED_OUT') {
				setUser(null);
				setProfile(null);
				setAccessToken(null);
				setLoading(false);
				return;
			}

			if (event === 'SIGNED_IN' && !initializedRef.current) {
				setLoading(true);
				setUser(session?.user ?? null);
				// Cache the access token
				if (session?.access_token) {
					setAccessToken(session.access_token);
				}
				if (session?.user && session?.access_token) {
					await fetchProfile(session.access_token);
				}
				setLoading(false);
			} else if (event === 'TOKEN_REFRESHED' && session?.user) {
				// Silently update user and profile without loading state
				setUser(session.user);
				// Update cached token
				if (session?.access_token) {
					setAccessToken(session.access_token);
				}
				await fetchProfile(session.access_token);
			}
		});

		return () => {
			mounted = false;
			clearTimeout(safetyTimeout);
			subscription.unsubscribe();
		};
	}, [fetchProfile, supabase.auth]);

	const signIn = async (email: string, password: string) => {
		const { error } = await supabase.auth.signInWithPassword({
			email,
			password,
		});
		if (error) throw error;
	};

	const signUp = async (email: string, password: string) => {
		const { error } = await supabase.auth.signUp({
			email,
			password,
		});
		if (error) throw error;
	};

	const signInWithProvider = async (provider: 'google' | 'github') => {
		const { error } = await supabase.auth.signInWithOAuth({
			provider,
			options: {
				redirectTo: `${window.location.origin}/auth/callback`,
			},
		});
		if (error) throw error;
	};

	const signOut = async () => {
		const { error } = await supabase.auth.signOut();
		if (error) throw error;
		setProfile(null);
	};

	return (
		<AuthContext.Provider
			value={{
				user,
				profile,
				loading,
				supabase,
				getAccessToken,
				signIn,
				signUp,
				signInWithProvider,
				signOut,
				refreshProfile,
			}}
		>
			{children}
		</AuthContext.Provider>
	);
}

export function useAuth() {
	const context = useContext(AuthContext);
	if (context === undefined) {
		throw new Error('useAuth must be used within an AuthProvider');
	}
	return context;
}
