import { describe, expect, it } from "vitest";
import { Readability } from "@mozilla/readability";
import TurndownService from "turndown";
import { extractArticleMarkdown } from "../src/article";

describe("article extraction pipeline", () => {
	it("extracts readable content with Readability", () => {
		const html = `<!doctype html>
      <html>
        <head><title>Readable Title</title></head>
        <body>
          <header>Ignore me</header>
          <article>
            <h1>Readable Title</h1>
            <p>Primary content lives here.</p>
          </article>
          <footer>Footer noise</footer>
        </body>
      </html>`;
		const doc = new DOMParser().parseFromString(html, "text/html");
		const reader = new Readability(doc);
		const article = reader.parse();

		expect(article?.title).toBe("Readable Title");
		expect(article?.content).toContain("Primary content lives here.");
	});

	it("converts HTML to markdown with Turndown", () => {
		const html = `<p><strong>Bold</strong> and <em>emphasis</em></p>`;
		const service = new TurndownService({ emDelimiter: "*" });
		const markdown = service.turndown(html).trim();

		expect(markdown).toBe("**Bold** and *emphasis*");
	});

	it("extracts and converts full text via Readability and Turndown", () => {
		const html = `<!doctype html>
      <html>
        <head><base href="https://example.com/base/"></head>
        <body>
          <article>
            <h1>Sample Article</h1>
            <p>Text with <mark>highlight</mark> and <a href="/link">link</a>.</p>
            <p><img src="/image.png" alt="Alt text" /></p>
            <pre><code>const value = 1;</code></pre>
          </article>
        </body>
      </html>`;
		const markdown = extractArticleMarkdown(html, "https://example.com/base/");

		expect(markdown).toContain("## Sample Article");
		expect(markdown).toContain("==highlight==");
		expect(markdown).toContain("[link](https://example.com/link)");
		expect(markdown).toContain("![Alt text](https://example.com/image.png)");
		expect(markdown).toContain("```\nconst value = 1;\n```");
	});
});
