import { Readability } from "@mozilla/readability";
import TurndownService from "turndown";

const resolveUrl = (url: string, baseUrl?: string) => {
	if (!baseUrl) return url;
	try {
		return new URL(url, baseUrl).toString();
	} catch {
		return url;
	}
};

export const createTurndownService = (baseUrl?: string) => {
	const turndownService = new TurndownService({
		headingStyle: "atx",
		bulletListMarker: "-",
		codeBlockStyle: "fenced",
		emDelimiter: "*",
		strongDelimiter: "**",
	});

	turndownService.addRule("mark", {
		filter: "mark",
		replacement: (content) => `==${content}==`,
	});

	turndownService.addRule("fencedCodeBlock", {
		filter: (node) => {
			return (
				node.nodeName === "PRE" &&
				node.firstChild !== null &&
				node.firstChild.nodeName === "CODE"
			);
		},
		replacement: (_content, node) => {
			const codeNode = node.firstChild as HTMLElement | null;
			const code = codeNode?.textContent ?? "";
			return `\n\n\`\`\`\n${code.replace(/\n+$/g, "")}\n\`\`\`\n\n`;
		},
	});

	turndownService.addRule("linkWithBase", {
		filter: "a",
		replacement: (content, node) => {
			const href = (node as HTMLElement).getAttribute("href");
			if (!href) return content;
			const resolved = resolveUrl(href, baseUrl);
			return `[${content || resolved}](${resolved})`;
		},
	});

	turndownService.addRule("imageWithBase", {
		filter: "img",
		replacement: (_content, node) => {
			const element = node as HTMLElement;
			const src = element.getAttribute("src");
			if (!src) return "";
			const alt = element.getAttribute("alt") ?? "";
			const resolved = resolveUrl(src, baseUrl);
			return `![${alt}](${resolved})`;
		},
	});

	return turndownService;
};

export const extractArticleMarkdown = (html: string, baseUrl?: string): string | null => {
	const parser = new DOMParser();
	const doc = parser.parseFromString(html, "text/html");
	const reader = new Readability(doc);
	const article = reader.parse();
	if (!article?.content) return null;

	const articleDoc = parser.parseFromString(article.content, "text/html");
	const turndownService = createTurndownService(baseUrl);
	const markdown = turndownService
		.turndown(articleDoc.body)
		.replace(/\n{3,}/g, "\n\n")
		.trim();

	return markdown.length > 0 ? markdown : null;
};
