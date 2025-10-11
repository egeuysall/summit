'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { apiClient } from '@/lib/api/client';
import type { Profile } from '@/types/profiles';

interface AuthContextType {
	user: User | null;
	profile: Profile | null;
	loading: boolean;
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
	const supabase = createClient();

	const fetchProfile = async (currentUser: User) => {
		try {
			const session = await supabase.auth.getSession();
			const token = session.data.session?.access_token;
			if (token) {
				const profileData = await apiClient.getProfile(token);
				setProfile(profileData);
			}
		} catch (error) {
			console.error('Error fetching profile:', error);
			setProfile(null);
		}
	};

	const refreshProfile = async () => {
		if (user) {
			await fetchProfile(user);
		}
	};

	useEffect(() => {
		const initAuth = async () => {
			try {
				const {
					data: { session },
				} = await supabase.auth.getSession();

				setUser(session?.user ?? null);
				if (session?.user) {
					await fetchProfile(session.user);
				}
			} catch (error) {
				console.error('Error initializing auth:', error);
			} finally {
				setLoading(false);
			}
		};

		initAuth();

		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange(async (_event, session) => {
			setUser(session?.user ?? null);
			if (session?.user) {
				await fetchProfile(session.user);
			} else {
				setProfile(null);
			}
		});

		return () => {
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
