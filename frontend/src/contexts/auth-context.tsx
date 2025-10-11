'use client';

import { createContext, useContext, useEffect, useState, useRef } from 'react';
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

	const fetchProfile = async (currentUser: User, token?: string, setLoadingState = false) => {
		if (setLoadingState) {
			setLoading(true);
		}
		try {
			// Use provided token or get from cached state or fetch from session
			let tokenToUse = token || accessToken;
			if (!tokenToUse) {
				console.log('[Auth] No token provided, fetching from session...');
				const session = await supabase.auth.getSession();
				tokenToUse = session.data.session?.access_token || null;
			}

			console.log('[Auth] Fetching profile, has token:', !!tokenToUse, 'user id:', currentUser?.id);
			if (tokenToUse) {
				// Add timeout to prevent hanging
				const profileData = await Promise.race([
					apiClient.getProfile(tokenToUse),
					new Promise<never>((_, reject) =>
						setTimeout(() => reject(new Error('Profile fetch timeout')), 5000)
					)
				]);
				console.log('[Auth] Profile fetched successfully:', !!profileData);
				setProfile(profileData);
			} else {
				console.log('[Auth] No token available, setting profile to null');
				setProfile(null);
			}
		} catch (error) {
			console.error('[Auth] Error fetching profile:', error);
			// Handle different error types
			if (error instanceof Error) {
				// 404 means profile doesn't exist yet (new user) - set to null so they can create one
				if (error.message.includes('404') || error.message.includes('not found')) {
					console.log('[Auth] Profile not found (404), user needs to create profile');
					setProfile(null);
				}
				// 401 means auth error - clear profile
				else if (error.message.includes('401') || error.message.includes('unauthorized')) {
					console.log('[Auth] Auth error, clearing profile');
					setProfile(null);
				}
				// Other errors - don't clear profile, might be temporary network issue
			}
		} finally {
			if (setLoadingState) {
				setLoading(false);
			}
		}
	};

	const refreshProfile = async () => {
		if (user) {
			await fetchProfile(user);
		}
	};

	const getAccessToken = async (): Promise<string | null> => {
		try {
			console.log('[Auth] getAccessToken called, cached token:', !!accessToken);

			// Return cached token if available
			if (accessToken) {
				console.log('[Auth] getAccessToken: returning cached token');
				return accessToken;
			}

			console.log('[Auth] getAccessToken: fetching fresh session');
			const { data: { session }, error } = await supabase.auth.getSession();
			if (error) {
				console.error('[Auth] getAccessToken error:', error);
				return null;
			}
			console.log('[Auth] getAccessToken: has session:', !!session, 'has token:', !!session?.access_token);

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
				console.log('[Auth] Safety timeout reached, forcing loading to false');
				setLoading(false);
			}
		}, 5000); // 5 second safety timeout

		const initAuth = async () => {
			console.log('[Auth] Initializing auth... attempt:', initializationAttempts + 1);
			try {
				initializationAttempts++;
				const {
					data: { session },
				} = await supabase.auth.getSession();

				console.log('[Auth] Initial session:', !!session?.user, 'session id:', session?.user?.id);

				if (!mounted) return;

				setUser(session?.user ?? null);
				// Cache the access token
				if (session?.access_token) {
					console.log('[Auth] Caching access token from initial session');
					setAccessToken(session.access_token);
				}
				if (session?.user && session?.access_token) {
					await fetchProfile(session.user, session.access_token);
				}
				initializedRef.current = true;
				console.log('[Auth] Auth initialization completed successfully');
			} catch (error) {
				console.error('[Auth] Error initializing auth:', error);

				// Retry initialization if not at max attempts
				if (initializationAttempts < maxRetries && mounted) {
					console.log('[Auth] Retrying initialization in 1s...');
					setTimeout(() => {
						if (mounted) initAuth();
					}, 1000);
					return;
				}
			} finally {
				if (mounted && (initialized || initializationAttempts >= maxRetries)) {
					console.log('[Auth] Setting loading to false, initialized:', initialized);
					clearTimeout(safetyTimeout);
					setLoading(false);
				}
			}
		};

		initAuth();

		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange(async (event, session) => {
			console.log(
				'[Auth] State change:',
				event,
				!!session?.user,
				'initialized:',
				initializedRef.current,
				'user id:',
				session?.user?.id
			);

			if (!mounted) return;

			// Handle different auth events
			if (event === 'SIGNED_OUT') {
				console.log('[Auth] User signed out, clearing state');
				setUser(null);
				setProfile(null);
				setAccessToken(null);
				setLoading(false);
				return;
			}

			// Only process SIGNED_IN event (user just logged in)
			// Ignore INITIAL_SESSION completely as it's handled by initAuth
			// Don't re-fetch if already initialized (prevents infinite loop)
			if (event === 'SIGNED_IN' && !initializedRef.current) {
				console.log('[Auth] User signed in, fetching profile');
				setLoading(true);
				setUser(session?.user ?? null);
				// Cache the access token
				if (session?.access_token) {
					console.log('[Auth] Caching access token from SIGNED_IN event');
					setAccessToken(session.access_token);
				}
				if (session?.user && session?.access_token) {
					await fetchProfile(session.user, session.access_token);
				}
				setLoading(false);
			} else if (event === 'SIGNED_IN' && initializedRef.current) {
				console.log('[Auth] SIGNED_IN event received but already initialized, skipping profile fetch');
			} else if (event === 'TOKEN_REFRESHED' && session?.user) {
				console.log('[Auth] Token refreshed, updating user and profile');
				// Silently update user and profile without loading state
				setUser(session.user);
				// Update cached token
				if (session?.access_token) {
					console.log('[Auth] Updating cached access token from TOKEN_REFRESHED');
					setAccessToken(session.access_token);
				}
				await fetchProfile(session.user, session.access_token);
			}
		});

		return () => {
			mounted = false;
			clearTimeout(safetyTimeout);
			subscription.unsubscribe();
		};
	}, []);

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
