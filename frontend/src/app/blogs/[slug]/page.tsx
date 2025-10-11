import { blogs } from '@/lib/blogs';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

type PageProps = {
	params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
	return blogs.map((blog) => ({
		slug: blog.slug,
	}));
}

export default async function RecipePage({ params }: PageProps) {
	const { slug } = await params;
	const blog = blogs.find((r) => r.slug === slug);

	if (!blog) {
		notFound();
	}

	return (
		<main className="flex flex-col gap-12">
			<Link href="/" className="flex items-center gap-2xs">
				<ArrowLeft size={20} />
				<span>Go back</span>
			</Link>

			<section className="flex flex-col gap-md">
				<div className="flex flex-col gap-2xs">
					<h2>{blog.title}</h2>
				</div>
				<div className="flex flex-col gap-2xs">{blog.excerpt}</div>
				<ReactMarkdown>{blog.content}</ReactMarkdown>
			</section>
		</main>
	);
}
