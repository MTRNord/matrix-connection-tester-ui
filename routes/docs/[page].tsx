import { define } from "../../utils.ts";
import DocsLayout from "../../components/docs/DocsLayout.tsx";
import MarkdownContent from "../../components/docs/MarkdownContent.tsx";
import { getMarkdownPath, loadMarkdownFile } from "../../lib/markdown.ts";

export default define.page(async function MarkdownDocsPage(ctx) {
  const { i18n } = ctx.state;
  const currentPath = ctx.url.pathname;
  let page = ctx.params.page;
  const lang = i18n.getLocale();

  // Handle /docs/ root path - default to index
  if (!page || page === "") {
    page = "index";
  }

  // Get the markdown file path (with fallback to English)
  const markdownPath = await getMarkdownPath(page, lang, "docs");

  if (!markdownPath) {
    // Page not found - return 404
    return new Response("Page not found", { status: 404 });
  }

  try {
    // Load and parse the markdown file
    const { frontmatter, html } = await loadMarkdownFile(markdownPath);

    // Extract title and description from frontmatter or use defaults
    const title = (frontmatter.title as string) ||
      i18n.tString(`docs.${page}.title`);
    const description = (frontmatter.description as string) ||
      i18n.tString(`docs.${page}.description`);

    return (
      <DocsLayout
        currentPath={currentPath}
        i18n={i18n}
        title={title}
        description={description}
      >
        <MarkdownContent html={html} />
      </DocsLayout>
    );
  } catch (error) {
    console.error(`Error loading markdown file ${markdownPath}:`, error);
    return new Response("Error loading page", { status: 500 });
  }
});
