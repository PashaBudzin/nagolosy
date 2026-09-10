import { BrowserRouter, Routes, Route } from "react-router-dom"
import { Home } from "@/pages/home"
import { Test } from "@/pages/test"
import { Stats } from "@/pages/stats"
import { IdiomTest } from "@/pages/idiom-test"
import { IdiomStats } from "@/pages/idiom-stats"
import { HistoryTest } from "@/pages/history-test"
import { HistoryStats } from "@/pages/history-stats"

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/test" element={<Test />} />
        <Route path="/stats" element={<Stats />} />
        <Route path="/idiom-test" element={<IdiomTest />} />
        <Route path="/idiom-stats" element={<IdiomStats />} />
        <Route path="/history-test" element={<HistoryTest />} />
        <Route path="/history-stats" element={<HistoryStats />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
