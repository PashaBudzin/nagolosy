import { BrowserRouter, Routes, Route } from "react-router-dom"
import { Home } from "@/pages/home"
import { Test } from "@/pages/test"
import { Stats } from "@/pages/stats"
import { IdiomTest } from "@/pages/idiom-test"
import { IdiomStats } from "@/pages/idiom-stats"

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/test" element={<Test />} />
        <Route path="/stats" element={<Stats />} />
        <Route path="/idiom-test" element={<IdiomTest />} />
        <Route path="/idiom-stats" element={<IdiomStats />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
