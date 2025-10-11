'use client';

import { useState, useEffect } from 'react';
import { useApi } from '@/hooks/use-api';
import { apiClient } from '@/lib/api/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/auth-context';
import type { Transaction } from '@/types/other';

export default function TransactionsPage() {
	const [transactions, setTransactions] = useState<Transaction[]>([]);
	const [loading, setLoading] = useState(true);
	const { executeWhenReady, authLoading } = useApi();
	const { loading: authContextLoading } = useAuth();

	useEffect(() => {
		// Only fetch transactions when auth is ready
		if (!authContextLoading && !authLoading) {
			fetchTransactions();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [authContextLoading, authLoading]);

	const fetchTransactions = async () => {
		console.log('[Transactions] Fetching transactions...');
		const result = await executeWhenReady((token) => apiClient.getTransactions(token, 50));
		console.log('[Transactions] Fetch result:', result);

		// Handle both direct array and {data: array} response formats
		let transactionsData: Transaction[] = [];
		if (result) {
			if (Array.isArray(result)) {
				transactionsData = result;
			} else if (result.data && Array.isArray(result.data)) {
				transactionsData = result.data;
			}
		}

		console.log('[Transactions] Setting transactions, count:', transactionsData.length);
		setTransactions(transactionsData);
		setLoading(false);
	};

	const getTransactionColor = (amount: number) => {
		return amount > 0 ? 'text-success-700' : 'text-error-700';
	};

	const formatAmount = (amount: number) => {
		return amount > 0 ? `+${amount}` : amount;
	};

	// Show loading while auth is initializing or while fetching transactions
	if (authContextLoading || authLoading || loading) {
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
			<h1 className="text-h3 font-heading font-semibold">Transaction history</h1>

			{transactions.length === 0 ? (
				<div className="text-center py-12">
					<p className="text-large text-neutral-500">No transactions yet.</p>
				</div>
			) : (
				<div className="space-y-4">
					{transactions.map((transaction) => (
						<Card key={transaction.id}>
							<CardContent className="p-4">
								<div className="flex items-center justify-between">
									<div className="flex-1">
										<div className="flex items-center gap-2 mb-1">
											<Badge variant="outline">{transaction.transaction_type}</Badge>
											<span className="text-small text-neutral-500">
												{new Date(transaction.created_at).toLocaleDateString('en-US', {
													year: 'numeric',
													month: 'short',
													day: 'numeric',
													hour: '2-digit',
													minute: '2-digit',
												})}
											</span>
										</div>
										{transaction.description && (
											<p className="text-base text-neutral-700 dark:text-neutral-300">
												{transaction.description}
											</p>
										)}
									</div>

									<div
										className={`text-h5 font-semibold ${getTransactionColor(transaction.amount)}`}
									>
										{formatAmount(transaction.amount)} credits
									</div>
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			)}
		</div>
	);
}
