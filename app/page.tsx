"use client"

import Image from "next/image";
import Hero from '@/components/Hero';
import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
gsap.registerPlugin(ScrollTrigger)
import contemporaryDance from '@/assets/images/home/jessica-kantak-bailey-iWWNMdtAvTw-unsplash.jpg';
import hipHopDance from '@/assets/images/home/donny-jiang-VrfLmiwzXNM-unsplash.jpg';

export default function Home() {
	const rootRef = useRef<HTMLDivElement | null>(null)

	useEffect(() => {
		if (!rootRef.current) return
		const ctx = gsap.context(() => {
			// target the hero H1 specifically so its entrance restarts reliably
			const heroEl = rootRef.current!.querySelector('h1') as Element | null

			if (heroEl) {
				const heroTl = gsap.timeline({
					scrollTrigger: {
						trigger: heroEl,
						start: 'top 80%',
						// restart on re-entry so it plays again when you scroll back down
						toggleActions: 'restart none restart none'
					}
				})

				heroTl.from('.stagger-word', {
					y: 28,
					opacity: 0,
					duration: 1,
					ease: 'power3.out',
					stagger: 0.12
				})
			}

			// animate each h2 when it enters viewport so they replay on scroll
			gsap.utils.toArray('.home-h2').forEach((el) => {
				const words = (el as Element).querySelectorAll('.stagger-word')
				if (words.length) {
					gsap.from(words, {
						y: 28,
						opacity: 0,
						duration: 1,
						ease: 'power3.out',
						stagger: 0.12,
						scrollTrigger: {
							trigger: el,
							start: 'top 85%',
							toggleActions: 'play reverse play reverse'
						}
					})
				} else {
					gsap.from(el, {
						x: -36,
						opacity: 0,
						duration: 1,
						ease: 'power3.out',
						scrollTrigger: {
							trigger: el,
							start: 'top 85%',
							toggleActions: 'play reverse play reverse'
						}
					})
				}
			})

			// animate paragraphs; trigger on the parent section for reliability
			gsap.utils.toArray('.home-paragraph').forEach((el, i) => {
				const triggerEl = (el as Element).closest('section') || el
				const lines = (el as Element).querySelectorAll('.stagger-line-inner')
				if (lines.length) {
						// mask/clip reveal: slide inner from left to right inside overflow-hidden wrapper
						gsap.fromTo(lines, { xPercent: -100 }, {
						xPercent: 0,
						duration: 1,
						ease: 'power3.out',
						stagger: 0.12,
						scrollTrigger: {
							trigger: triggerEl,
							start: 'top 75%',
							toggleActions: 'play reverse play reverse'
						}
					})
				} else {
					gsap.from(el, {
						y: 18,
						opacity: 0,
						duration: 0.7,
						scrollTrigger: {
							trigger: triggerEl,
							start: 'top 75%',
							toggleActions: 'play reverse play reverse'
						}
					})
				}
			})
		}, rootRef)

		return () => ctx.revert()
	}, [])
	function renderStaggeredText(text: string) {
		return text.split(' ').map((word, i) => (
			<span key={i} className="stagger-word inline-block mr-1">
				{word}
				{i < text.split(' ').length - 1 ? '\u00A0' : ''}
			</span>
		))
	}

	function renderStaggeredLines(text: string) {
		// split into sentence-like chunks while keeping punctuation
		const parts = Array.from(text.matchAll(/[^.!?]+[.!?]*/g)).map(m => m[0].trim()).filter(Boolean)
		return parts.map((line, i) => (
			<span key={i} className="stagger-line block overflow-hidden">
				<span className="stagger-line-inner inline-block">{line}</span>
			</span>
		))
	}

	return (
		<div ref={rootRef} className="min-h-screen">
			<Hero />
			<main className="px-5">
				<h1 className="text-4xl uppercase mb-52">
					{renderStaggeredText("Pas qu’un simple studio de danse.")}
				</h1>
				<section className="contemporary-dance grid grid-cols-8 gap-3.5">
					<div className="col-span-3">
							<h2 className="text-4xl uppercase home-h2">
								{renderStaggeredText("La danse contemporaine")}
							</h2>
							<p className="text-4xl mt-12 home-paragraph">
								{renderStaggeredLines("La danse contemporaine valorise la liberté d’expression et l’exploration du mouvement. Elle encourage l’authenticité, la créativité et l’écoute de soi, en laissant place à l’expérimentation. Sur le plan physique, elle développe la mobilité, la coordination et la conscience corporelle. Elle favorise également la concentration et la gestion des émotions. En collectif, elle renforce l’écoute et la cohésion, tout en offrant un espace d’expression personnel et artistique.")}
							</p>
					</div>
					<Image
						src={contemporaryDance}
						alt="Danse contemporaine"
						sizes="(max-width: 768px) 100vw, 600px"
						className="col-span-3 col-start-6 min-h-[1080px]"
					/>
				</section>
				<section className="hip-hop-dance grid grid-cols-8 gap-3.5">
					<div className="col-span-3">
						<h2 className="text-4xl uppercase home-h2">
							{renderStaggeredText("La danse HIP HOP")}
						</h2>
						<p className="text-4xl mt-12 home-paragraph">
							{renderStaggeredLines("Le hip-hop repose sur des valeurs d’authenticité, de respect et de dépassement de soi. Issu de la culture urbaine, il met en avant l’identité et le style propre à chacun. Il développe puissance, rythme et endurance, tout en stimulant l’improvisation et la créativité. Les battles apprennent la gestion de la pression et le respect de l’autre. Le hip-hop crée un fort esprit de communauté et transmet des valeurs de solidarité et de résilience.")}
						</p>
					</div>
					<Image
						src={hipHopDance}
						alt="Danse HIP HOP"
						sizes="(max-width: 768px) 100vw, 600px"
						className="col-span-3 col-start-6 min-h-[1080px]"
					/>
				</section>
			</main>
		</div>
	);
}
