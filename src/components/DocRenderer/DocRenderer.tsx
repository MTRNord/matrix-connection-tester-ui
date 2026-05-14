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

// Converts :::directive{attr=val} blocks into named hast elements so
// react-markdown's `components` map can render them as React components.
const remarkDirectiveComponents: Plugin<[], Root> = () => (tree) => {
  visit(tree, (node: any) => {
    if (
      node.type === 'containerDirective' ||
      node.type === 'leafDirective' ||
      node.type === 'textDirective'
    ) {
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
  banner({ kind, title, children }: { kind?: string; title?: string; children?: React.ReactNode }) {
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
    return <Card flush style={{ marginTop: 24, marginBottom: 24 }}><Table>{children}</Table></Card>
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
