import hljs from "highlight.js/lib/core";
import bash from "highlight.js/lib/languages/bash";
import css from "highlight.js/lib/languages/css";
import javascript from "highlight.js/lib/languages/javascript";
import json from "highlight.js/lib/languages/json";
import python from "highlight.js/lib/languages/python";
import typescript from "highlight.js/lib/languages/typescript";
import xml from "highlight.js/lib/languages/xml";
import { marked } from "marked";
import { markedHighlight } from "marked-highlight";
import type { TocEntry } from "./types";
import { escAttr } from "./utils";

hljs.registerLanguage("javascript", javascript);
hljs.registerLanguage("js", javascript);
hljs.registerLanguage("typescript", typescript);
hljs.registerLanguage("ts", typescript);
hljs.registerLanguage("bash", bash);
hljs.registerLanguage("sh", bash);
hljs.registerLanguage("json", json);
hljs.registerLanguage("xml", xml);
hljs.registerLanguage("html", xml);
hljs.registerLanguage("css", css);
hljs.registerLanguage("python", python);
hljs.registerLanguage("py", python);

const toc: TocEntry[] = [];
let baseUrl = "";

function slugify(s: string) {
	const slug = s
		.toLowerCase()
		.normalize("NFKD")
		.replace(/[\u0300-\u036f]/g, "")
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
	return slug || "section";
}

function tokensToText(tokens: any[]) {
	let out = "";
	for (const t of tokens) {
		if (t.type === "text" || t.type === "escape") out += t.text ?? "";
		else if (t.tokens) out += tokensToText(t.tokens);
		else if (t.text) out += t.text;
	}
	return out;
}

function strip(html: string) {
	return html
		.replace(/<script\b[\s\S]*?<\/script>/gi, "")
		.replace(/<iframe\b[\s\S]*?<\/iframe>/gi, "");
}

const renderer = {
	heading(this: any, { tokens, depth }: any) {
		const text = this.parser.parseInline(tokens);
		const plain = tokensToText(tokens);
		const id = slugify(plain);
		if (depth >= 2 && depth <= 4)
			toc.push({
				id,
				text: strip(text),
				level: depth,
			});
		return `<h${depth} id="${id}">${text}</h${depth}>\n`;
	},
	link(this: any, { href, title, tokens }: any) {
		const text = this.parser.parseInline(tokens);
		const t = title ? ` title="${escAttr(title)}"` : "";
		if (href.startsWith("#/")) {
			return `<a href="${href}" data-nav${t}>${text}</a>`;
		}
		if (/^https?:\/\//i.test(href)) {
			return `<a href="${href}" target="_blank" rel="noopener"${t}>${text}</a>`;
		}
		if (
			!/^[a-z]+:/i.test(href) &&
			!href.startsWith("#") &&
			!href.startsWith("/")
		) {
			const target = "#/" + href.replace(/^(?:\.\/)+/, "").replace(/\.md$/, "");
			return `<a href="${target}" data-nav${t}>${text}</a>`;
		}
		return `<a href="${href}"${t}>${text}</a>`;
	},
	image({ href, title, text }: any) {
		const t = title ? ` title="${escAttr(title)}"` : "";
		let src = href;
		if (!/^[a-z]+:\/\//i.test(src) && !src.startsWith("data:")) {
			try {
				src = new URL(href, baseUrl).href;
			} catch {
				/* keep original */
			}
		}
		return `<img src="${escAttr(src)}" alt="${escAttr(text ?? "")}" loading="lazy"${t}>`;
	},
};

marked.use({
	renderer,
});
marked.use(
	markedHighlight({
		langPrefix: "hljs language-",
		highlight(code: string, lang: string) {
			if (lang && hljs.getLanguage(lang)) {
				return hljs.highlight(code, {
					language: lang,
					ignoreIllegals: true,
				}).value;
			}
			return code;
		},
	}),
);

export function parseMarkdown(
	md: string,
	_baseUrl: string,
): {
	html: string;
	toc: TocEntry[];
} {
	baseUrl = _baseUrl;
	toc.length = 0;
	let html = marked.parse(md, {
		async: false,
	}) as string;
	html = strip(html);
	return {
		html,
		toc: [
			...toc,
		],
	};
}
