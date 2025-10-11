import { Rocket, Trophy, Users, TrendingUp, Zap } from 'lucide-react';

export const features = [
	{
		title: 'Task Marketplace',
		description: 'Browse and complete tasks to earn credits.',
		icon: <Zap size={18} />,
		imageSrc: '/images/tasks.jpg',
		colSpan: 'col-span-6 md:col-span-3 lg:col-span-2',
	},
	{
		title: 'Skill Sharing',
		description: 'Collaborate with colonists and share expertise.',
		icon: <Users size={18} />,
		imageSrc: '/images/sharing.jpg',
		colSpan: 'col-span-6 md:col-span-3 lg:col-span-2',
	},
	{
		title: 'Gamified Progression',
		description: 'Level up and compete on leaderboards.',
		icon: <Trophy size={18} />,
		imageSrc: '/images/progress.jpg',
		colSpan: 'col-span-6 md:col-span-3 lg:col-span-2',
	},
	{
		title: 'Credit Tracking',
		description: 'Monitor your earnings and progress in real-time.',
		icon: <TrendingUp size={18} />,
		imageSrc: '/images/credits.jpg',
		colSpan: 'col-span-6 md:col-span-3',
	},
	{
		title: 'Interplanetary Rewards',
		description: 'Unlock exclusive travel rewards across the galaxy.',
		icon: <Rocket size={18} />,
		imageSrc: '/images/rewards.jpg',
		colSpan: 'col-span-6 md:col-span-3',
	},
];

export default features;
