'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import type { LeaderboardEntry } from '@/types/other';

export default function LeaderboardPage() {
	const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		fetchLeaderboard();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const fetchLeaderboard = async () => {
		try {
			const result = await apiClient.getLeaderboard();
			console.log('[Leaderboard] Fetch result:', result);

			// Handle both direct array and {data: array} response formats
			let leaderboardData: LeaderboardEntry[] = [];
			if (result) {
				if (Array.isArray(result)) {
					leaderboardData = result;
				} else if (result.data && Array.isArray(result.data)) {
					leaderboardData = result.data;
				}
			}

			console.log('[Leaderboard] Setting leaderboard, count:', leaderboardData.length);
			setLeaderboard(leaderboardData);
		} catch (error) {
			console.error('Error fetching leaderboard:', error);
			setLeaderboard([]);
		} finally {
			setLoading(false);
		}
	};

	const getInitials = (name: string) => {
		return name
			.split(' ')
			.map((n) => n[0])
			.join('')
			.toUpperCase()
			.slice(0, 2);
	};

	const getRankBadge = (rank: number) => {
		if (rank === 1) return '🥇';
		if (rank === 2) return '🥈';
		if (rank === 3) return '🥉';
		return `#${rank}`;
	};

	if (loading) {
		return (
			<div className="space-y-6">
				<Skeleton className="h-10 w-64" />
				<div className="space-y-4">
					{[...Array(10)].map((_, i) => (
						<Skeleton key={i} className="h-20 w-full" />
					))}
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<h1 className="text-h3 font-heading font-semibold">Leaderboard</h1>

			{leaderboard.length === 0 ? (
				<div className="text-center py-12">
					<p className="text-large text-neutral-500">No leaderboard data available yet.</p>
				</div>
			) : (
				<div className="space-y-4">
					{leaderboard.map((entry) => (
						<Card key={entry.id} className={entry.rank <= 3 ? 'border-primary-500 border-2' : ''}>
							<CardContent className="p-4">
								<div className="flex items-center gap-4">
									<div className="text-h4 font-bold w-16 text-center">
										{getRankBadge(entry.rank)}
									</div>

									<Avatar className="h-12 w-12">
										{entry.avatar_url && <AvatarImage src={entry.avatar_url} />}
										<AvatarFallback>{getInitials(entry.name)}</AvatarFallback>
									</Avatar>

									<div className="flex-1">
										<h3 className="text-large font-semibold">{entry.name}</h3>
										<p className="text-base text-neutral-500">{entry.credits} credits earned</p>
									</div>

									{entry.rank <= 3 && (
										<Badge className="bg-primary-700 text-neutral-100">Top contributor</Badge>
									)}
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			)}
		</div>
	);
}
