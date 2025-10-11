'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { FcGoogle } from 'react-icons/fc';
import { FaGithub } from 'react-icons/fa';
import { toast } from 'sonner';

export default function AuthPage() {
	const [isSignUp, setIsSignUp] = useState(false);
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [loading, setLoading] = useState(false);
	const { signIn, signUp, signInWithProvider } = useAuth();
	const router = useRouter();

	const handleEmailAuth = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);

		try {
			if (isSignUp) {
				await signUp(email, password);
				toast.success('Account created! Please check your email to verify your account.');
			} else {
				await signIn(email, password);
				toast.success('Welcome back!');
				router.push('/dashboard');
			}
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Authentication failed');
		} finally {
			setLoading(false);
		}
	};

	const handleOAuthSignIn = async (provider: 'google' | 'github') => {
		try {
			await signInWithProvider(provider);
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'OAuth sign in failed');
		}
	};

	return (
		<div className="flex-center">
			<Card className="w-full md:w-2/4 lg:w-1/3">
				<CardHeader>
					<CardTitle>{isSignUp ? 'Create an account' : 'Welcome back'}</CardTitle>
					<CardDescription>
						{isSignUp
							? 'Sign up to start collaborating on tasks'
							: 'Sign in to your Summit account'}
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<form onSubmit={handleEmailAuth} className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="email">Email</Label>
							<Input
								id="email"
								type="email"
								placeholder="you@example.com"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								required
								disabled={loading}
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="password">Password</Label>
							<Input
								id="password"
								type="password"
								placeholder="123456"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								required
								disabled={loading}
								minLength={6}
							/>
						</div>

						<Button type="submit" className="w-full primary" disabled={loading}>
							{loading ? 'Loading...' : isSignUp ? 'Sign up' : 'Sign in'}
						</Button>
					</form>

					<div className="relative">
						<div className="absolute inset-0 flex items-center">
							<Separator />
						</div>
						<div className="relative flex justify-center text-xs uppercase">
							<span className="bg-neutral-100 dark:bg-neutral-900 px-2 text-neutral-500">or</span>
						</div>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<Button
							type="button"
							onClick={() => handleOAuthSignIn('google')}
							disabled={loading}
							className="flex justify-center items-center gap-2xs"
						>
							<FcGoogle className="w-5 h-5 grayscale brightness-500" />
							<span>Google</span>
						</Button>
						<Button
							type="button"
							onClick={() => handleOAuthSignIn('github')}
							disabled={loading}
							className="flex justify-center items-center gap-2xs"
						>
							<FaGithub className="w-5 h-5" />
							<span>GitHub</span>
						</Button>
					</div>

					<div className="flex items-center justify-center text-center text-sm">
						{isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
						<button
							type="button"
							onClick={() => setIsSignUp(!isSignUp)}
							className="text-primary-700 dark:text-primary-500 hover:underline"
							disabled={loading}
						>
							{isSignUp ? 'Sign in' : 'Sign up'}
						</button>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
