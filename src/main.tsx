import { StrictMode, } from 'react'
import { createRoot } from 'react-dom/client'
import './index.scss'
import App from './App.tsx'
import { Footer, GlobalStyle, Page, TopNav } from 'govuk-react'
import { ReloadPrompt } from './ReloadPrompt.tsx'
const APP_VERSION = typeof __APP_VERSION__ !== "undefined" ? __APP_VERSION__ : "dev";


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GlobalStyle />
    <ReloadPrompt />
    <TopNav company="Connection Tester">
    </TopNav>
    <Page.WidthContainer>
      <Page.Main>
        <App />
      </Page.Main>
    </Page.WidthContainer>
    {/* TODO: Link to repo */}
    <Footer meta={
      <>
        <Footer.MetaLinks heading='Project Links'>
          <Footer.Link href="https://matrix.org/">Matrix.org</Footer.Link>
          <Footer.Link href="https://github.com/MTRNord/matrix-connection-tester-ui/">UI Repository</Footer.Link>
          <Footer.Link href="https://github.com/MTRNord/rust-federation-tester/">Federation Tester API Repository</Footer.Link>
        </Footer.MetaLinks>
        <Footer.MetaCustom>
          Version: {APP_VERSION}
        </Footer.MetaCustom>
      </>
    } />
  </StrictMode>,
)
