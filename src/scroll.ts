import { $content, $progress, $toc } from "./dom";
import { state } from "./state";

export function updateProgress() {
	if (state.loading) {
		$progress.style.transform = "scaleX(0)";
		return;
	}
	const max = $content.scrollHeight - $content.clientHeight;
	const ratio = max > 0 ? Math.min(1, $content.scrollTop / max) : 0;
	$progress.style.transform = `scaleX(${ratio})`;
}

let spyAbort: AbortController = null;

export function setupScrollSpy() {
	spyAbort?.abort();
	spyAbort = new AbortController();
	const opts = {
		signal: spyAbort.signal,
	};

	const headings = Array.from(
		$content.querySelectorAll<HTMLElement>("h2[id], h3[id], h4[id]"),
	);
	const links = Array.from(
		$toc.querySelectorAll<HTMLAnchorElement>("a.toc-item"),
	);
	if (!headings.length || !links.length) return;

	let raf = 0;
	const update = () => {
		raf = 0;
		const containerRect = $content.getBoundingClientRect();
		const scrollTop = $content.scrollTop;
		const offset = 32;
		let activeId = "";
		for (const h of headings) {
			const top = h.getBoundingClientRect().top - containerRect.top + scrollTop;
			if (top - scrollTop <= offset) activeId = h.id;
			else break;
		}
		for (const a of links) {
			const linkId = (a.getAttribute("href") ?? "").slice(1);
			a.classList.toggle("active", linkId === activeId);
		}
	};
	const onScroll = () => {
		if (raf) return;
		raf = requestAnimationFrame(update);
	};
	$content.addEventListener("scroll", onScroll, opts);
	window.addEventListener("resize", onScroll, opts);
	update();
}

$content.addEventListener("scroll", updateProgress, {
	passive: true,
});
window.addEventListener("resize", updateProgress);
updateProgress();
