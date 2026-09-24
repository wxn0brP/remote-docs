import { QuestionAnswer } from "./questions";

export const STORAGE_KEY = "remote_docs_answers";

export function loadAllAnswers(): Map<string, QuestionAnswer> {
	const stored = localStorage.getItem(STORAGE_KEY);
	if (!stored) return new Map();
	try {
		const obj = JSON.parse(stored) as Record<string, QuestionAnswer>;
		return new Map(Object.entries(obj));
	} catch {
		return new Map();
	}
}

export function saveAllAnswers(answers: Map<string, QuestionAnswer>) {
	const obj: Record<string, QuestionAnswer> = {};
	for (const [k, v] of answers) obj[k] = v;
	localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
}

export function getQuestionText(block: HTMLElement): string {
	return block.querySelector<HTMLElement>(".q-text")?.textContent ?? "";
}

export function persistAnswer(qText: string, answer: QuestionAnswer) {
	if (!qText) return;
	const all = loadAllAnswers();
	all.set(qText, answer);
	saveAllAnswers(all);
}
