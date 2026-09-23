import { $, $content, $contentInner, $nav, $toc } from "./dom";
import { initQuestions } from "./questions";
import { setupScrollSpy, updateProgress } from "./scroll";
import { state } from "./state";
import type { NavItem } from "./types";
import { esc, stripMd } from "./utils";

export function renderHeader() {
	const c = state.config;
	const titleEl = $("hdr-title");
	const repoEl = $<HTMLAnchorElement>("hdr-repo");
	if (!titleEl || !repoEl) return;
	titleEl.innerHTML = esc(c?.title ?? "Docs");
	if (c?.repo) {
		repoEl.href = c.repo;
		repoEl.hidden = false;
	} else {
		repoEl.hidden = true;
	}
}

export function renderNavItems(items: NavItem[], active: string) {
	const lis = items
		.map(n => {
			if ("path" in n) {
				const p = stripMd(n.path);
				const cls = p === active ? "active" : "";
				if (state.singleFile) {
					return `<li><span class="nav-file ${cls}">${esc(n.title)}</span></li>`;
				}
				return `<li><a href="#/${esc(p)}" data-nav class="${cls}">${esc(n.title)}</a></li>`;
			}
			return `<li><details><summary>${esc(n.title)}</summary>${renderNavItems(n.items, active)}</details></li>`;
		})
		.join("");
	return `<ul>${lis}</ul>`;
}

export function renderNav() {
	if (!state.config) {
		$nav.innerHTML = "";
		return;
	}
	$nav.innerHTML = renderNavItems(state.config.nav, state.currentPath);
}

export function setActiveNav(path: string) {
	$nav.querySelectorAll("a[data-nav]").forEach(a => {
		const p = a.getAttribute("href")?.slice(2) ?? "";
		a.classList.toggle("active", p === path);
	});
	$nav.querySelectorAll("a[data-nav].active").forEach(a => {
		const d = a.closest("details");
		if (d) d.open = true;
	});
}

export function renderToc() {
	if (!state.toc.length) {
		$toc.innerHTML = "";
		return;
	}
	$toc.innerHTML =
		`<ul>` +
		state.toc
			.map(
				e =>
					`<li class="l${e.level}"><a href="#${e.id}" class="toc-item">${e.text}</a></li>`,
			)
			.join("") +
		`</ul>`;
}

export function renderContent() {
	if (state.loading) {
		$contentInner.innerHTML = `<p class="loading">loading...</p>`;
		updateProgress();
		return;
	}
	$contentInner.innerHTML = state.html;
	$content.scrollTop = 0;
	initQuestions();
	setupScrollSpy();
	updateProgress();
}

export function render() {
	renderHeader();
	renderToc();
	renderContent();
	setActiveNav(state.currentPath);
}

export function render404(path: string) {
	if (!state.config) return;
	state.html =
		`<h1>404</h1>` + `<p>page <code>${esc(path)}</code> does not exist.</p>`;
	state.toc = [];
	state.loading = false;
	state.error = `not found: ${path}`;
}
