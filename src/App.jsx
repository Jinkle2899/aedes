import { Routes, Route } from 'react-router-dom'
import MarketingLayout from './layouts/MarketingLayout.jsx'
import Home from './pages/Home.jsx'
import Templates from './pages/Templates.jsx'
import Pricing from './pages/Pricing.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Editor from './pages/Editor.jsx'

export default function App() {
  return (
    <Routes>
      <Route element={<MarketingLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/templates" element={<Templates />} />
        <Route path="/pricing" element={<Pricing />} />
      </Route>
      <Route path="/app" element={<Dashboard />} />
      <Route path="/app/editor/:siteId" element={<Editor />} />
    </Routes>
  )
}
