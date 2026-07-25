import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// StrictMode double-mounts effects and would reload the ~38MB soundfont twice.
createRoot(document.getElementById('root')!).render(<App />)
