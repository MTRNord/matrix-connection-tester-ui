import { StrictMode, } from 'react'
import { createRoot } from 'react-dom/client'
import './index.scss'
import App from './App.tsx'
import { Footer, GlobalStyle, Page, TopNav } from 'govuk-react'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GlobalStyle />
    <TopNav company="Connection Tester">
    </TopNav>
    <Page.WidthContainer>
      <Page.Main>
        <App />
      </Page.Main>
    </Page.WidthContainer>
    <Footer />
  </StrictMode>,
)
