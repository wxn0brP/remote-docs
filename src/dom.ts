export const $ = <T extends HTMLElement = HTMLDivElement>(id: string) =>
	document.getElementById(id) as T;

export const $nav = $("nav");
export const $content = $("content");
export const $contentInner = $("content-inner");
export const $toc = $("toc");
export const $progress = $("progress");
