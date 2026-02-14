"use client"

import Link from "next/link"
import Hero from "@/components/Hero"
import Footer from "@/components/Footer"
import { useEffect, useRef, useState } from "react"
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
gsap.registerPlugin(ScrollTrigger)
import Image from "next/image"

export default function ClassesPage() {
	const floatRef = useRef<HTMLDivElement | null>(null)
	const imgRef = useRef<HTMLImageElement | null>(null)
	const rootRef = useRef<HTMLElement | null>(null)
	const target = useRef({ x: 0, y: 0 })
	const current = useRef({ x: 0, y: 0 })
	const rafRef = useRef<number | null>(null)
	const [visible, setVisible] = useState(false)
	const [src, setSrc] = useState("")
	const [side, setSide] = useState<'left' | 'right'>('right')
	// adjust this to move the preview further down (pixels)
	const baseYOffset = 100

	useEffect(() => {
		// GSAP mount animations (headings + list items) with ScrollTrigger so they replay on scroll
			if (rootRef.current) {
				const ctx = gsap.context(() => {
				// animate each `.class-section` individually in sequence when it enters the viewport
				// this creates a per-section timeline: heading -> paragraph/lines -> links
				// use fromTo or set initial state to avoid FOUC (flash of unstyled content)
				const sections = gsap.utils.toArray('.class-section') as Element[]
				// animate the page heading first
				gsap.fromTo('.classes-heading', { y: 28, opacity: 0 }, { y: 0, opacity: 1, duration: 1.1, ease: 'power3.out', delay: 0.06 })

				const sectionTls: gsap.core.Timeline[] = []
				sections.forEach((section) => {
					const secTl = gsap.timeline({ paused: true })

					// heading: animate words if present, otherwise animate the h2 element
					const h2 = section.querySelector('h2')
					const h2Words = h2 ? h2.querySelectorAll('.stagger-word') : null
					if (h2Words && h2Words.length) {
						secTl.fromTo(h2Words, { y: 28, opacity: 0 }, { y: 0, opacity: 1, duration: 1, ease: 'power3.out', stagger: 0.12 })
					} else if (h2) {
						secTl.fromTo(h2, { x: -36, opacity: 0 }, { x: 0, opacity: 1, duration: 1, ease: 'power3.out' })
					}

					// paragraph lines (if any) inside this section: mask reveal
					const lines = section.querySelectorAll('.stagger-line-inner')
					if (lines.length) {
						secTl.fromTo(lines, { xPercent: -100 }, { xPercent: 0, duration: 1, ease: 'power3.out', stagger: 0.12 }, '>-0.05')
					}

					// links (class-link) animate after lines
					const links = section.querySelectorAll('.class-link')
					if (links.length) {
						secTl.fromTo(links, { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: 0.9, stagger: 0.12, ease: 'power3.out' }, '>-0.05')
					}

					sectionTls.push(secTl)
				})

					// trigger the first section's timeline when it enters view, then chain completions
					if (sectionTls.length) {
						const firstSection = sections[0]
						ScrollTrigger.create({
							trigger: firstSection,
							start: 'top 80%',
							onEnter: () => sectionTls[0].play(),
							onEnterBack: () => sectionTls[0].play(),
						})

						// chain: when a timeline completes, play the next
						sectionTls.forEach((tl, idx) => {
							tl.eventCallback('onComplete', () => {
								if (idx + 1 < sectionTls.length) sectionTls[idx + 1].play()
							})
						})
					}
				}, rootRef)

				// clean up gsap context when unmounting
				return () => ctx.revert()
			}

		let mounted = true
		function step() {
			// follow only the Y axis with easing so the preview stays anchored right
			current.current.y += (target.current.y - current.current.y) * 0.14
			if (floatRef.current) {
				floatRef.current.style.transform = `translate3d(0px, ${current.current.y + baseYOffset}px, 0)`
			}
			rafRef.current = requestAnimationFrame(step)
		}

		if (mounted) rafRef.current = requestAnimationFrame(step)
		return () => {
			mounted = false
			if (rafRef.current) cancelAnimationFrame(rafRef.current)
		}
	}, [])

	function animateSectionHover(section: 'contemporary' | 'hiphop', enter: boolean) {
		const base = section === 'contemporary' ? '.contemporary-dance' : '.hip-hop-dance'
		if (enter) {
			gsap.to(base + ' h2', { y: -6, scale: 1.02, duration: 0.35, ease: 'power1.out' })
			gsap.to(base + ' .class-link', { x: section === 'contemporary' ? 6 : -6, opacity: 1, stagger: 0.05, duration: 0.28 })
		} else {
			gsap.to(base + ' h2', { y: 0, scale: 1, duration: 0.45, ease: 'power2.out' })
			gsap.to(base + ' .class-link', { x: 0, opacity: 1, stagger: 0.03, duration: 0.35 })
		}
	}

	function updateTargetFromEvent(e: React.MouseEvent) {
		// preview is anchored to the right; only track Y (vertical) movement
		const offsetY = -60 // position the center of the gif slightly above cursor
		target.current.y = e.clientY + offsetY
	}

	function handleEnter(gif: string, which: 'left' | 'right' = 'right') {
		return (e: React.MouseEvent) => {
			setSrc(gif)
			setSide(which)
			setVisible(true)
			updateTargetFromEvent(e)
			// set immediate position so it doesn't jump to top before RAF
			if (floatRef.current) {
				floatRef.current.style.transform = `translate3d(0px, ${target.current.y + baseYOffset}px, 0)`
			}
		}
	}

	function handleMove(e: React.MouseEvent) {
		updateTargetFromEvent(e)
		if (floatRef.current) {
			floatRef.current.style.transform = `translate3d(0px, ${target.current.y + baseYOffset}px, 0)`
		}
	}

	function handleLeave() {
		setVisible(false)
	}

	return (
		<main ref={rootRef} className="col-span-full row-span-full grid grid-cols-subgrid grid-rows-subgrid">
			<Hero className="col-span-8 row-span-12 col-start-1 row-start-1" />

			{/* floating GIF container (fixed so it sits above content) */}
			<div
				ref={floatRef}
				className={`fixed top-0 z-50 pointer-events-none transition-opacity duration-200 ${
					visible ? 'opacity-100' : 'opacity-0'
				} ${side === 'right' ? 'right-120' : 'left-120'}`}
				style={{transform: `translate3d(0px, ${current.current.y}px, 0)`}}
			>
				{src && (
					<Image
						src={src}
						alt="preview"
						width={420}
						height={630}
						className="w-[420px] h-auto rounded shadow-lg pointer-events-none select-none"
						style={{
							transform: 'translate3d(0px, -50%, 0)',
							position: 'relative',
							top: '0',
						}}
					/>
				)}
			</div>

			<div className="col-span-8 row-span-12 col-start-1 row-start-1 grid grid-cols-subgrid grid-rows-subgrid">
				<h1 className="classes-heading col-span-1 col-start-1 row-start-3 text-3xl uppercase">
					Les cours proposés
				</h1>
				<section
					className="contemporary-dance class-section row-span-full grid grid-rows-subgrid"
					onMouseEnter={(e) => { handleEnter('/videos/contemporary.gif', 'right')(e); animateSectionHover('contemporary', true); }}
					onMouseMove={handleMove}
					onMouseLeave={() => { handleLeave(); animateSectionHover('contemporary', false); }}
				>
					<h2 className="text-3xl uppercase col-start-2 row-start-5">
						Danse Contemporaine
					</h2>
					<ul className=" text-3xl uppercase col-start-2 row-span-full grid grid-cols-subgrid grid-rows-subgrid z-10">
						<li className="row-start-6">
							<Link className="class-link" href="/classes/contemporary-dance/initiation">
								Initiation
							</Link>
						</li>
						<li className="row-start-8">
							<Link className="class-link" href="/classes/contemporary-dance/all-levels">
								Tous niveaux
							</Link>
						</li>
						<li className="row-start-10">
							<Link className="class-link" href="/classes/contemporary-dance/advanced">Avancé</Link>
						</li>
					</ul>
				</section>
				<section
					className="hip-hop-dance class-section col-start-6 row-span-full grid grid-rows-subgrid"
					onMouseEnter={(e) => { handleEnter('/videos/hiphop.gif', 'left')(e); animateSectionHover('hiphop', true); }}
					onMouseMove={handleMove}
					onMouseLeave={() => { handleLeave(); animateSectionHover('hiphop', false); }}
				>
					<h2 className="text-3xl uppercase col-start-6 row-start-5 justify-self-end">
						Hip-hop
					</h2>
					<ul className="text-3xl uppercase col-start-6 row-span-full grid grid-cols-subgrid grid-rows-subgrid z-10">
						<li className="row-start-6 justify-self-end">
							<Link className="class-link" href="/classes/hip-hop-dance/initiation">Initiation</Link>
						</li>
						<li className="row-start-8 justify-self-end">
							<Link className="class-link" href="/classes/hip-hop-dance/all-levels">Tous niveaux</Link>
						</li>
						<li className="row-start-10 justify-self-end">
							<Link className="class-link" href="/classes/hip-hop-dance/advanced">Avancé</Link>
						</li>
					</ul>
				</section>
			</div>
			<Footer />
		</main>
	);
}
