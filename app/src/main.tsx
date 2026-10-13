import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// FR-19 fonts, bundled with the app (no request to Google Fonts — visitors' IP addresses
// stay private on the public site, FR-20). Each file covers all scripts via unicode-range,
// so the browser downloads only what a page needs (e.g. Czech letters in item names).
import '@fontsource/barlow-condensed/500.css'
import '@fontsource/barlow-condensed/600.css'
import '@fontsource/barlow-condensed/700.css'
import '@fontsource/overpass/400.css'
import '@fontsource/overpass/400-italic.css'
import '@fontsource/overpass/500.css'
import '@fontsource/overpass/600.css'
import '@fontsource/overpass/700.css'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
