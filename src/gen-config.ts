#!/usr/bin/env bun

import { access, readFile, readdir, writeFile } from "fs/promises";
import { join, relative, resolve, sep } from "path";
import { stripMd } from "./utils";

function genTitle(s: string) {
	return s
		.replace(/\.(md|txt)$/i, "")
		.replace(/[-_]+/g, " ")
		.replace(/\b\w/g, c => c.toUpperCase())
		.trim();
}

async function walk(dir: string, root: string) {
	const sections = new Map<string, string[]>();
	const roots: string[] = [];

	const entries = await readdir(dir, {
		withFileTypes: true,
	});
	for (const e of entries) {
		const full = join(dir, e.name);
		if (e.isDirectory()) {
			const sub = await walk(full, root);
			for (const [k, v] of sub.sections) sections.set(k, v);
			for (const r of sub.roots) roots.push(r);
		} else if (
			e.isFile() &&
			e.name.endsWith(".md") &&
			e.name !== "remote-docs.txt"
		) {
			const rel = relative(root, full).split(sep);
			if (rel.length === 1) {
				roots.push(rel[0]);
			} else {
				const section = rel[0];
				const file = rel.slice(1).join("/");
				if (!sections.has(section)) sections.set(section, []);
				sections.get(section)!.push(file);
			}
		}
	}
	return {
		sections,
		roots,
	};
}

const dir = process.argv[2] ?? ".";
const out = process.argv[4] ?? "remote-docs.txt";

const absDir = dir.startsWith("/") ? dir : join(process.cwd(), dir);
const absOut = out.startsWith("/") ? out : join(process.cwd(), out);

let title = process.argv[3];
if (!title) {
	try {
		await access(absOut);
		const existing = await readFile(absOut, "utf8");
		const firstLine = existing.split("\n", 1)[0]?.trim();
		if (firstLine) title = firstLine;
	} catch {}
}

if (!title) title = genTitle(resolve(dir).split("/").pop() ?? "docs");

const { sections, roots } = await walk(absDir, absDir);

const sortedSections = [
	...sections.entries(),
].sort((a, b) => a[0].localeCompare(b[0]));

const lines: string[] = [
	title,
];

if (roots.length) {
	for (const f of roots.sort())
		lines.push(`${genTitle(stripMd(f))} | ${stripMd(f)}`);
	lines.push("");
}

for (const [sec, files] of sortedSections) {
	lines.push(`# ${genTitle(sec)}`);
	for (const f of files.sort()) {
		const noExt = stripMd(f);
		lines.push(`${genTitle(noExt.split("/").pop() ?? noExt)} | ${noExt}`);
	}
	lines.push("");
}

const body =
	lines
		.join("\n")
		.replace(/\n{3,}/g, "\n\n")
		.trimEnd() + "\n";

await writeFile(absOut, body, "utf8");
console.log(`wrote ${absOut}`);
