"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";

type Props = {
	className?: string;
	height?: number | string;
};

export default function Hero({ className, height = "100vh" }: Props) {
	const containerRef = useRef<HTMLDivElement | null>(null);
	const rafRef = useRef<number | null>(null);

	useEffect(() => {
		if (!containerRef.current) return;

		const container = containerRef.current;
		// mobile-safe `vh` handling when height is specified as `100vh`
		let didSetVh = false;
		function setVh() {
			const vh = window.innerHeight * 0.01;
			// set on the container so CSS can use it: calc(var(--vh) * 100)
			container.style.setProperty("--vh", `${vh}px`);
			// also set on documentElement for broader CSS rules if needed
			document.documentElement.style.setProperty("--vh", `${vh}px`);
		}
		if (typeof height === "string" && height.includes("vh")) {
			setVh();
			didSetVh = true;
			window.addEventListener("resize", setVh);
			window.addEventListener("orientationchange", setVh);
		}
		const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);

		// Params adapted from the p5 sketch
		const xScale = 24;
		const yScale = 24;
		const minWeight = 8.0;
		const maxWeight = 80.0;

		const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
		renderer.setPixelRatio(pixelRatio);
		// match designer background (cream) so the canvas fills the hero area
    renderer.setClearColor(0x000000, 0);
		renderer.domElement.style.width = "100%";
		renderer.domElement.style.height = "100%";
		renderer.domElement.style.display = "block";
		container.appendChild(renderer.domElement);

		const scene = new THREE.Scene();

		// We'll use an orthographic camera so positions map nicely to pixels
		const camera = new THREE.OrthographicCamera();

		let geometry: THREE.BufferGeometry | null = null;
		let points: THREE.Points | null = null;

		function build() {
			const w = container.clientWidth;
			const h = container.clientHeight;

			// Use the full container width/height for the grid so it fills the hero
			const customWidth = Math.max(64, Math.floor(w));
			const customHeight = Math.max(64, Math.floor(h));

			// compute columns/rows by dividing container by base scale, then derive exact spacing
			const cols = Math.max(2, Math.floor(customWidth / xScale));
			const rows = Math.max(2, Math.floor(customHeight / yScale));

			// spacing so the grid exactly fills the container
			const spacingX = customWidth / cols;
			const spacingY = customHeight / rows;

			const count = cols * rows;

			// Clean up previous
			if (points) {
				scene.remove(points);
				geometry?.dispose();
				(points.material as THREE.Material).dispose();
				points = null;
				geometry = null;
			}

			geometry = new THREE.BufferGeometry();

			const positions = new Float32Array(count * 3);
			const aCol = new Float32Array(count);
			const aRow = new Float32Array(count);

			let i = 0;
			// place points so they span the full container width/height
			// origin (0,0) is center of container
			const startX = -customWidth / 2 + spacingX / 2;
			const startY = customHeight / 2 - spacingY / 2;

			for (let c = 0; c < cols; c++) {
				for (let r = 0; r < rows; r++) {
					const x = startX + c * spacingX;
					const y = startY - r * spacingY;
					positions[3 * i] = x;
					positions[3 * i + 1] = y;
					positions[3 * i + 2] = 0;
					aCol[i] = c;
					aRow[i] = r;
					i++;
				}
			}

			geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
			geometry.setAttribute("aCol", new THREE.BufferAttribute(aCol, 1));
			geometry.setAttribute("aRow", new THREE.BufferAttribute(aRow, 1));

			// update shader spacing uniforms so vertex shader uses actual layout
			// (material may not exist yet; set after creation too)

			const material = new THREE.ShaderMaterial({
				transparent: true,
				depthWrite: false,
				uniforms: {
					time: { value: 0 },
					minW: { value: minWeight },
					maxW: { value: maxWeight },
					cols: { value: cols },
					rows: { value: rows },
					  xScale: { value: spacingX },
					  yScale: { value: spacingY },
					// color tuned to dark brown/maroon dots over a cream background
					baseHue: { value: 15.0 }, // degrees (approx warm brown)
					baseSat: { value: 0.9 }, // 0..1
					baseVal: { value: 0.14 }, // brightness 0..1 (low for dark dots)
					// mouse position in pixel-space, centered: vec2(x, y)
					mouse: { value: new THREE.Vector2(9999, 9999) },
					pixelRatio: { value: pixelRatio }
				},
				vertexShader: `
					uniform float time, minW, maxW, cols, rows, xScale, yScale;
					uniform vec2 mouse;
					attribute float aCol;
					attribute float aRow;
					varying float vHue;
					varying float vDist;

					void main(){
						vec2 pos = vec2((aCol - cols * 0.5) * xScale, (aRow - rows * 0.5) * yScale);
						float dist = length(pos);
						vDist = dist;

						// pulse similar to p5: sin(time) mapped to 0..1
						float pulse = 0.5 * sin(time - dist * 0.02) + 0.5;
						float size = mix(minW, maxW, pulse) * exp(-dist / 100.0);

						// mouse interaction: compute influence of the pointer on this point
						float mdist = length(pos - mouse);
						float influence = exp(-mdist / 60.0); // falloff
						// enlarge nearby points and add a small outward offset
						size *= 1.0 + influence * 3.0;
						vec2 dir = mdist > 0.0 ? (pos - mouse) / mdist : vec2(0.0);
						pos += dir * (influence * 6.0);

						gl_PointSize = size;

						float hueOffset = (aCol / cols) * 32.0 - 16.0;
						vHue = hueOffset;

						gl_Position = projectionMatrix * modelViewMatrix * vec4(pos.xy, 0.0, 1.0);
					}
				`,
				fragmentShader: `
					precision highp float;
					uniform float baseHue, baseSat, baseVal;
					uniform vec2 mouse;
					varying float vHue;
					varying float vDist;

					// HSV -> RGB
					vec3 hsv2rgb(vec3 c) {
						vec3 rgb = clamp( abs(mod(c.x*6.0 + vec3(0.0,4.0,2.0), 6.0)-3.0)-1.0, 0.0, 1.0 );
						rgb = rgb*rgb*(3.0-2.0*rgb);
						return c.z * mix(vec3(1.0), rgb, c.y);
					}

					void main(){
						vec2 coord = gl_PointCoord - 0.5;
						float r = length(coord);
						if (r > 0.5) discard;

						float hue = mod((baseHue + vHue + 360.0), 360.0) / 360.0;
						float sat = clamp(baseSat, 0.0, 1.0);
						float val = clamp(baseVal, 0.0, 1.0);

						vec3 col = hsv2rgb(vec3(hue, sat, val));
						float alpha = smoothstep(0.5, 0.45, r);
						// darken edges a touch and respect alpha for soft dots
						gl_FragColor = vec4(col, alpha);
					}
				`
			});

			// pointer handlers to update uniform
			function onPointerMove(e: PointerEvent) {
				const rect = container.getBoundingClientRect();
				const mx = e.clientX - rect.left - rect.width / 2;
				const my = rect.height / 2 - (e.clientY - rect.top);
				if (points) {
					const mat = points.material as THREE.ShaderMaterial;
					if (mat.uniforms.mouse && mat.uniforms.mouse.value.set) mat.uniforms.mouse.value.set(mx, my);
				}
			}

			function onPointerLeave() {
				if (points) {
					const mat = points.material as THREE.ShaderMaterial;
					if (mat.uniforms.mouse && mat.uniforms.mouse.value.set) mat.uniforms.mouse.value.set(9999, 9999);
				}
			}

			container.addEventListener('pointermove', onPointerMove);
			container.addEventListener('pointerleave', onPointerLeave);

			points = new THREE.Points(geometry, material);
			scene.add(points);

			// update camera to cover container area in pixels
			camera.left = -container.clientWidth / 2;
			camera.right = container.clientWidth / 2;
			camera.top = container.clientHeight / 2;
			camera.bottom = -container.clientHeight / 2;
			camera.near = -1000;
			camera.far = 1000;
			camera.updateProjectionMatrix();
		}

		function onResize() {
			const w = container.clientWidth;
			const h = container.clientHeight;
			renderer.setSize(w, h, false);
			// rebuild grid for new sizes (keeps dots crisp and centered)
			build();
		}

		// initial sizing
		container.style.position = "relative";
		renderer.setSize(container.clientWidth, container.clientHeight, false);
		build();

		let t = 0;
		function animate() {
			rafRef.current = requestAnimationFrame(animate);
			t += 0.04;
			if (points) {
				const mat = (points.material as THREE.ShaderMaterial);
				mat.uniforms.time.value = t;
			}
			renderer.render(scene, camera);
		}

		animate();

		window.addEventListener("resize", onResize);

		// cleanup
		return () => {
			window.removeEventListener("resize", onResize);
			if (didSetVh) {
				window.removeEventListener("resize", setVh);
				window.removeEventListener("orientationchange", setVh);
			}
			if (rafRef.current) cancelAnimationFrame(rafRef.current);
			if (points) {
				scene.remove(points);
				points.geometry.dispose();
				(points.material as THREE.Material).dispose();
			}
			renderer.dispose();
			if (renderer.domElement && renderer.domElement.parentNode === container) {
				container.removeChild(renderer.domElement);
			}
		};
	}, []);

	const resolvedHeight = typeof height === "string" && height.includes("vh") ? "calc(var(--vh) * 100)" : height;

	return (
		<div
			ref={containerRef}
			className={className}
			style={{ width: "100%", height: resolvedHeight, overflow: "hidden" }}
		/>
	);
}

