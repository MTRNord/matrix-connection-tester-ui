import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkDirective from 'remark-directive'
import { visit } from 'unist-util-visit'
import type { Plugin } from 'unified'
import type { Root } from 'mdast'
import Banner from '#/components/Banner/Banner'
import Card from '#/components/Card/Card'
import Table from '#/components/Table/Table'

type BannerKind = 'ok' | 'warn' | 'bad' | 'info'

const SUPPORTED_DIRECTIVES = new Set(['banner', 'card'])

// Converts only known :::directive{attr=val} blocks into named hast elements.
// Unknown text directives (e.g. :matrix parsed out of #room:matrix.org) are
// restored to plain text so the original content is preserved.
const remarkDirectiveComponents: Plugin<[], Root> = () => (tree) => {
  visit(tree, (node: any) => {
    if (
      node.type === 'containerDirective' ||
      node.type === 'leafDirective' ||
      node.type === 'textDirective'
    ) {
      if (!SUPPORTED_DIRECTIVES.has(node.name)) {
        if (node.type === 'textDirective') {
          node.type = 'text'
          node.value = `:${node.name}`
        }
        return
      }
      const data = node.data ?? (node.data = {})
      data.hName = node.name
      data.hProperties = { ...node.attributes }
    }
  })
}

// Custom elements produced by remark-directive aren't in react-markdown's
// Components type, so we use `any` for the components map here.
const components: any = {
  // :::banner{kind="warn" title="..."}
  banner({
    kind,
    title,
    children,
  }: {
    kind?: string
    title?: string
    children?: React.ReactNode
  }) {
    return (
      <Banner kind={(kind ?? 'info') as BannerKind} title={title}>
        {children}
      </Banner>
    )
  },
  // :::card
  card({ children }: { children?: React.ReactNode }) {
    return <Card style={{ marginTop: 24 }}>{children}</Card>
  },
  table({ children }: { children?: React.ReactNode }) {
    return (
      <Card flush style={{ marginTop: 24, marginBottom: 24 }}>
        <Table>{children}</Table>
      </Card>
    )
  },
}

export default function DocRenderer({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkDirective, remarkDirectiveComponents]}
      components={components}
    >
      {content}
    </ReactMarkdown>
  )
}
