import { $ } from "./dom";
import { state } from "./state";
import { esc, escAttr } from "./utils";

export interface Question {
	id: number;
	type: "radio" | "checkbox" | "text";
	text: string;
	options: string[];
}

export interface QuestionAnswer {
	value: string | string[];
	custom?: string;
}

export function parseQuestions(lang: string, raw: string): Question | null {
	const type = lang.replace(/^question-/, "").trim();
	if (type !== "radio" && type !== "checkbox" && type !== "text") return null;

	const lines = raw.split("\n").map(l => l.trim());
	const text = lines[0] || "";
	const options = lines
		.slice(1)
		.filter(l => l.startsWith("- "))
		.map(l => l.slice(2).trim());

	return {
		id: nextQid(),
		type,
		text,
		options,
	};
}

let qidCounter = 0;

function nextQid() {
	return qidCounter++;
}

export function resetQidCounter() {
	qidCounter = 0;
}

export function renderQuestionHTML(q: Question): string {
	const opts = q.options.map(o => esc(o));

	if (q.type === "text") {
		return (
			`<div class="q-block" data-qid="${q.id}" data-type="text">` +
			`<p class="q-text">${esc(q.text)}</p>` +
			`<textarea class="q-textarea" placeholder="Your answer..."></textarea>` +
			`</div>`
		);
	}

	const inputType = q.type === "radio" ? "radio" : "checkbox";
	const optionsHTML =
		q.options
			.map(
				(o, i) =>
					`<label class="q-option"><input type="${inputType}" name="q${q.id}" value="${i}"> ${esc(o)}</label>`,
			)
			.join("") +
		`<label class="q-option q-custom"><input type="${inputType}" name="q${q.id}" value="__custom__"> Other</label>` +
		`<textarea class="q-custom-input" placeholder="Your answer..." hidden></textarea>`;

	return (
		`<div class="q-block" data-qid="${q.id}" data-type="${q.type}" data-options='${escAttr(JSON.stringify(opts))}'>` +
		`<p class="q-text">${esc(q.text)}</p>` +
		optionsHTML +
		`</div>`
	);
}

export function initQuestions() {
	const blocks = document.querySelectorAll<HTMLElement>(".q-block");
	if (!blocks.length) return;

	for (const block of blocks) {
		const qid = Number(block.dataset.qid);
		const type = block.dataset.type as string;
		const saved = state.answers.get(qid);
		if (!saved) continue;

		if (type === "text") {
			const ta = block.querySelector<HTMLTextAreaElement>(".q-textarea");
			if (ta) ta.value = String(saved.value);
		} else {
			const values = Array.isArray(saved.value)
				? saved.value
				: [
						saved.value,
					];
			for (const v of values) {
				const input = block.querySelector<HTMLInputElement>(
					`input[value="${v}"]`,
				);
				if (input) {
					input.checked = true;
					if (v === "__custom__") {
						const ta =
							block.querySelector<HTMLTextAreaElement>(".q-custom-input");
						if (ta) {
							ta.hidden = false;
							ta.value = saved.custom ?? "";
						}
					}
				}
			}
		}
	}
}

export function handleQuestionChange(e: Event) {
	const target = e.target as HTMLElement;
	const input = target as HTMLInputElement;
	if (!input.matches(".q-block input")) return;

	const block = input.closest<HTMLElement>(".q-block");
	if (!block) return;

	const qid = Number(block.dataset.qid);
	const type = block.dataset.type as string;

	if (type === "radio") {
		const options = JSON.parse(block.dataset.options ?? "[]") as string[];
		const isCustom = input.value === "__custom__";
		const ta = block.querySelector<HTMLTextAreaElement>(".q-custom-input");
		if (ta) ta.hidden = !isCustom;
		state.answers.set(qid, {
			value: isCustom ? "__custom__" : options[Number(input.value)],
		});
	} else if (type === "checkbox") {
		const options = JSON.parse(block.dataset.options ?? "[]") as string[];
		const checked = Array.from(
			block.querySelectorAll<HTMLInputElement>("input:checked"),
		);
		const values: string[] = [];
		let hasCustom = false;
		for (const cb of checked) {
			if (cb.value === "__custom__") hasCustom = true;
			else values.push(options[Number(cb.value)]);
		}
		const ta = block.querySelector<HTMLTextAreaElement>(".q-custom-input");
		if (ta) ta.hidden = !hasCustom;
		state.answers.set(qid, {
			value: values,
		});
	}
	updateAnswersButton();
}

export function handleQuestionInput(e: Event) {
	const target = e.target as HTMLElement;
	const block = target.closest<HTMLElement>(".q-block");
	if (!block) return;

	const qid = Number(block.dataset.qid);
	const type = block.dataset.type as string;
	const ta = target as HTMLTextAreaElement;

	if (type === "text") {
		state.answers.set(qid, {
			value: ta.value,
		});
	} else if (ta.classList.contains("q-custom-input")) {
		const answer = state.answers.get(qid);
		if (answer) answer.custom = ta.value;
	}
	updateAnswersButton();
}

function updateAnswersButton() {
	const btn = $("answers-btn");
	if (!btn) return;
	btn.hidden = state.answers.size === 0;
}

export function showAnswersModal() {
	const modal = $("answers-modal");
	if (!modal) return;

	const lines: string[] = [];
	const blocks = document.querySelectorAll<HTMLElement>(".q-block");

	for (const block of blocks) {
		const qid = Number(block.dataset.qid);
		const type = block.dataset.type as string;
		const answer = state.answers.get(qid);
		if (!answer) continue;

		const qText =
			block.querySelector<HTMLElement>(".q-text")?.textContent ?? "";
		lines.push(`Q: ${qText}`);

		if (type === "text") {
			lines.push(`A: ${answer.value || "(empty)"}`);
		} else {
			const options = JSON.parse(block.dataset.options ?? "[]") as string[];
			const values = Array.isArray(answer.value)
				? answer.value
				: [
						answer.value,
					];
			const labels = values.map(v => {
				if (v === "__custom__") return `Other: ${answer.custom || "(empty)"}`;
				if (typeof v === "string") {
					const idx = options.indexOf(v);
					return idx >= 0 ? options[idx] : v;
				}
				return options[Number(v)] ?? String(v);
			});
			lines.push(`A: ${labels.join(", ")}`);
		}
		lines.push("");
	}

	const summary = lines.join("\n").trim();
	$("answers-body").textContent = summary;
	$("answers-copy").textContent = "Copy";
	const emailBtn = $("answers-email");
	if (emailBtn) emailBtn.hidden = !state.email;
	modal.hidden = false;
}

export function hideAnswersModal() {
	const modal = $("answers-modal");
	if (modal) modal.hidden = true;
}

export async function copyAnswers() {
	const body = $("answers-body");
	if (!body) return;
	try {
		await navigator.clipboard.writeText(body.textContent ?? "");
		const btn = $("answers-copy");
		if (btn) {
			btn.textContent = "Copied!";
			setTimeout(() => {
				btn.textContent = "Copy";
			}, 2000);
		}
	} catch {
		/* ignore */
	}
}

export function emailAnswers() {
	if (!state.email) return;
	const body = $("answers-body");
	if (!body) return;
	const text = body.textContent ?? "";
	const subject = encodeURIComponent("Docs answers");
	const mailBody = encodeURIComponent(text);
	location.href = `mailto:${state.email}?subject=${subject}&body=${mailBody}`;
}
