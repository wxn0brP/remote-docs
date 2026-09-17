import { flattenPages } from "./config";
import { state } from "./state";
import { stripMd } from "./utils";
import { closeNavDrawer } from "./ui";
import { navigate } from "./router";
import { $ } from "./dom";

export function navIndex() {
	if (!state.config) return [];
	return flattenPages(state.config.nav).map(p => stripMd(p.path));
}

export function gotoByOffset(delta: number) {
	const pages = navIndex();
	if (!pages.length) return;
	const idx = pages.indexOf(state.currentPath);
	if (idx < 0) {
		navigate(pages[0] ?? "");
		return;
	}
	const next = pages[Math.min(pages.length - 1, Math.max(0, idx + delta))];
	if (next && next !== state.currentPath) navigate(next);
}

function isTypingTarget(t: EventTarget) {
	if (!(t instanceof HTMLElement)) return false;
	const tag = t.tagName;
	if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
	return t.isContentEditable;
}

const help = $("help-overlay");
const helpClose = $("help-close");
let gPrefix: number = null;

helpClose?.addEventListener("click", () => help?.classList.remove("open"));
help?.addEventListener("click", e => {
	if (e.target === help) help.classList.remove("open");
});

document.addEventListener("keydown", e => {
	if (e.defaultPrevented) return;
	if (isTypingTarget(e.target)) return;

	const toggle = () => help?.classList.toggle("open");
	const closeHelp = () => help?.classList.remove("open");

	if (state.singleFile) {
		if (e.key === "Escape") closeHelp();
		return;
	}

	const now = performance.now();

	if (e.key === "Escape") {
		closeNavDrawer();
		closeHelp();
		return;
	}

	if (e.key === "?") {
		e.preventDefault();
		toggle();
		return;
	}

	if (e.key === "j") {
		e.preventDefault();
		gotoByOffset(1);
		return;
	}

	if (e.key === "k") {
		e.preventDefault();
		gotoByOffset(-1);
		return;
	}

	if (e.key === "G") {
		e.preventDefault();
		const pages = navIndex();
		if (pages.length) navigate(pages[pages.length - 1]);
		return;
	}

	if (e.key === "g") {
		if (gPrefix !== null && now - gPrefix < 500) {
			e.preventDefault();
			gPrefix = null;
			const pages = navIndex();
			if (pages.length) navigate(pages[0]);
			return;
		}
		gPrefix = now;
	}
});
