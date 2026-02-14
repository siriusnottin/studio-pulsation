import type {Metadata} from 'next';
import './globals.css';
import Header from '@/components/Header';
import PageTransition from '@/components/PageTransition';

export const metadata: Metadata = {
	title: 'Studio Pulsation',
	description: "Pas qu'un simple studio de danse.",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<head>
				<link rel="stylesheet" href="https://use.typekit.net/iln2plt.css" />
			</head>
			<body className="font-medium bg-background">
				<Header />
				<PageTransition>{children}</PageTransition>
			</body>
		</html>
	);
}
