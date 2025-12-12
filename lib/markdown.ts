// deno-lint-ignore-file no-explicit-any
import { marked } from "marked";

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
  const htmlEscapes: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  };
  return text.replace(/[&<>"']/g, (char) => htmlEscapes[char]);
}

/**
 * Custom renderer object for marked that applies GOV.UK classes
 */
const govukRenderer = {
  heading({ tokens, depth }: { tokens: any[]; depth: number }): string {
    // @ts-ignore - this.parser is available at runtime from marked
    const text = this.parser.parseInline(tokens);
    const sizes: Record<number, string> = {
      1: "govuk-heading-xl",
      2: "govuk-heading-l",
      3: "govuk-heading-m",
      4: "govuk-heading-s",
      5: "govuk-heading-s",
      6: "govuk-heading-s",
    };

    const className = sizes[depth] || "govuk-heading-m";
    const tag = `h${depth}`;

    return `<${tag} class="${className}">${text}</${tag}>\n`;
  },

  paragraph({ tokens }: { tokens: any[] }): string {
    // @ts-ignore - this.parser is available at runtime from marked
    const text = this.parser.parseInline(tokens);
    return `<p class="govuk-body">${text}</p>\n`;
  },

  list(token: { ordered: boolean; items: any[]; raw: string }): string {
    const type = token.ordered ? "ol" : "ul";

    // Check if this is a task list (any item has task=true)
    const isTaskList = token.items.some((item: any) => item.task);

    const className = token.ordered
      ? "govuk-list govuk-list--number"
      : isTaskList
      ? "govuk-list"
      : "govuk-list govuk-list--bullet";

    // Let marked handle rendering the list items
    let body = "";
    for (const item of token.items) {
      body += this.listitem(item);
    }

    return `<${type} class="${className}">\n${body}</${type}>\n`;
  },

  listitem(item: {
    text: string;
    tokens?: any[];
    task?: boolean;
    checked?: boolean;
    loose?: boolean;
  }): string {
    // @ts-ignore - this.parser is available at runtime from marked
    let text = item.text;
    if (item.tokens && item.tokens.length > 0) {
      // Check if tokens contain block-level elements (paragraph, list, etc.)
      // If so, use parse() instead of parseInline()
      const hasBlockTokens = item.tokens.some((token: any) =>
        token.type === "paragraph" || token.type === "list" ||
        token.type === "space"
      );

      if (hasBlockTokens) {
        // Block-level tokens (loose list, nested lists, etc.) - use parse()
        // @ts-ignore - this.parser is available at runtime from marked
        text = this.parser.parse(item.tokens);
      } else {
        // Tight list with inline tokens - use parseInline()
        // @ts-ignore - this.parser is available at runtime from marked
        text = this.parser.parseInline(item.tokens);
      }
    }

    // Task lists are already rendered by marked with checkboxes in the text
    // So we don't need to add checkboxes here - just return the text as-is
    return `<li>${text}</li>\n`;
  },

  link(
    { href, title, tokens }: {
      href: string;
      title?: string | null;
      tokens: any[];
    },
  ): string {
    // @ts-ignore - this.parser is available at runtime from marked
    const text = this.parser.parseInline(tokens);
    const titleAttr = title ? ` title="${escapeHtml(title)}"` : "";
    return `<a href="${
      escapeHtml(href)
    }" class="govuk-link"${titleAttr}>${text}</a>`;
  },

  table(token: { header: any[]; rows: any[][] }): string {
    // Render header row
    // @ts-ignore - this.tablecell is available at runtime from marked
    const headerCells = token.header.map((cell) => this.tablecell(cell)).join(
      "",
    );
    const header = `<tr class="govuk-table__row">\n${headerCells}</tr>\n`;

    // Render body rows
    const body = token.rows.map((row) => {
      // @ts-ignore - this.tablecell is available at runtime from marked
      const cells = row.map((cell) => this.tablecell(cell)).join("");
      return `<tr class="govuk-table__row">\n${cells}</tr>\n`;
    }).join("");

    // Wrap table in scroll container for mobile support
    return `<div class="table-scroll-wrapper">
<table class="govuk-table">
  <thead class="govuk-table__head">
    ${header}
  </thead>
  <tbody class="govuk-table__body">
    ${body}
  </tbody>
</table>
</div>\n`;
  },

  tablecell(
    token: { header?: boolean; tokens: any[]; align?: string | null },
  ): string {
    // @ts-ignore - this.parser is available at runtime from marked
    const content = this.parser.parseInline(token.tokens);
    const tag = token.header ? "th" : "td";
    const className = token.header
      ? "govuk-table__header"
      : "govuk-table__cell";
    const scope = token.header ? ' scope="col"' : "";
    const align = token.align ? ` style="text-align: ${token.align}"` : "";
    return `<${tag} class="${className}"${scope}${align}>${content}</${tag}>\n`;
  },

  strong({ tokens }: { tokens: any[] }): string {
    // @ts-ignore - this.parser is available at runtime from marked
    const text = this.parser.parseInline(tokens);
    return `<strong class="govuk-!-font-weight-bold">${text}</strong>`;
  },

  codespan({ text }: { text: string }): string {
    return `<code class="code-inline">${escapeHtml(text)}</code>`;
  },

  code({ text, lang }: { text: string; lang?: string }): string {
    const language = lang || "text";
    const escapedCode = escapeHtml(text);
    // Use a special marker that will be replaced with CodeBlock component
    // Using base64 to avoid escaping issues
    const base64Code = btoa(unescape(encodeURIComponent(escapedCode)));
    return `<div data-codeblock data-language="${
      escapeHtml(language)
    }" data-code-base64="${base64Code}"></div>\n`;
  },

  blockquote({ tokens }: { tokens: any[] }): string {
    // @ts-ignore - this.parser is available at runtime from marked
    const quote = this.parser.parse(tokens);
    return `<div class="govuk-inset-text">\n${quote}</div>\n`;
  },

  hr(): string {
    return '<hr class="govuk-section-break govuk-section-break--xl govuk-section-break--visible">\n';
  },
};

// Configure marked to use the GOV.UK renderer
// @ts-ignore - renderer object matches RendererObject interface at runtime
marked.use({
  renderer: govukRenderer,
  gfm: true,
  breaks: false,
});

/**
 * Parse markdown to HTML with GOV.UK classes
 */
export function parseMarkdown(
  markdown: string,
  _options: { baseUrl?: string } = {},
): string {
  // Store directives and their content
  const directives: Map<
    string,
    { type: string; content: string; summary?: string }
  > = new Map();
  let directiveCounter = 0;

  // Extract directives before markdown parsing
  let processedMarkdown = markdown;

  // Parse warning callouts
  processedMarkdown = processedMarkdown.replace(
    /:::warning\s*\n([\s\S]*?)\n\s*:::/g,
    (_, content) => {
      const id = `DIRECTIVE_WARNING_${directiveCounter++}`;
      directives.set(id, {
        type: "warning",
        content: content.trim(),
      });
      return `\n<!-- ${id} -->\n`;
    },
  );

  // Parse inset text
  processedMarkdown = processedMarkdown.replace(
    /:::inset\s*\n([\s\S]*?)\n\s*:::/g,
    (_, content) => {
      const id = `DIRECTIVE_INSET_${directiveCounter++}`;
      directives.set(id, { type: "inset", content: content.trim() });
      return `\n<!-- ${id} -->\n`;
    },
  );

  // Parse details/summary (collapsible sections)
  processedMarkdown = processedMarkdown.replace(
    /:::details\s+(.+?)\s*\n([\s\S]*?)\n\s*:::/g,
    (_, summary, content) => {
      const id = `DIRECTIVE_DETAILS_${directiveCounter++}`;
      directives.set(id, {
        type: "details",
        content: content.trim(),
        summary: summary.trim(),
      });
      return `\n<!-- ${id} -->\n`;
    },
  );

  // Parse markdown to HTML
  let html = marked.parse(processedMarkdown) as string;

  // Helper function to strip wrapping <p> tags from parsed content
  const stripParagraphWrap = (html: string): string => {
    const trimmed = html.trim();
    if (trimmed.startsWith("<p>") && trimmed.endsWith("</p>")) {
      return trimmed.slice(3, -4);
    }
    return trimmed;
  };

  // Replace directive placeholders with rendered HTML (parse nested markdown)
  for (const [id, directive] of directives.entries()) {
    let replacement = "";

    if (directive.type === "warning") {
      const parsedContent = marked.parse(directive.content) as string;
      const inlineContent = stripParagraphWrap(parsedContent);
      replacement = `<div class="govuk-warning-text">
  <span class="govuk-warning-text__icon" aria-hidden="true">!</span>
  <strong class="govuk-warning-text__text">
    <span class="govuk-visually-hidden">Warning</span>
    ${inlineContent}
  </strong>
</div>`;
    } else if (directive.type === "inset") {
      const parsedContent = marked.parse(directive.content) as string;
      replacement = `<div class="govuk-inset-text">
${parsedContent}</div>`;
    } else if (directive.type === "details") {
      const parsedContent = marked.parse(directive.content) as string;
      replacement = `<details class="govuk-details" data-module="govuk-details">
  <summary class="govuk-details__summary">
    <span class="govuk-details__summary-text">
      ${directive.summary}
    </span>
  </summary>
  <div class="govuk-details__text">
${parsedContent}
  </div>
</details>`;
    }

    // Replace HTML comment placeholders
    html = html.replace(`<!-- ${id} -->`, replacement);
  }

  return html;
}

/**
 * Extract frontmatter from markdown file
 * Returns { frontmatter, content }
 */
export interface Frontmatter {
  [key: string]: string | number | boolean | string[];
}

export function extractFrontmatter(
  markdown: string,
): { frontmatter: Frontmatter; content: string } {
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
  const match = markdown.match(frontmatterRegex);

  if (!match) {
    return { frontmatter: {}, content: markdown };
  }

  const [, frontmatterStr, content] = match;
  const frontmatter: Frontmatter = {};

  // Parse simple YAML frontmatter
  const lines = frontmatterStr.split("\n");
  for (const line of lines) {
    const colonIndex = line.indexOf(":");
    if (colonIndex === -1) continue;

    const key = line.substring(0, colonIndex).trim();
    let value: string | number | boolean | string[] = line.substring(
      colonIndex + 1,
    ).trim();

    // Remove quotes
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.substring(1, value.length - 1);
    }

    // Parse arrays (simple bracket notation)
    if (value.startsWith("[") && value.endsWith("]")) {
      value = value
        .substring(1, value.length - 1)
        .split(",")
        .map((v) => v.trim().replace(/^['"]|['"]$/g, ""));
    } // Parse booleans
    else if (value === "true") {
      value = true;
    } else if (value === "false") {
      value = false;
    } // Parse numbers
    else if (/^\d+$/.test(value)) {
      value = parseInt(value, 10);
    } else if (/^\d+\.\d+$/.test(value)) {
      value = parseFloat(value);
    }

    frontmatter[key] = value;
  }

  return { frontmatter, content };
}

/**
 * Load and parse a markdown file
 */
export async function loadMarkdownFile(
  path: string,
): Promise<{ frontmatter: Frontmatter; html: string; raw: string }> {
  const raw = await Deno.readTextFile(path);
  const { frontmatter, content } = extractFrontmatter(raw);
  const html = parseMarkdown(content);

  return { frontmatter, html, raw };
}

/**
 * Get available markdown file for a given page and language
 * Falls back to English if the requested language doesn't exist
 */
export async function getMarkdownPath(
  page: string,
  lang: string,
  docsDir = "docs",
): Promise<string | null> {
  const safePage = page.replace(/[^a-z0-9-]/gi, "");
  const primaryPath = `${docsDir}/${lang}/${safePage}.md`;
  const fallbackPath = `${docsDir}/en/${safePage}.md`;

  try {
    await Deno.stat(primaryPath);
    return primaryPath;
  } catch {
    // File doesn't exist, try fallback
    try {
      await Deno.stat(fallbackPath);
      return fallbackPath;
    } catch {
      return null;
    }
  }
}
