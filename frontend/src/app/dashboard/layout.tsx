'use client';

import { useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';

const navigation = [
	{ name: 'Tasks', href: '/dashboard/tasks' },
	{ name: 'My Posted', href: '/dashboard/my-posted' },
	{ name: 'My Claimed', href: '/dashboard/my-claimed' },
	{ name: 'Leaderboard', href: '/dashboard/leaderboard' },
	{ name: 'Transactions', href: '/dashboard/transactions' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
	const { user, profile, loading, signOut } = useAuth();
	const router = useRouter();
	const pathname = usePathname();

	console.log('[Dashboard Layout]', { loading, hasUser: !!user, hasProfile: !!profile, pathname });

	// Handle redirects in useEffect to avoid render issues
	useEffect(() => {
		console.log('[Dashboard Layout] useEffect', {
			loading,
			hasUser: !!user,
			hasProfile: !!profile,
			pathname,
		});
		if (!loading) {
			if (!user) {
				console.log('[Dashboard Layout] Redirecting to /auth - no user');
				router.push('/auth');
			} else if (!profile && pathname !== '/dashboard/profile/setup') {
				console.log('[Dashboard Layout] Redirecting to /dashboard/profile/setup - no profile');
				router.push('/dashboard/profile/setup');
			} else if (profile && pathname === '/dashboard/profile/setup') {
				console.log('[Dashboard Layout] Profile exists, redirecting away from setup page');
				router.push('/dashboard/tasks');
			}
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [loading, user, profile, pathname]);

	// Show loading state while auth is initializing
	if (loading) {
		console.log('[Dashboard Layout] Rendering loading - auth initializing');
		return (
			<div className="min-h-screen flex-center">
				<Skeleton className="w-32 h-32 rounded-full" />
			</div>
		);
	}

	// Show loading state while redirecting
	if (!user) {
		console.log('[Dashboard Layout] Rendering loading - no user');
		return (
			<div className="min-h-screen flex-center">
				<Skeleton className="w-32 h-32 rounded-full" />
			</div>
		);
	}

	// Show loading state while redirecting to profile setup
	if (!profile && pathname !== '/dashboard/profile/setup') {
		console.log('[Dashboard Layout] Rendering loading - no profile, redirecting to setup');
		return (
			<div className="min-h-screen flex-center">
				<Skeleton className="w-32 h-32 rounded-full" />
			</div>
		);
	}

	console.log('[Dashboard Layout] Rendering dashboard');

	const handleSignOut = async () => {
		await signOut();
		router.push('/');
	};

	const getInitials = (name: string) => {
		if (!name) return 'U';
		return name
			.split(' ')
			.map((n) => n[0])
			.join('')
			.toUpperCase()
			.slice(0, 2);
	};

	return (
		<div className="min-h-screen flex flex-col">
			<header className="border-b border-neutral-300 dark:border-neutral-700">
				<div className="w-[90vw] md:w-[92.5vw] lg:w-[95vw] mx-auto">
					<div className="flex-between h-16">
						<Link href="/dashboard/tasks" className="text-h5 font-heading font-semibold">
							Summit
						</Link>

						<nav className="hidden md:flex items-center gap-6">
							{navigation.map((item) => (
								<Link
									key={item.href}
									href={item.href}
									className={`text-base ${
										pathname === item.href
											? 'text-primary-700 dark:text-primary-500 font-medium'
											: 'text-neutral-700 dark:text-neutral-300 hover:text-primary-700 dark:hover:text-primary-500'
									}`}
								>
									{item.name}
								</Link>
							))}
						</nav>

						<div className="flex items-center gap-4">
							{profile && (
								<div className="text-right hidden sm:block">
									<p className="text-sm font-medium">{profile.name}</p>
									<p className="text-small text-neutral-500">{profile.credits} credits</p>
								</div>
							)}

							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button variant="ghost" className="relative h-10 w-10 rounded-full">
										<Avatar>
											{profile?.avatar_url && <AvatarImage src={profile.avatar_url} />}
											<AvatarFallback>{profile ? getInitials(profile.name) : 'U'}</AvatarFallback>
										</Avatar>
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent align="end">
									<DropdownMenuItem onClick={() => router.push('/dashboard/profile')}>
										Profile
									</DropdownMenuItem>
									<DropdownMenuItem onClick={handleSignOut}>Sign out</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						</div>
					</div>
				</div>
			</header>

			<main className="flex-1 w-[90vw] md:w-[92.5vw] lg:w-[95vw] mx-auto py-8">{children}</main>
		</div>
	);
}
