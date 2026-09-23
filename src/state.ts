import { RemoteDocsConfig, TocEntry } from "./types";
import type { QuestionAnswer } from "./questions";

export const state = {
	config: null as RemoteDocsConfig,
	configUrl: "",
	baseUrl: "",
	currentPath: "",
	html: "",
	toc: [] as TocEntry[],
	loading: true,
	error: "",
	singleFile: false,
	answers: new Map<number, QuestionAnswer>(),
	email: "",
};
