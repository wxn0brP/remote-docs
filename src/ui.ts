import { $ } from "./dom";
import { forceReload, navigate } from "./router";
import { state } from "./state";

export function closeNavDrawer() {
	document.body.classList.remove("nav-open");
	const btn = $("menu-toggle");
	btn?.setAttribute("aria-expanded", "false");
}

const menuBtn = $("menu-toggle");
menuBtn.addEventListener("click", () => {
	const isOpen = document.body.classList.toggle("nav-open");
	menuBtn.setAttribute("aria-expanded", String(isOpen));
});

document.addEventListener("keydown", e => {
	if (e.key === "Escape" && document.body.classList.contains("nav-open")) {
		closeNavDrawer();
	}
});

$("reload-btn").addEventListener("click", forceReload);

document.addEventListener("click", e => {
	const t = e.target as HTMLElement;
	const nav = t?.closest("a[data-nav]") as HTMLAnchorElement;

	if (nav) {
		const href = nav.getAttribute("href") ?? "";
		if (!href.startsWith("#/")) return;
		e.preventDefault();
		const path = href.slice(2);
		if (path !== state.currentPath) navigate(path);
		closeNavDrawer();
		return;
	}

	const toc = t?.closest("#toc a.toc-item") as HTMLAnchorElement;
	if (!toc) return;

	e.preventDefault();
	const id = (toc.getAttribute("href") ?? "").slice(1);

	const target = $(id);
	if (!target) return;

	target.scrollIntoView({
		behavior: "smooth",
		block: "start",
	});
});
