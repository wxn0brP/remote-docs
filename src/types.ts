export interface RemoteDocsConfig {
	title?: string;
	repo?: string;
	nav: NavItem[];
}

export type NavItem =
	| {
			title: string;
			path: string;
	  }
	| {
			title: string;
			items: NavItem[];
	  };

export interface ResolvedConfig {
	configUrl: string;
	baseUrl: string;
	repoUrl?: string;
	singleFile?: boolean;
}

export interface TocEntry {
	id: string;
	text: string;
	level: number;
}
