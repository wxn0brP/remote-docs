import { RemoteDocsConfig, TocEntry } from "./types";

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
};
