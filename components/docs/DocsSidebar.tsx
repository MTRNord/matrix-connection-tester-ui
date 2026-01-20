import type { I18n } from "../../lib/i18n.ts";

export interface DocsSection {
  title: string;
  items: DocsItem[];
}

export interface DocsItem {
  title: string;
  href: string;
  isPlaceholder?: boolean;
}

interface DocsSidebarProps {
  currentPath: string;
  i18n: I18n;
}

export default function DocsSidebar({ currentPath, i18n }: DocsSidebarProps) {
  const sections: DocsSection[] = [
    {
      title: i18n.tString("docs.nav.getting_started"),
      items: [
        { title: i18n.tString("docs.nav.overview"), href: "/docs" },
        {
          title: i18n.tString("docs.nav.federation_setup"),
          href: "/docs/federation-setup",
        },
        {
          title: i18n.tString("docs.nav.getting_help"),
          href: "/docs/getting-help",
        },
      ],
    },
    {
      title: i18n.tString("docs.nav.configuration"),
      items: [
        {
          title: i18n.tString("docs.nav.cors_configuration"),
          href: "/docs/cors-configuration",
        },
        {
          title: i18n.tString("docs.nav.cors_preflight"),
          href: "/docs/cors-preflight",
        },
        {
          title: i18n.tString("docs.nav.server_configuration"),
          href: "/docs/server-configuration",
        },
        {
          title: i18n.tString("docs.nav.tls_certificates"),
          href: "/docs/tls-certificates",
        },
        {
          title: i18n.tString("docs.nav.federation_tls"),
          href: "/docs/federation-tls",
        },
      ],
    },
    {
      title: i18n.tString("docs.nav.api_endpoints"),
      items: [
        {
          title: i18n.tString("docs.nav.support_endpoint"),
          href: "/docs/support-endpoint",
        },
        {
          title: i18n.tString("docs.nav.client_server_api"),
          href: "/docs/client-server-api",
        },
        {
          title: i18n.tString("docs.nav.wellknown_delegation"),
          href: "/docs/wellknown-delegation",
        },
      ],
    },
    {
      title: i18n.tString("docs.nav.troubleshooting"),
      items: [
        {
          title: i18n.tString("docs.nav.general_troubleshooting"),
          href: "/docs/troubleshooting",
        },
        {
          title: i18n.tString("docs.nav.network_troubleshooting"),
          href: "/docs/network-troubleshooting",
        },
        {
          title: i18n.tString("docs.nav.federation_network"),
          href: "/docs/federation-network",
        },
        {
          title: i18n.tString("docs.nav.server_logs"),
          href: "/docs/server-logs",
        },
        {
          title: i18n.tString("docs.nav.performance"),
          href: "/docs/performance",
        },
      ],
    },
    // {
    //   title: i18n.tString("docs.nav.compliance"),
    //   items: [
    //     {
    //       title: i18n.tString("docs.nav.compliance_suites"),
    //       href: "/docs/compliance-suites",
    //     },
    //   ],
    // },
  ];

  return (
    <nav class="govuk-!-margin-bottom-8" aria-label="Documentation navigation">
      {sections.map((section) => (
        <div class="govuk-!-margin-bottom-6" key={section.title}>
          <h3 class="govuk-heading-s govuk-!-margin-bottom-2">
            {section.title}
          </h3>
          <ul class="govuk-list">
            {section.items.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  class={`govuk-link${
                    currentPath === item.href ? " govuk-!-font-weight-bold" : ""
                  }`}
                  {...(currentPath === item.href && { "aria-current": "page" })}
                >
                  {item.title}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}
