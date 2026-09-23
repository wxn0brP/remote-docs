import { findPage, flattenPages, parseConfig, resolveConfig } from "./config";
import { fetchText } from "./fetcher";
import "./keyboard";
import { render, renderNav } from "./render";
import { loadPage, pathFromHash, renderSingleFile } from "./router";
import "./scroll";
import { state } from "./state";
import { closeNavDrawer } from "./ui";
import { stripMd } from "./utils";

try {
	const resolved = resolveConfig(new URLSearchParams(location.search));
	const { configUrl, baseUrl, repoUrl, singleFile } = resolved;
	state.baseUrl = baseUrl;
	state.configUrl = configUrl;
	state.email = new URLSearchParams(location.search).get("em") ?? "";

	window.addEventListener("hashchange", () => {
		if (state.singleFile) return;
		const p = pathFromHash();
		if (p) {
			closeNavDrawer();
			void loadPage(p);
		}
	});

	if (singleFile) {
		state.singleFile = true;
		state.configUrl = configUrl;
		await renderSingleFile(configUrl);
	} else {
		const text = await fetchText(configUrl);
		const config = parseConfig(text, repoUrl);
		state.config = config;
		renderNav();
		render();

		const fromHash = pathFromHash();
		const first = stripMd(flattenPages(config.nav)[0]?.path ?? "");
		const target =
			fromHash && findPage(config.nav, fromHash) ? fromHash : first;
		if (!location.hash && target) {
			location.hash = "#/" + target;
		} else if (target) {
			await loadPage(target);
		} else {
			state.loading = false;
			render();
		}
	}
} catch (e: any) {
	state.loading = false;
	state.error = e?.message ?? String(e);
	render();
}
