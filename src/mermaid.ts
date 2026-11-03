import { updateProgress } from "./scroll";

const MERMAID_CDN: string =
	"https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs";

const ZOOM_MIN = 0.25;
const ZOOM_MAX = 4;
const ZOOM_STEP = 0.25;

let mermaidPromise: Promise<any> | null = null;
let zoomAbort: AbortController | null = null;

function loadMermaid() {
	mermaidPromise ??= import(MERMAID_CDN)
		.then(mod => {
			const mermaid = mod.default ?? mod;
			mermaid.initialize({
				startOnLoad: false,
				theme: "dark",
				securityLevel: "strict",
				fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
				themeVariables: {
					background: "#0e0e14",
					primaryColor: "#1d1d28",
					primaryTextColor: "#d4d4d8",
					primaryBorderColor: "#a78bfa",
					lineColor: "#71717a",
					secondaryColor: "#16161e",
					tertiaryColor: "#16161e",
					fontSize: "15px",
				},
			});
			return mermaid;
		})
		.catch(e => {
			mermaidPromise = null;
			throw e;
		});
	return mermaidPromise;
}

function svgWidth(svg: SVGSVGElement) {
	const vb = svg.viewBox?.baseVal;
	if (vb && vb.width > 0) return vb.width;
	const r = svg.getBoundingClientRect();
	return r.width || 800;
}

function zoomButton(act: string, label: string, text: string) {
	const b = document.createElement("button");
	b.type = "button";
	b.dataset.act = act;
	b.title = label;
	b.setAttribute("aria-label", label);
	b.textContent = text;
	return b;
}

function setupZoom(node: HTMLElement, svg: SVGSVGElement, signal: AbortSignal) {
	const width = svgWidth(svg);

	const canvas = document.createElement("div");
	canvas.className = "mermaid-canvas";

	svg.removeAttribute("style");
	svg.removeAttribute("width");
	svg.removeAttribute("height");
	canvas.append(svg);
	node.replaceChildren(canvas);

	const tools = document.createElement("div");
	tools.className = "mermaid-tools";
	const out = zoomButton("out", "Zoom out", "−");
	const inBtn = zoomButton("in", "Zoom in", "+");
	const fitBtn = zoomButton("fit", "Fit to width", "fit");
	tools.append(out, inBtn, fitBtn);
	node.prepend(tools);

	const apply = (zoom: number, fitted: boolean) => {
		const z = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, zoom));
		node.dataset.mermaidZoom = String(z);
		node.dataset.mermaidFit = fitted ? "1" : "0";
		svg.style.width = `${Math.round(width * z)}px`;
		svg.style.height = "auto";
		updateProgress();
	};

	const current = () => Number(node.dataset.mermaidZoom ?? 1);

	const fit = () => {
		const avail = canvas.clientWidth - 32;
		if (!avail) return;
		apply(Math.min(1, avail / width), true);
	};

	out.addEventListener("click", () => apply(current() - ZOOM_STEP, false), {
		signal,
	});
	inBtn.addEventListener("click", () => apply(current() + ZOOM_STEP, false), {
		signal,
	});
	fitBtn.addEventListener("click", fit, {
		signal,
	});
	window.addEventListener(
		"resize",
		() => {
			if (node.dataset.mermaidFit === "1") fit();
		},
		{
			signal,
		},
	);

	apply(1, false);
}

function fail(node: HTMLElement) {
	node.classList.add("mermaid-error");
	const note = document.createElement("p");
	note.className = "mermaid-fallback";
	note.textContent = "diagram failed to render";
	const pre = document.createElement("pre");
	const code = document.createElement("code");
	code.textContent = node.dataset.mermaidSource ?? node.textContent ?? "";
	pre.append(code);
	node.replaceChildren(note, pre);
}

export async function renderMermaid(root: HTMLElement) {
	const nodes = Array.from(
		root.querySelectorAll<HTMLElement>(".mermaid:not([data-mermaid-done])"),
	);
	if (!nodes.length) return false;

	zoomAbort?.abort();
	zoomAbort = new AbortController();
	const signal = zoomAbort.signal;

	for (const node of nodes) {
		node.dataset.mermaidDone = "1";
		node.dataset.mermaidSource = node.textContent ?? "";
	}

	try {
		const mermaid = await loadMermaid();
		const alive = nodes.filter(n => root.contains(n));
		if (alive.length)
			await mermaid.run({
				nodes: alive,
				suppressErrors: true,
			});
	} catch {
		/* handled below */
	}

	for (const node of nodes) {
		if (!root.contains(node)) continue;
		const svg = node.querySelector<SVGSVGElement>("svg");
		if (svg) setupZoom(node, svg, signal);
		else fail(node);
	}
	return true;
}
