import Link from "next/link";

export default function Header() {
  return (
    <header className="flex items-center justify-between p-5 text-3xl uppercase fixed w-full z-10">
      <Link href="/"><h1>Studio Pulsation</h1></Link>
      <nav>
        <ul className="flex space-x-3.5">
          <li>
            <Link href="/classes">Nos Cours</Link>
          </li>
          <li>
            <Link href="/the-team">L&apos;équipe</Link>
          </li>
          <li>
            <Link href="/join">Inscription</Link>
          </li>
        </ul>
      </nav>
    </header>
  );
}
