import Link from "next/link";

export default function Footer() {
  return (
		<footer className="text-3xl uppercase row-start-12 col-start-8 z-10">
			<nav>
				<ul>
					<li>
						<Link href="/gallery">Galerie</Link>
					</li>
				</ul>
			</nav>
		</footer>
	);
}
