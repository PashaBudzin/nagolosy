import { BrowserRouter, Routes, Route } from "react-router-dom"
import { Home } from "@/pages/home"
import { Test } from "@/pages/test"
import { Stats } from "@/pages/stats"
import { IdiomTest } from "@/pages/idiom-test"
import { IdiomStats } from "@/pages/idiom-stats"
import { HistoryTest } from "@/pages/history-test"
import { HistoryStats } from "@/pages/history-stats"
import { TermTest } from "@/pages/term-test"
import { TermStats } from "@/pages/term-stats"
import { VisualHistoryTest } from "@/pages/visual-history-test"
import { VisualHistoryStats } from "@/pages/visual-history-stats"
import { AnswersWords } from "@/pages/answers-words"
import { AnswersIdioms } from "@/pages/answers-idioms"
import { AnswersHistory } from "@/pages/answers-history"
import { AnswersTerms } from "@/pages/answers-terms"
import { AnswersVisualHistory } from "@/pages/answers-visual-history"
import { Competition } from "@/pages/competition"
import { NmtTests } from "@/pages/nmt-tests"
import { NmtTest } from "@/pages/nmt-test"
import { Credits } from "@/pages/credits"

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
        <Route path="/term-test" element={<TermTest />} />
        <Route path="/term-stats" element={<TermStats />} />
        <Route path="/visual-history-test" element={<VisualHistoryTest />} />
        <Route path="/visual-history-stats" element={<VisualHistoryStats />} />
        <Route path="/answers/words" element={<AnswersWords />} />
        <Route path="/answers/idioms" element={<AnswersIdioms />} />
        <Route path="/answers/history" element={<AnswersHistory />} />
        <Route path="/answers/terms" element={<AnswersTerms />} />
        <Route
          path="/answers/visual-history"
          element={<AnswersVisualHistory />}
        />
        <Route path="/competition" element={<Competition />} />
        <Route path="/nmt-tests" element={<NmtTests />} />
        <Route path="/nmt-test/:examId" element={<NmtTest />} />
        <Route path="/credits" element={<Credits />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
