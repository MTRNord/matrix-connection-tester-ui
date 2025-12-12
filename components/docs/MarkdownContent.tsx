import { ComponentChildren } from "preact";
import CodeBlock from "../CodeBlock.tsx";

interface MarkdownContentProps {
  html: string;
  children?: ComponentChildren;
}

/**
 * Decode HTML entities in text
 */
function decodeHtmlEntities(text: string): string {
  const entities: Record<string, string> = {
    "&amp;": "&",
    "&lt;": "<",
    "&gt;": ">",
    "&quot;": '"',
    "&#39;": "'",
    "&nbsp;": " ",
    "&#10;": "\n",
  };

  return text.replace(/&[#\w]+;/g, (entity) => entities[entity] || entity);
}

/**
 * Decode base64 string and unescape HTML entities
 */
function decodeBase64(base64: string): string {
  try {
    // Decode base64 to get the escaped HTML
    const decoded = decodeURIComponent(escape(atob(base64)));
    // Unescape HTML entities since CodeBlock will escape again
    return decoded
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");
  } catch (e) {
    console.error("Failed to decode base64:", e);
    return base64;
  }
}

/**
 * Component that renders parsed markdown HTML with CodeBlock components
 * for syntax highlighting and maintains GOV.UK Design System classes
 */
export default function MarkdownContent({ html }: MarkdownContentProps) {
  // Extract code blocks from the HTML
  const codeBlocks = new Map<string, { language: string; code: string }>();
  const codeBlockRegex =
    /<div data-codeblock data-language="([^"]*)" data-code-base64="([^"]*)"><\/div>/g;

  let match;
  let counter = 0;

  // Find all code blocks and store them
  while ((match = codeBlockRegex.exec(html)) !== null) {
    const language = decodeHtmlEntities(match[1]);
    const base64Code = match[2];
    const code = decodeBase64(base64Code);

    const id = `__CODEBLOCK_${counter++}__`;
    codeBlocks.set(id, {
      language: language || "text",
      code: code,
    });
  }

  // If no code blocks, just render the HTML directly
  if (codeBlocks.size === 0) {
    return (
      <div
        class="markdown-content"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }

  // Replace code block divs with span placeholders (inline element)
  // This prevents breaking HTML structure like details elements
  counter = 0;
  let processedHtml = html;
  const blockIds: string[] = [];

  processedHtml = processedHtml.replace(
    codeBlockRegex,
    () => {
      const id = `__CODEBLOCK_${counter++}__`;
      blockIds.push(id);
      // Use a span with a unique data attribute instead of a div
      return `<span data-codeblock-id="${id}" style="display: contents;"></span>`;
    },
  );

  // Map valid languages for CodeBlock component
  const validLanguages = [
    "json",
    "toml",
    "nginx",
    "caddy",
    "apache",
    "bash",
    "yaml",
    "dns",
    "javascript",
    "js",
    "http",
    "sql",
    "securitytxt",
    "text",
  ] as const;
  type ValidLanguage = typeof validLanguages[number];

  // Split the HTML by our span markers and reconstruct with CodeBlock components
  const parts: (string | { type: "code"; id: string })[] = [];
  let lastIndex = 0;

  const spanRegex =
    /<span data-codeblock-id="([^"]+)" style="display: contents;"><\/span>/g;
  let spanMatch;

  while ((spanMatch = spanRegex.exec(processedHtml)) !== null) {
    // Add HTML before the span
    if (spanMatch.index > lastIndex) {
      parts.push(processedHtml.substring(lastIndex, spanMatch.index));
    }

    // Add code block marker
    parts.push({ type: "code", id: spanMatch[1] });

    lastIndex = spanMatch.index + spanMatch[0].length;
  }

  // Add remaining HTML
  if (lastIndex < processedHtml.length) {
    parts.push(processedHtml.substring(lastIndex));
  }

  return (
    <div class="markdown-content">
      {parts.map((part, index) => {
        if (typeof part === "string") {
          // Raw HTML - render with dangerouslySetInnerHTML
          return (
            <span
              key={index}
              dangerouslySetInnerHTML={{ __html: part }}
              style={{ display: "contents" }}
            />
          );
        } else {
          // Code block
          const block = codeBlocks.get(part.id);
          if (block) {
            const language = (validLanguages.includes(
                block.language as ValidLanguage,
              )
              ? block.language
              : "text") as ValidLanguage;

            return (
              <CodeBlock key={index} language={language}>
                {block.code}
              </CodeBlock>
            );
          }
        }
        return null;
      })}
    </div>
  );
}
