import { lazy, Suspense, useCallback, useEffect, useMemo, useState, type CSSProperties, type FormEvent, type ReactNode } from 'react'
import {
  Activity, ArrowDownRight, ArrowRight, ArrowUpRight, Award, BarChart3,
  BookOpen, BrainCircuit, CalendarDays, Check, CheckCircle2, ChevronDown,
  ChevronLeft, ChevronRight, CircleHelp, Clock3, Cloud, Compass,
  Flame, Flag, GraduationCap, Layers3, Lightbulb, Menu,
  MoreHorizontal, Play, RotateCcw, Search, Settings2, Timer,
  ShieldCheck, Sparkles, Target, X, Zap,
} from 'lucide-react'
import { Link, NavLink, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { flashcards, modules, questions, topics, type Question } from './lib/content'
import {
  calculateReadiness, generateStudyPlan, scoreQuiz, updateReviewRecord,
  type QuizAttempt, type QuizAnswer, type StudySession,
} from './lib/learning'
import { clearState, loadState, saveState, type DemoState } from './lib/storage'

const navItems = [
  { label: 'Dashboard', path: '/', icon: Compass },
  { label: 'Practice quizzes', path: '/quizzes', icon: Target },
  { label: 'Flashcards', path: '/flashcards', icon: Layers3 },
  { label: 'AI study buddy', path: '/buddy', icon: BrainCircuit },
  { label: 'Study planner', path: '/planner', icon: CalendarDays },
  { label: 'Readiness', path: '/readiness', icon: BarChart3 },
  { label: 'Learning library', path: '/library', icon: BookOpen },
]

const cx = (...values: Array<string | false | undefined>) => values.filter(Boolean).join(' ')
const ScoreChart = lazy(() => import('./components/ScoreChart'))

function App() {
  const [data, setData] = useState<DemoState>(loadState)
  const [toast, setToast] = useState('')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [now, setNow] = useState(() => new Date())
  const location = useLocation()
  const readiness = useMemo(() => calculateReadiness(data.attempts, topics), [data.attempts])

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    function handleShortcut(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setSearchOpen((value) => !value)
      }
      if (event.key === 'Escape') setSearchOpen(false)
    }
    window.addEventListener('keydown', handleShortcut)
    return () => window.removeEventListener('keydown', handleShortcut)
  }, [])

  const notify = useCallback((message: string) => {
    setToast(message)
    window.setTimeout(() => setToast(''), 3200)
  }, [])

  const update = useCallback((next: DemoState): boolean => {
    try {
      saveState(next)
      setData(next)
      return true
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Could not save the change.')
      return false
    }
  }, [notify])

  const context = useMemo(() => ({ data, update, notify, readiness, now }), [data, update, notify, readiness, now])
  const pageTitle = location.pathname === '/settings'
    ? 'Settings'
    : navItems.find((item) => item.path === location.pathname)?.label ?? 'Dashboard'

  return (
    <div className="app-shell">
      <aside className={cx('sidebar', mobileOpen && 'sidebar-open')}>
        <Link className="brand" to="/" aria-label="CloudAce AI dashboard">
          <span className="brand-mark"><Cloud size={23} strokeWidth={2.4} /><Check size={11} /></span>
          <span className="brand-name">CloudAce<span>AI</span></span>
        </Link>
        <div className="track-select">
          <span className="track-icon"><Cloud size={17} /></span>
          <span><b>AZ-900</b><small>Azure Fundamentals</small></span>
          <ChevronDown size={15} className="track-chevron" />
        </div>
        <p className="nav-caption">LEARN</p>
        <nav className="primary-nav" aria-label="Primary navigation">
          {navItems.map(({ label, path, icon: Icon }) => (
            <NavLink key={path} end={path === '/'} to={path} onClick={() => { setMobileOpen(false); setSearchOpen(false) }} className={({ isActive }) => cx('nav-link', isActive && 'active')}>
              <Icon size={18} strokeWidth={1.8} /><span>{label}</span>
              {path === '/flashcards' && <span className="nav-count">{Object.keys(data.reviews).length ? Object.keys(data.reviews).length : flashcards.length}</span>}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-spacer" />
        <div className="sidebar-coach">
          <span className="coach-spark"><Sparkles size={16} /></span>
          <strong>Your next small win</strong>
          <p>{readiness.questionsAnswered ? 'A quick review keeps new ideas fresh.' : 'Try a short quiz to find your best next step.'}</p>
          <Link to={readiness.questionsAnswered ? '/flashcards' : '/quizzes'} className="coach-link">
            {readiness.questionsAnswered ? 'Review cards' : 'Start a quiz'} <ArrowRight size={14} />
          </Link>
        </div>
        <NavLink to="/settings" onClick={() => { setMobileOpen(false); setSearchOpen(false) }} className={({ isActive }) => cx('nav-link settings-link', isActive && 'active')}>
          <Settings2 size={18} strokeWidth={1.8} /><span>Settings</span>
        </NavLink>
        <div className="profile">
          <div className="avatar">S</div>
          <div><b>Study space</b><small>Local demo</small></div>
          <MoreHorizontal size={19} />
        </div>
      </aside>
      {mobileOpen && <button className="mobile-scrim" aria-label="Close navigation" onClick={() => setMobileOpen(false)} />}
      <div className="main-column">
        <header className="topbar">
          <button className="icon-button mobile-menu" aria-label="Open navigation" onClick={() => setMobileOpen(true)}><Menu size={20} /></button>
          <div className="breadcrumbs"><span>AZ-900</span><ChevronRight size={14} /><b>{pageTitle}</b></div>
          <div className="top-actions">
            <button className="search-trigger" onClick={() => setSearchOpen((value) => !value)}><Search size={17} /><span>Search</span><kbd>⌘ K</kbd></button>
            <span className="demo-chip"><span /> Demo mode</span>
            <Link to="/settings" className="top-avatar" aria-label="Open settings">S</Link>
          </div>
        </header>
        {searchOpen && <SearchPanel onClose={() => setSearchOpen(false)} />}
        <main className="page-content">
          <Routes>
            <Route path="/" element={<Dashboard {...context} />} />
            <Route path="/quizzes" element={<QuizPage {...context} />} />
            <Route path="/flashcards" element={<FlashcardsPage {...context} />} />
            <Route path="/buddy" element={<BuddyPage />} />
            <Route path="/planner" element={<PlannerPage {...context} />} />
            <Route path="/readiness" element={<ReadinessPage {...context} />} />
            <Route path="/library" element={<LibraryPage />} />
            <Route path="/settings" element={<SettingsPage {...context} />} />
            <Route path="*" element={<Dashboard {...context} />} />
          </Routes>
        </main>
        <footer className="app-footer">
          <span>CloudAce AI · Independent learning companion</span>
          <a href="https://learn.microsoft.com/credentials/certifications/azure-fundamentals/" target="_blank" rel="noreferrer">Official AZ-900 resources <ArrowUpRight size={12} /></a>
        </footer>
      </div>
      {toast && <div className="toast" role="status"><CheckCircle2 size={17} />{toast}</div>}
    </div>
  )
}

type SharedProps = {
  data: DemoState
  update: (data: DemoState) => boolean
  notify: (message: string) => void
  readiness: ReturnType<typeof calculateReadiness>
  now: Date
}

function Dashboard({ data, readiness, now }: SharedProps) {
  const navigate = useNavigate()
  const chartData = [...data.attempts].reverse().map((attempt) => ({
    name: new Date(attempt.completedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    score: Math.round(attempt.score / Math.max(1, attempt.total) * 100),
  }))
  const topicRows = readiness.topicScores
  const dueCount = flashcards.filter((card) => !data.reviews[card.id] || new Date(data.reviews[card.id].nextDueAt) <= now).length
  const nextSession = data.plan.find((session) => !session.completed && !session.skipped)
  const lastAttempt = data.attempts[0]
  const studyMinutes = data.plan.filter((session) => session.completed).reduce((total, session) => total + session.minutes, 0)
  const activeDays = new Set(data.attempts.map((attempt) => new Date(attempt.completedAt).toDateString())).size
  const weakest = topicRows.filter((topic) => topic.accuracy !== null).sort((a, b) => (a.accuracy ?? 0) - (b.accuracy ?? 0))[0]

  return (
    <>
      <div className="welcome-row">
        <div><div className="eyebrow"><span className="eyebrow-dot" /> YOUR LEARNING SPACE</div><h1>Good to see you<span className="wave">.</span></h1><p className="subheading">A little progress each day adds up. What would you like to work on?</p></div>
        <Link to="/planner" className="button button-outline"><CalendarDays size={16} /> View study plan</Link>
      </div>
      <section className="hero-panel">
        <div className="hero-content">
          <span className="hero-kicker"><Sparkles size={14} /> YOUR AZURE FUNDAMENTALS JOURNEY</span>
          <h2>{readiness.questionsAnswered ? 'Keep building your cloud confidence.' : 'Your cloud journey starts here.'}</h2>
          <p>{readiness.questionsAnswered ? 'Practice a few more questions and see how your understanding grows.' : 'Start with a quick practice set. We’ll use your answers to suggest a useful next step.'}</p>
          <button className="button button-light" onClick={() => navigate('/quizzes')}><Play size={15} fill="currentColor" /> {readiness.questionsAnswered ? 'Continue learning' : 'Take your first quiz'} <ArrowRight size={15} /></button>
          <div className="hero-meta"><span><Clock3 size={14} /> About 5 minutes</span><span><ShieldCheck size={14} /> Learn at your pace</span></div>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="orbit orbit-one" /><div className="orbit orbit-two" />
          <div className="hero-cloud"><Cloud size={66} strokeWidth={1.4} /><span><Check size={23} /></span></div>
          <div className="float-card float-card-top"><Zap size={14} /> One step at a time</div>
          <div className="float-card float-card-bottom"><span className="float-dot" /> AZURE FUNDAMENTALS</div>
          <span className="sparkle star-one">✦</span><span className="sparkle star-two">✧</span>
        </div>
        <div className="hero-grain" />
      </section>

      <div className="section-heading"><div><h2>Your progress</h2><p>Real activity from this browser demo.</p></div><span className="local-note"><span /> Saved on this device</span></div>
      <div className="stats-grid">
        <StatCard icon={<Target size={17} />} label="Practice accuracy" value={readiness.questionsAnswered ? `${readiness.accuracy}%` : '—'} hint={readiness.questionsAnswered ? 'Across all attempts' : 'Complete a quiz to begin'} tone="violet" />
        <StatCard icon={<CircleHelp size={17} />} label="Questions answered" value={String(readiness.questionsAnswered)} hint={data.attempts.length ? `${data.attempts.length} quiz ${data.attempts.length === 1 ? 'attempt' : 'attempts'}` : 'Your practice adds up here'} tone="blue" />
        <StatCard icon={<Clock3 size={17} />} label="Study time" value={studyMinutes ? `${studyMinutes} min` : '—'} hint={studyMinutes ? 'Completed plan sessions' : 'Track time with your plan'} tone="green" />
        <StatCard icon={<Flame size={17} />} label="Active days" value={String(activeDays)} hint="Days with a completed quiz" tone="amber" />
      </div>

      <div className="dashboard-grid">
        <section className="card chart-card">
          <div className="card-heading"><div><h3>Score over time</h3><p>Quiz results from completed attempts</p></div><button className="mini-select">All attempts <ChevronDown size={14} /></button></div>
          {chartData.length > 0 ? <Suspense fallback={<div className="chart-wrap chart-loading">Loading score history…</div>}><ScoreChart data={chartData} /></Suspense> : <EmptyChart onStart={() => navigate('/quizzes')} />}
        </section>
        <section className="card topics-card">
          <div className="card-heading"><div><h3>Topic confidence</h3><p>Based on your quiz answers</p></div><Link to="/readiness" className="icon-link" aria-label="View readiness"><ArrowUpRight size={17} /></Link></div>
          <div className="topic-bars">
            {topicRows.map((item, index) => (
              <div className="topic-row" key={item.topic}>
                <div className="topic-row-head"><span>{item.topic}</span><b>{item.accuracy === null ? '—' : `${item.accuracy}%`}</b></div>
                <div className="progress-track"><span className={`progress-fill fill-${index}`} style={{ width: `${item.accuracy ?? 0}%` }} /></div>
                <small>{item.attempted ? `${item.attempted} answered` : 'Not practiced yet'}</small>
              </div>
            ))}
          </div>
          <Link to="/readiness" className="text-link topic-link">Explore topic readiness <ArrowRight size={14} /></Link>
        </section>
      </div>

      <div className="dashboard-grid lower-grid">
        <section className="card action-card">
          <div className="card-heading"><div><h3>Pick up where you left off</h3><p>Your next recommended step</p></div><span className="icon-bubble bubble-purple"><Lightbulb size={17} /></span></div>
          {weakest ? (
            <div className="recommendation"><span className="recommendation-label">RECOMMENDED FOR YOU</span><h4>Review {weakest.topic}</h4><p>Your practice answers show this topic could use another look. A focused review can help strengthen the basics.</p><Link to="/flashcards" className="button button-primary button-small">Review flashcards <ArrowRight size={14} /></Link><span className="why-note"><BrainCircuit size={13} /> Suggested from your recent quiz answers</span></div>
          ) : <div className="first-step"><h4>Begin with a quick practice quiz</h4><p>Your results will help surface topics to explore next.</p><Link to="/quizzes" className="button button-primary button-small">Start practicing <ArrowRight size={14} /></Link></div>}
        </section>
        <section className="card activity-card">
          <div className="card-heading"><div><h3>Coming up</h3><p>From your personal study plan</p></div><Link to="/planner" className="text-link">View plan <ArrowRight size={14} /></Link></div>
          {nextSession ? <SessionPreview session={nextSession} /> : <div className="compact-empty"><span className="empty-icon"><CalendarDays size={18} /></span><div><b>No sessions planned yet</b><p>Build a flexible study schedule around your week.</p></div><Link to="/planner" className="text-link">Make a plan <ArrowRight size={13} /></Link></div>}
          <div className="activity-divider" />
          <div className="card-heading recent-heading"><div><h3>Recent practice</h3><p>Your latest quiz activity</p></div><Link to="/quizzes" className="text-link">Practice <ArrowRight size={14} /></Link></div>
          {lastAttempt ? <div className="recent-attempt"><span className="attempt-icon"><Target size={16} /></span><div><b>AZ-900 practice quiz</b><small>{new Date(lastAttempt.completedAt).toLocaleDateString()} · {lastAttempt.total} questions</small></div><strong>{Math.round(lastAttempt.score / lastAttempt.total * 100)}%</strong></div> : <div className="recent-empty">Your completed quizzes will show up here.</div>}
          <Link to="/flashcards" className="due-link"><Layers3 size={15} /><span><b>{dueCount} flashcards ready to review</b><small>Review at your own pace</small></span><ArrowRight size={15} /></Link>
        </section>
      </div>
      <div className="dashboard-footnote"><ShieldCheck size={14} /> Your practice data is stored in this browser only. <Link to="/settings">Learn about demo mode</Link></div>
    </>
  )
}

function StatCard({ icon, label, value, hint, tone }: { icon: ReactNode; label: string; value: string; hint: string; tone: string }) {
  return <article className="card stat-card"><span className={`stat-icon ${tone}`}>{icon}</span><div className="stat-label">{label}</div><div className="stat-value">{value}</div><div className="stat-hint">{hint}</div></article>
}

function EmptyChart({ onStart }: { onStart: () => void }) {
  return <div className="empty-chart"><div className="chart-placeholder"><span /><span /><span /><span /><span /></div><p>Once you finish a quiz, your scores will appear here.</p><button onClick={onStart} className="text-link">Take a quick quiz <ArrowRight size={14} /></button></div>
}

function SessionPreview({ session }: { session: StudySession }) {
  const date = new Date(`${session.date}T12:00:00`)
  return <div className="session-preview"><div className="date-tile"><b>{date.toLocaleDateString(undefined, { day: '2-digit' })}</b><small>{date.toLocaleDateString(undefined, { month: 'short' }).toUpperCase()}</small></div><div className="session-details"><span className="session-type">{session.type} · {session.minutes} min</span><b>{session.title}</b><small>{session.topic}</small></div><Link to="/planner" className="icon-link" aria-label="Open study plan"><ArrowRight size={16} /></Link></div>
}

function SearchPanel({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState('')
  const navigate = useNavigate()
  const results = navItems.filter((item) => item.label.toLowerCase().includes(query.toLowerCase()))
  return <div className="search-panel"><div className="search-box"><Search size={18} /><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search your learning space..." /><button onClick={onClose} aria-label="Close search"><X size={18} /></button></div>{query && <div className="search-results">{results.map((item) => <button key={item.path} onClick={() => { navigate(item.path); onClose() }}><item.icon size={17} />{item.label}<ArrowRight size={14} /></button>)}{!results.length && <p>No pages found for “{query}”.</p>}</div>}</div>
}

function QuizPage({ data, update, notify }: SharedProps) {
  const [topic, setTopic] = useState('All topics')
  const [count, setCount] = useState(5)
  const [mode, setMode] = useState<'practice' | 'assessment'>('practice')
  const [activeQuiz, setActiveQuiz] = useState<Question[] | null>(null)
  const [completed, setCompleted] = useState<QuizAttempt | null>(null)
  const [answers, setAnswers] = useState<Record<string, number[]>>({})
  const [index, setIndex] = useState(0)
  const [timed, setTimed] = useState(false)
  const [secondsRemaining, setSecondsRemaining] = useState(300)
  const [startedAt, setStartedAt] = useState(0)
  const [flagged, setFlagged] = useState<string[]>([])
  const current = activeQuiz?.[index]
  const selected = current ? answers[current.id] ?? [] : []
  const checked = Boolean(current && answers[`${current.id}-checked`]?.[0] === 1)
  const start = (topicValue = topic, countValue = count, modeValue = mode) => {
    const pool = questions.filter((question) => topicValue === 'All topics' || question.topic === topicValue)
    const chosen = pool.slice(0, Math.min(countValue, pool.length))
    if (!chosen.length) return
    setActiveQuiz(chosen)
    setAnswers({})
    setIndex(0)
    setCompleted(null)
    setMode(modeValue)
    setSecondsRemaining(300)
    setStartedAt(Date.now())
    setFlagged([])
  }
  const finish = useCallback((allAnswers: Record<string, number[]>) => {
    if (!activeQuiz) return
    const submitted: QuizAnswer[] = activeQuiz.map((question) => ({
      questionId: question.id,
      selected: allAnswers[question.id] ?? [],
      correct: scoreQuiz([question], { [question.id]: allAnswers[question.id] ?? [] }) === 1,
    }))
    const attempt: QuizAttempt = {
      id: crypto.randomUUID(),
      completedAt: new Date().toISOString(),
      questionIds: activeQuiz.map((question) => question.id),
      flaggedQuestionIds: flagged,
      answers: submitted,
      score: submitted.filter((answer) => answer.correct).length,
      total: submitted.length,
      durationSeconds: Math.max(0, Math.floor((Date.now() - startedAt) / 1000)),
      mode,
      timed,
    }
    const saved = update({ ...data, attempts: [attempt, ...data.attempts] })
    setCompleted(attempt)
    setActiveQuiz(null)
    if (saved) notify('Quiz results saved to this browser.')
  }, [activeQuiz, data, flagged, mode, notify, startedAt, timed, update])
  useEffect(() => {
    if (!activeQuiz || !timed) return
    if (secondsRemaining <= 0) {
      const timeout = window.setTimeout(() => finish(answers), 0)
      return () => window.clearTimeout(timeout)
    }
    const timeout = window.setTimeout(() => setSecondsRemaining((value) => value - 1), 1000)
    return () => window.clearTimeout(timeout)
  }, [activeQuiz, answers, finish, secondsRemaining, timed])
  const toggleAnswer = (option: number) => {
    if (!current) return
    const next = current.format === 'multiple'
      ? selected.includes(option) ? selected.filter((value) => value !== option) : [...selected, option]
      : [option]
    setAnswers({ ...answers, [current.id]: next })
  }
  const checkPracticeAnswer = () => {
    if (!current || selected.length === 0) return
    setAnswers({ ...answers, [`${current.id}-checked`]: [1] })
  }
  const nextQuestion = () => {
    if (!activeQuiz || !current) return
    if (index === activeQuiz.length - 1) {
      const unanswered = activeQuiz.filter((question) => !answers[question.id]?.length).length
      if (unanswered && !window.confirm(`${unanswered} question${unanswered === 1 ? '' : 's'} unanswered. Submit this quiz anyway?`)) return
      finish(answers)
    }
    else setIndex((value) => value + 1)
  }
  const closeQuiz = () => { setActiveQuiz(null); setCompleted(null) }

  if (completed) return <QuizResults attempt={completed} onRetry={() => start()} onClose={closeQuiz} />
  if (activeQuiz && current) {
    const correct = scoreQuiz([current], { [current.id]: selected }) === 1
    const showFeedback = mode === 'practice' && checked
    return <div className="quiz-page">
      <button className="back-link" onClick={closeQuiz}><ChevronLeft size={16} /> Exit quiz</button>
      <section className="quiz-panel card">
        <div className="quiz-topline"><span>{mode === 'assessment' ? 'ASSESSMENT MODE' : 'PRACTICE MODE'}{timed && <span className="timer-display"><Timer size={12} /> {Math.floor(secondsRemaining / 60)}:{String(secondsRemaining % 60).padStart(2, '0')}</span>}</span><span>{index + 1} <i>of</i> {activeQuiz.length}</span></div>
        <div className="quiz-progress"><span style={{ width: `${((index + 1) / activeQuiz.length) * 100}%` }} /></div>
        <div className="quiz-meta"><span className="tag">{current.topic}</span><span className="difficulty">{current.difficulty}</span><button className={cx('flag-button', flagged.includes(current.id) && 'flagged')} aria-pressed={flagged.includes(current.id)} aria-label={flagged.includes(current.id) ? 'Remove flag from question' : 'Flag question for review'} onClick={() => setFlagged((items) => items.includes(current.id) ? items.filter((id) => id !== current.id) : [...items, current.id])}><Flag size={15} /> {flagged.includes(current.id) ? 'Flagged' : 'Flag'}</button></div>
        <div className="question-navigation" aria-label="Question navigation">{activeQuiz.map((question, questionIndex) => <button key={question.id} className={cx(questionIndex === index && 'current-question', Boolean(answers[question.id]?.length) && 'answered-question', flagged.includes(question.id) && 'flagged-question')} aria-label={`Go to question ${questionIndex + 1}${flagged.includes(question.id) ? ', flagged' : ''}`} onClick={() => setIndex(questionIndex)}>{questionIndex + 1}{flagged.includes(question.id) && <Flag size={8} />}</button>)}</div>
        <h1 className="question-title">{current.prompt}</h1>
        {current.format === 'multiple' && <p className="select-hint">Choose all answers that apply.</p>}
        <div className="answer-options">{current.options.map((option, optionIndex) => {
          const isSelected = selected.includes(optionIndex)
          const isCorrectOption = current.answer.includes(optionIndex)
          return <button key={option} className={cx('answer-option', isSelected && 'selected', showFeedback && isCorrectOption && 'answer-correct', showFeedback && isSelected && !correct && 'answer-wrong')} onClick={() => !showFeedback && toggleAnswer(optionIndex)} disabled={showFeedback}>
            <span className={cx('option-marker', current.format === 'multiple' && 'checkbox-marker', isSelected && 'marker-selected', showFeedback && isCorrectOption && 'marker-right')}>{showFeedback && isCorrectOption ? <Check size={15} /> : current.format === 'multiple' && isSelected ? <Check size={14} /> : String.fromCharCode(65 + optionIndex)}</span><span>{option}</span>
          </button>
        })}</div>
        {showFeedback && <div className={cx('feedback-box', correct ? 'feedback-good' : 'feedback-retry')}><span>{correct ? <CheckCircle2 size={18} /> : <Lightbulb size={18} />}</span><div><b>{correct ? 'That’s right!' : 'Not quite — here’s why'}</b><p>{current.explanation}</p><a href={current.sourceUrl} target="_blank" rel="noreferrer">{current.source} <ArrowUpRight size={12} /></a></div></div>}
        <div className="quiz-footer"><span><CircleHelp size={14} /> {current.format === 'multiple' ? 'Select every correct answer' : 'Choose the best answer'}</span>
          {mode === 'practice' && !checked ? <button className="button button-primary" disabled={!selected.length} onClick={checkPracticeAnswer}>Check answer <ArrowRight size={15} /></button> : <button className="button button-primary" disabled={!selected.length && !showFeedback} onClick={nextQuestion}>{index === activeQuiz.length - 1 ? 'See results' : 'Next question'} <ArrowRight size={15} /></button>}
        </div>
      </section>
    </div>
  }

  return <div className="content-page">
    <div className="page-title-row"><div><div className="eyebrow"><span className="eyebrow-dot" /> BUILD YOUR CONFIDENCE</div><h1>Practice quizzes</h1><p className="subheading">Original practice questions with clear explanations, inspired by the public AZ-900 skills outline.</p></div><span className="unofficial-badge"><ShieldCheck size={15} /> Independent study tool</span></div>
    <div className="quiz-layout">
      <section className="card quiz-builder">
        <div className="builder-icon"><Target size={21} /></div><h2>Make a practice set</h2><p>Choose a topic and a few questions. Your answers help highlight what to revisit.</p>
        <label className="field-label" htmlFor="quiz-topic">Topic</label><select id="quiz-topic" className="field-control" value={topic} onChange={(event) => setTopic(event.target.value)}><option>All topics</option>{topics.map((item) => <option key={item}>{item}</option>)}</select>
        <div className="field-label">Number of questions</div><div className="segmented">{[3, 5, 8].map((value) => <button key={value} className={count === value ? 'chosen' : ''} onClick={() => setCount(value)}>{value}</button>)}</div>
        <div className="field-label">Study mode</div><div className="mode-choice">
          <button className={cx('mode-option', mode === 'practice' && 'mode-active')} onClick={() => setMode('practice')}><span className="mode-radio" /><span><b>Practice</b><small>See explanations as you go</small></span></button>
          <button className={cx('mode-option', mode === 'assessment' && 'mode-active')} onClick={() => setMode('assessment')}><span className="mode-radio" /><span><b>Assessment</b><small>Review answers at the end</small></span></button>
        </div>
        <button className={cx('timer-choice', timed && 'timer-active')} aria-pressed={timed} onClick={() => setTimed((value) => !value)}><span className="timer-toggle">{timed && <Check size={11} />}</span><span><b>Timed mode</b><small>Five-minute practice set</small></span><Timer size={16} /></button>
        <button className="button button-primary builder-submit" onClick={() => start()}>Start quiz <ArrowRight size={16} /></button>
        <p className="builder-note"><ShieldCheck size={14} /> Original practice questions · Not real exam questions</p>
      </section>
      <div className="quiz-side">
        <section className="card quiz-quick"><div className="quick-icon"><Zap size={18} /></div><div><span className="quick-label">QUICK PRACTICE</span><h3>Got five minutes?</h3><p>Try a short mixed-topic set and find a useful next step.</p>        <button className="text-link" onClick={() => { setTopic('All topics'); setCount(3); setMode('practice'); start('All topics', 3, 'practice') }}>Start quick quiz <ArrowRight size={14} /></button></div></section>
        <section className="card recent-quizzes"><div className="card-heading"><div><h3>Recent attempts</h3><p>Your saved practice results</p></div><Activity size={17} className="muted-icon" /></div>
          {data.attempts.length ? data.attempts.slice(0, 4).map((attempt) => <div className="attempt-row" key={attempt.id}><span className="attempt-icon"><Target size={15} /></span><div><b>{attempt.mode === 'assessment' ? 'Assessment' : 'Practice quiz'}</b><small>{new Date(attempt.completedAt).toLocaleDateString()} · {attempt.total} questions</small></div><strong>{Math.round(attempt.score / attempt.total * 100)}%</strong></div>) : <div className="recent-empty quiz-recent-empty">Your first attempt will appear here after you finish a quiz.</div>}
        </section>
        <div className="question-count-note"><BookOpen size={15} /> {questions.length} original practice questions across {topics.length} AZ-900 domains.</div>
      </div>
    </div>
  </div>
}

function QuizResults({ attempt, onRetry, onClose }: { attempt: QuizAttempt; onRetry: () => void; onClose: () => void }) {
  const pct = Math.round(attempt.score / Math.max(1, attempt.total) * 100)
  const details = attempt.answers.map((answer) => ({ answer, question: questions.find((item) => item.id === answer.questionId) })).filter((item): item is { answer: QuizAnswer; question: Question } => Boolean(item.question))
  return <div className="results-page">
    <button className="back-link" onClick={onClose}><ChevronLeft size={16} /> Back to quizzes</button>
    <div className="results-hero"><div className="results-badge"><Award size={28} /></div><div className="eyebrow">QUIZ COMPLETE</div><h1>Nice work showing up.</h1><p>Every attempt is a chance to learn something new.</p><div className="score-ring" style={{ '--score': `${pct}%` } as CSSProperties}><div><b>{pct}%</b><small>score</small></div></div><div className="results-count"><b>{attempt.score}</b> correct <span>·</span> {attempt.total - attempt.score} to review</div><div className="results-actions"><button className="button button-primary" onClick={onRetry}>Try another quiz <ArrowRight size={15} /></button><button className="button button-outline" onClick={onClose}>Done</button></div></div>
    <section className="card answer-review"><div className="card-heading"><div><h2>Review your answers</h2><p>Explanations help turn a missed answer into a useful reminder.</p></div></div>{details.map(({ answer, question }, index) => <article className="review-answer" key={answer.questionId}><div className="review-number">{String(index + 1).padStart(2, '0')}</div><div><span className={cx('answer-status', answer.correct ? 'status-correct' : 'status-incorrect')}>{answer.correct ? 'CORRECT' : 'REVIEW THIS'}</span>{attempt.flaggedQuestionIds.includes(question.id) && <span className="review-flag"> · FLAGGED FOR REVIEW</span>}<h3>{question.prompt}</h3><p>{question.explanation}</p><a href={question.sourceUrl} target="_blank" rel="noreferrer">{question.source} <ArrowUpRight size={12} /></a></div></article>)}</section>
  </div>
}

function FlashcardsPage({ data, update, notify, now }: SharedProps) {
  const [selectedTopic, setSelectedTopic] = useState('All topics')
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const cards = flashcards.filter((card) => selectedTopic === 'All topics' || card.topic === selectedTopic)
  const card = cards[index % Math.max(cards.length, 1)]
  const due = cards.filter((item) => !data.reviews[item.id] || new Date(data.reviews[item.id].nextDueAt) <= now).length
  function rate(rating: 'forgot' | 'difficult' | 'known') {
    if (!card) return
    const next = updateReviewRecord(data.reviews[card.id], rating)
    if (!update({ ...data, reviews: { ...data.reviews, [card.id]: next } })) return
    notify(rating === 'known' ? 'Card marked as known. Nice recall!' : rating === 'difficult' ? 'We’ll bring this card back soon.' : 'This card will return to your review queue shortly.')
    setFlipped(false)
    setIndex((value) => (value + 1) % Math.max(cards.length, 1))
  }
  return <div className="content-page">
    <div className="page-title-row"><div><div className="eyebrow"><span className="eyebrow-dot" /> MAKE IT STICK</div><h1>Flashcard coach</h1><p className="subheading">Short, focused reviews help you recall cloud concepts when it counts.</p></div><span className="due-pill"><Layers3 size={15} /> {due} due today</span></div>
    <div className="flash-layout">
      <section className="flash-main">
        <div className="flash-toolbar"><label htmlFor="flash-topic">Review topic</label><select id="flash-topic" value={selectedTopic} onChange={(event) => { setSelectedTopic(event.target.value); setIndex(0); setFlipped(false) }}><option>All topics</option>{topics.map((item) => <option key={item}>{item}</option>)}</select><span>{index + 1} / {cards.length}</span></div>
        {card ? <button className={cx('flashcard', flipped && 'flipped')} onClick={() => setFlipped((value) => !value)} aria-label={flipped ? 'Show flashcard question' : 'Reveal flashcard answer'}>
          <div className="flash-card-top"><span>{card.topic}</span><span><RotateCcw size={14} /> CLICK TO FLIP</span></div>
          <div className="flash-card-center"><span className="flash-card-label">{flipped ? 'THE SHORT ANSWER' : 'QUICK RECALL'}</span><h2>{flipped ? card.back : card.front}</h2><span className="flip-hint">{flipped ? 'Click to see the question' : 'Think it through, then reveal the answer'}</span></div>
          <div className="flash-card-bottom"><span><Sparkles size={15} /> Small reviews, stronger recall</span><span>{flipped ? 'ANSWER' : 'QUESTION'}</span></div>
        </button> : <div className="empty-state">No cards are available for this topic.</div>}
        {flipped ? <div className="recall-controls"><p>How well did you remember?</p><div><button className="recall-button recall-forgot" onClick={() => rate('forgot')}><X size={15} /><span><b>Forgot</b><small>Bring it back soon</small></span></button><button className="recall-button recall-hard" onClick={() => rate('difficult')}><RotateCcw size={15} /><span><b>Needs another look</b><small>Review tomorrow</small></span></button><button className="recall-button recall-known" onClick={() => rate('known')}><Check size={16} /><span><b>Got it</b><small>See it less often</small></span></button></div></div> : <div className="flash-nav"><button onClick={() => { setIndex((value) => (value - 1 + cards.length) % cards.length); setFlipped(false) }}><ChevronLeft size={15} /> Previous</button><button onClick={() => { setIndex((value) => (value + 1) % cards.length); setFlipped(false) }}>Skip card <ChevronRight size={15} /></button></div>}
      </section>
      <aside className="flash-aside">
        <section className="card flash-summary"><span className="summary-icon"><Layers3 size={18} /></span><h3>Your review queue</h3><p>Work through the deck at a pace that feels manageable.</p><div className="queue-number">{due}<small>cards due</small></div><div className="queue-progress"><span style={{ width: `${Math.round((Object.keys(data.reviews).length / flashcards.length) * 100)}%` }} /></div><small className="queue-caption">{Object.keys(data.reviews).length} of {flashcards.length} cards reviewed</small></section>
        <section className="card method-card"><div className="method-head"><BrainCircuit size={17} /><b>How the schedule works</b></div><p>Cards you forget come back in about 10 minutes. Difficult cards return tomorrow; known cards get a longer interval, up to 30 days.</p><span className="method-tag">Simple spaced repetition</span></section>
        <button className="button button-outline flash-quiz-link" onClick={() => window.location.assign('/quizzes')}><Target size={15} /> Practice these topics</button>
      </aside>
    </div>
  </div>
}

function BuddyPage() {
  const [question, setQuestion] = useState('')
  const [history, setHistory] = useState<Array<{ prompt: string; answer: string; source: string }>>([])
  const [details, setDetails] = useState(false)
  const [loading, setLoading] = useState(false)
  function explain(value = question) {
    const prompt = value.trim()
    if (!prompt) return
    setLoading(true)
    window.setTimeout(() => {
      const normalized = prompt.toLowerCase()
      const match = normalized.includes('elastic') || normalized.includes('scale')
        ? { term: 'Elasticity', simple: 'Elasticity means cloud resources can grow or shrink as demand changes.', analogy: 'Think of a water tap: open it wider when more water is needed, then turn it down afterward.', example: 'A Kenyan online shop might need extra application capacity during a holiday sale and less on a quiet afternoon.', relevance: 'For AZ-900, distinguish elasticity (matching changing demand) from scalability (handling increased workload by adding resources).', source: 'Describe cloud computing', url: 'https://learn.microsoft.com/training/modules/describe-cloud-compute/' }
        : normalized.includes('responsib') || normalized.includes('security')
          ? { term: 'Shared responsibility', simple: 'Cloud security is shared between the cloud provider and the customer; the split depends on the service.', analogy: 'Renting a furnished apartment: the building owner maintains the structure, while you still secure your belongings and lock the door.', example: 'A school using a cloud app still needs to control who can access student records, even when the provider operates the datacenters.', relevance: 'AZ-900 questions often ask how customer responsibility changes between IaaS, PaaS, and SaaS.', source: 'Describe cloud service types', url: 'https://learn.microsoft.com/training/modules/describe-cloud-service-types/' }
          : normalized.includes('region') || normalized.includes('zone')
            ? { term: 'Azure regions and zones', simple: 'A region is a geographic area with one or more datacenters. Availability zones are separate locations within a region.', analogy: 'A region is like a city; zones are separate, independently powered campuses in that city.', example: 'A Nairobi-based startup might consider a nearby available region for latency, and zones for resiliency where the service supports them.', relevance: 'The public AZ-900 outline expects you to identify regions, region pairs, and availability zones.', source: 'Describe Azure architecture', url: 'https://learn.microsoft.com/training/modules/describe-core-architectural-components-of-azure/' }
            : { term: 'Cloud concepts', simple: 'Cloud computing is the delivery of computing services over the internet, often with consumption-based pricing.', analogy: 'Instead of building your own power station, you connect to a utility and use what you need.', example: 'A small business can deploy an online learning app without first purchasing and maintaining its own datacenter hardware.', relevance: 'This is a foundational AZ-900 concept. Use Microsoft Learn to confirm details about a specific service.', source: 'Describe cloud computing', url: 'https://learn.microsoft.com/training/modules/describe-cloud-compute/' }
      const answer = `${match.term}|${match.simple}|${match.analogy}|${match.example}|${match.relevance}`
      setHistory((items) => [...items, { prompt, answer, source: `${match.source}|${match.url}` }])
      setQuestion('')
      setLoading(false)
    }, 180)
  }
  return <div className="content-page buddy-page">
    <div className="page-title-row"><div><div className="eyebrow"><span className="eyebrow-dot" /> LEARN IN PLAIN ENGLISH</div><h1>AI study buddy</h1><p className="subheading">Friendly explanations, grounded in official learning materials.</p></div><span className="fallback-badge"><span /> Guided demo answers</span></div>
    <div className="buddy-layout">
      <section className="card chat-card">
        <div className="chat-header"><span className="buddy-avatar"><BrainCircuit size={20} /></span><div><b>Your cloud learning coach</b><small><span /> Here to help you understand</small></div><span className="chat-mode">DEMO GUIDE</span></div>
        <div className="chat-messages">
          <div className="message coach-message"><span className="message-avatar"><Sparkles size={14} /></span><div className="message-bubble"><b>Hi there! What cloud concept can I help make clearer?</b><p>Try asking about elasticity, shared responsibility, Azure regions, or another AZ-900 topic.</p><small>Answers are guided examples, not live AI-generated advice.</small></div></div>
          {history.map((item, index) => {
            const [term, simple, analogy, example, relevance] = item.answer.split('|')
            const [sourceName, sourceUrl] = item.source.split('|')
            return <div key={`${item.prompt}-${index}`} className="conversation-pair"><div className="message user-message"><span>{item.prompt}</span></div><div className="message coach-message"><span className="message-avatar"><Sparkles size={14} /></span><div className="message-bubble explanation-bubble"><span className="term-chip">{term}</span><h3>{simple}</h3><div className="explanation-steps"><div><b>Why it matters</b><p>{relevance}</p></div>{details && <><div><b>A simple analogy</b><p>{analogy}</p></div><div><b>Real-world example</b><p>{example}</p></div></>}</div><button className="text-link details-toggle" onClick={() => setDetails((value) => !value)}>{details ? 'Show less' : 'More detail'} <ChevronDown size={13} /></button><a className="source-link" href={sourceUrl} target="_blank" rel="noreferrer">Source: {sourceName} <ArrowUpRight size={12} /></a></div></div></div>
          })}
          {loading && <div className="thinking"><span /><span /><span /> Finding a clear explanation…</div>}
        </div>
        <form className="chat-composer" onSubmit={(event) => { event.preventDefault(); explain() }}><textarea rows={2} value={question} onChange={(event) => setQuestion(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); explain() } }} placeholder="Ask about a cloud concept..." aria-label="Ask your study buddy" /><button className="send-button" disabled={loading || !question.trim()} aria-label="Send question"><ArrowRight size={17} /></button><span>Press Enter to send · Shift + Enter for a new line</span></form>
      </section>
      <aside className="buddy-aside">
        <section className="card prompt-card"><div className="card-heading"><div><h3>Try a prompt</h3><p>Start with one of these</p></div><Lightbulb size={17} className="muted-icon" /></div>{['Explain elasticity simply', 'What is shared responsibility?', 'How do Azure regions work?'].map((prompt) => <button key={prompt} className="suggestion-prompt" onClick={() => explain(prompt)}>{prompt}<ArrowUpRight size={14} /></button>)}</section>
        <div className="ai-status-card"><ShieldCheck size={17} /><div><b>AI service not connected</b><p>These curated explanations work without an API key. Connect a secure server-side AI provider to enable live tutoring.</p><Link to="/settings">Configuration guide <ArrowRight size={13} /></Link></div></div>
        <div className="independence-note"><span><GraduationCap size={16} /></span><p><b>Independent learning support</b>Verify important details in the official Microsoft Learn documentation linked with each explanation.</p></div>
      </aside>
    </div>
  </div>
}

function PlannerPage({ data, update, notify, now }: SharedProps) {
  const [examDate, setExamDate] = useState(data.preferences.examDate)
  const [minutes, setMinutes] = useState(data.preferences.dailyMinutes)
  const [selectedDays, setSelectedDays] = useState(data.preferences.studyDays)
  const [error, setError] = useState('')
  const [showCompleted, setShowCompleted] = useState(false)
  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const nextSessions = data.plan.filter((session) => showCompleted || (!session.completed && !session.skipped))
  function toggleDay(day: number) { setSelectedDays((days) => days.includes(day) ? days.filter((item) => item !== day) : [...days, day].sort()) }
  function createPlan(event: FormEvent) {
    event.preventDefault()
    setError('')
    try {
      const weak = data.attempts.length
        ? calculateReadiness(data.attempts, topics).topicScores.filter((item) => item.accuracy !== null).sort((a, b) => (a.accuracy ?? 0) - (b.accuracy ?? 0)).map((item) => item.topic)
        : []
      const plan = generateStudyPlan(examDate, minutes, selectedDays, weak, now)
      const completed = data.plan.filter((session) => session.completed)
      const completedIds = new Set(completed.map((session) => session.id))
      const mergedPlan = [...completed, ...plan.filter((session) => !completedIds.has(session.id))]
        .sort((a, b) => a.date.localeCompare(b.date))
      if (update({ ...data, plan: mergedPlan, preferences: { examDate, dailyMinutes: minutes, studyDays: selectedDays } })) {
        notify(`Created ${plan.length} study sessions around your available days.`)
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not create the study plan.')
    }
  }
  function toggleSession(session: StudySession, field: 'completed' | 'skipped') {
    const plan = data.plan.map((item) => item.id === session.id ? { ...item, [field]: !item[field] } : item)
    if (update({ ...data, plan })) {
      notify(field === 'completed' ? session.completed ? 'Session marked as not complete.' : 'Great work — session complete.' : 'Session skipped.')
    }
  }
  return <div className="content-page">
    <div className="page-title-row"><div><div className="eyebrow"><span className="eyebrow-dot" /> A PLAN THAT FITS YOUR LIFE</div><h1>Study planner</h1><p className="subheading">Make steady progress with a realistic schedule built around your week.</p></div><span className="unofficial-badge"><CalendarDays size={15} /> Flexible by design</span></div>
    <div className="planner-layout">
      <section className="card planner-form-card"><div className="builder-icon"><CalendarDays size={20} /></div><h2>Plan your next steps</h2><p>Your plan uses your actual available days. Completed sessions stay saved when you regenerate.</p><form onSubmit={createPlan}>
        <label className="field-label" htmlFor="exam-date">Target exam date <span>Optional in your overall study journey</span></label><input required id="exam-date" className="field-control" type="date" min={new Date(now.getTime() + 86400000).toISOString().slice(0, 10)} value={examDate} onChange={(event) => setExamDate(event.target.value)} />
        <label className="field-label" htmlFor="study-minutes">Available time per study session</label><div className="range-control"><input id="study-minutes" type="range" min="15" max="120" step="15" value={minutes} onChange={(event) => setMinutes(Number(event.target.value))} /><span>{minutes} min</span></div>
        <div className="field-label">Days that work for you</div><div className="day-select">{dayLabels.map((day, index) => <button type="button" key={day} className={selectedDays.includes(index) ? 'day-selected' : ''} aria-pressed={selectedDays.includes(index)} onClick={() => toggleDay(index)}>{day.slice(0, 1)}<span>{day}</span></button>)}</div>
        {error && <div className="field-error" role="alert">{error}</div>}
        <button className="button button-primary builder-submit" type="submit">{data.plan.length ? 'Regenerate future sessions' : 'Create my study plan'} <ArrowRight size={15} /></button>
      </form><div className="planner-rule"><ShieldCheck size={15} /><span>Sessions rotate between learning, practice, and spaced review. A maximum of six weeks is scheduled at once.</span></div></section>
      <section className="card plan-list-card"><div className="card-heading"><div><h2>Your study sessions</h2><p>{data.plan.length ? `${data.plan.filter((session) => session.completed).length} of ${data.plan.length} completed` : 'Your schedule will appear here'}</p></div><button className="mini-select" onClick={() => setShowCompleted((value) => !value)}>{showCompleted ? 'All sessions' : 'Upcoming'} <ChevronDown size={14} /></button></div>
        {nextSessions.length ? <div className="plan-sessions">{nextSessions.map((session) => <div className={cx('plan-session', session.completed && 'session-completed', session.skipped && 'session-skipped')} key={session.id}><button className="session-check" aria-label={session.completed ? 'Mark incomplete' : 'Mark complete'} onClick={() => toggleSession(session, 'completed')}>{session.completed && <Check size={15} />}</button><div className="session-date"><b>{new Date(`${session.date}T12:00:00`).toLocaleDateString(undefined, { day: '2-digit' })}</b><small>{new Date(`${session.date}T12:00:00`).toLocaleDateString(undefined, { month: 'short' }).toUpperCase()}</small></div><div className="plan-session-main"><span className={`type-dot type-${session.type.toLowerCase()}`} /> <span className="session-type">{session.type} · {session.minutes} min</span><b>{session.title}</b><small>{session.topic}</small></div>{!session.completed && !session.skipped && <button className="skip-session" onClick={() => toggleSession(session, 'skipped')}>Skip</button>}{session.skipped && <span className="skipped-label">Skipped</span>}</div>)}</div> : <div className="plan-empty"><span className="empty-icon"><CalendarDays size={20} /></span><h3>Your plan will show here</h3><p>Choose an exam date and a few days that work for you. We’ll create manageable sessions and prioritize topics to review.</p></div>}
      </section>
    </div>
  </div>
}

function ReadinessPage({ data, readiness }: SharedProps) {
  const navigate = useNavigate()
  const sufficient = readiness.estimate !== null
  const recentAttempts = data.attempts.slice(0, 5)
  const weak = readiness.topicScores.filter((item) => item.accuracy !== null).sort((a, b) => (a.accuracy ?? 0) - (b.accuracy ?? 0))[0]
  return <div className="content-page">
    <div className="page-title-row"><div><div className="eyebrow"><span className="eyebrow-dot" /> TRANSPARENT PROGRESS</div><h1>Practice readiness</h1><p className="subheading">A snapshot of the practice you’ve completed — never a promise about an exam result.</p></div><span className="estimate-label"><ShieldCheck size={15} /> Practice readiness estimate</span></div>
    <section className="readiness-hero card"><div className="readiness-copy"><span className="readiness-kicker">YOUR CURRENT SNAPSHOT</span><h2>{sufficient ? 'Your learning is taking shape.' : 'Build a little more practice history.'}</h2><p>{sufficient ? 'This estimate reflects your recent practice and topic coverage. Keep reviewing all domains to strengthen your preparation.' : 'Complete at least 10 questions across 2 topics to unlock an estimate. Until then, focus on exploring the learning content and trying short quizzes.'}</p><button className="button button-primary" onClick={() => navigate('/quizzes')}>Continue practicing <ArrowRight size={15} /></button><small><ShieldCheck size={13} /> Not a guarantee of passing. Results depend on many factors.</small></div><div className="readiness-meter" style={{ '--score': `${readiness.estimate ?? 0}%` } as CSSProperties}><div><b>{sufficient ? `${readiness.estimate}%` : '—'}</b><span>practice<br />readiness</span></div></div></section>
    <div className="readiness-metrics"><Metric label="Questions answered" value={String(readiness.questionsAnswered)} hint="Across all practice quizzes" icon={<CircleHelp size={17} />} /><Metric label="Unique questions" value={String(readiness.uniqueQuestions)} hint="Distinct prompts attempted" icon={<Target size={17} />} /><Metric label="Recent practice" value={readiness.questionsAnswered ? `${readiness.recentAccuracy}%` : '—'} hint="Average of up to 3 latest quizzes" icon={<Activity size={17} />} /><Metric label="Topic coverage" value={`${readiness.topicCoverage}%`} hint={`${readiness.topicScores.filter((item) => item.attempted > 0).length} of ${topics.length} domains practiced`} icon={<Layers3 size={17} />} /><Metric label="Performance consistency" value={data.attempts.length > 1 ? `${readiness.consistency}%` : '—'} hint="Based on variation between attempts" icon={<BarChart3 size={17} />} /></div>
    <div className="readiness-grid"><section className="card topic-breakdown"><div className="card-heading"><div><h2>Topic breakdown</h2><p>Coverage and accuracy from your answers</p></div></div>{readiness.topicScores.map((item, index) => <div className="readiness-topic" key={item.topic}><div className="readiness-topic-top"><span className={`topic-color topic-color-${index}`} /><div><b>{item.topic}</b><small>{item.attempted ? `${item.attempted} questions attempted` : 'No questions attempted yet'}</small></div><strong>{item.accuracy === null ? '—' : `${item.accuracy}%`}</strong></div><div className="progress-track"><span className={`progress-fill fill-${index}`} style={{ width: `${item.accuracy ?? 0}%` }} /></div><div className="mastery-label">{item.accuracy === null ? 'Not assessed' : item.accuracy >= 80 ? 'Building strength' : item.accuracy >= 60 ? 'Getting there' : 'Worth another review'}</div></div>)}</section>
      <section className="card calculation-card"><div className="card-heading"><div><h2>How we calculate this</h2><p>Simple, transparent, and based on your activity</p></div><CircleHelp size={17} className="muted-icon" /></div><div className="formula-line"><span>Overall practice accuracy</span><b>35%</b></div><div className="formula-line"><span>Recent quiz accuracy</span><b>25%</b></div><div className="formula-line"><span>Topic coverage</span><b>20%</b></div><div className="formula-line"><span>Unique question breadth</span><b>10%</b></div><div className="formula-line"><span>Performance consistency</span><b>10%</b></div><div className="calculation-note"><Lightbulb size={16} /><p>We only show the estimate after <b>10 questions</b> and practice in at least <b>2 topics</b>. This is a learning indicator, not a probability of passing.</p></div>{weak && <div className="next-step-note"><span className="next-step-icon"><ArrowDownRight size={15} /></span><div><small>GOOD NEXT STEP</small><b>Revisit {weak.topic}</b><p>This is currently your least-practiced topic.</p><Link to="/flashcards">Review flashcards <ArrowRight size={13} /></Link></div></div>}</section>
    </div>
    <section className="card recent-results"><div className="card-heading"><div><h2>Recent results</h2><p>Quiz history saved in this browser</p></div><Link to="/quizzes" className="text-link">Take a quiz <ArrowRight size={14} /></Link></div>{recentAttempts.length ? recentAttempts.map((attempt) => <div className="history-row" key={attempt.id}><div className="history-icon"><Target size={16} /></div><div><b>{attempt.mode === 'assessment' ? 'Assessment' : 'Practice quiz'}</b><small>{new Date(attempt.completedAt).toLocaleString()} · {attempt.total} questions</small></div><div className="history-score"><b>{attempt.score}/{attempt.total}</b><span>correct</span></div><strong>{Math.round(attempt.score / attempt.total * 100)}%</strong></div>) : <div className="history-empty">No results yet. Your learning history will appear here after your first quiz.</div>}</section>
  </div>
}

function Metric({ label, value, hint, icon }: { label: string; value: string; hint: string; icon: ReactNode }) {
  return <article className="card readiness-metric"><span>{icon}</span><small>{label}</small><b>{value}</b><p>{hint}</p></article>
}

function LibraryPage() {
  const [query, setQuery] = useState('')
  const [selectedTopic, setSelectedTopic] = useState('All topics')
  const filtered = modules.filter((item) => (selectedTopic === 'All topics' || item.topic === selectedTopic) && `${item.title} ${item.description} ${item.topic}`.toLowerCase().includes(query.toLowerCase()))
  return <div className="content-page">
    <div className="page-title-row"><div><div className="eyebrow"><span className="eyebrow-dot" /> LEARN FROM TRUSTED SOURCES</div><h1>Learning library</h1><p className="subheading">A curated starting point for the public AZ-900 skills outline.</p></div><span className="unofficial-badge"><BookOpen size={15} /> Independent resource guide</span></div>
    <section className="library-banner"><div className="library-banner-icon"><BookOpen size={24} /></div><div><span>YOUR AZ-900 STUDY COLLECTION</span><h2>Small lessons. Strong foundations.</h2><p>Explore core cloud ideas and follow the official Microsoft Learn modules for the most current details.</p></div><a href="https://learn.microsoft.com/credentials/certifications/azure-fundamentals/" target="_blank" rel="noreferrer" className="button button-light">Official study guide <ArrowUpRight size={14} /></a></section>
    <div className="library-controls"><div className="library-search"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search learning modules..." aria-label="Search learning modules" /><kbd>/</kbd></div><select value={selectedTopic} onChange={(event) => setSelectedTopic(event.target.value)} aria-label="Filter by topic"><option>All topics</option>{topics.map((topic) => <option key={topic}>{topic}</option>)}</select></div>
    <div className="module-grid">{filtered.map((module, index) => <article className="card module-card" key={module.id}><div className={`module-illustration module-art-${index % 3}`}><span>{index === 0 ? <Cloud size={27} /> : index === 1 ? <Layers3 size={27} /> : <ShieldCheck size={27} />}</span><small>{module.topic.toUpperCase()}</small></div><div className="module-content"><div className="module-meta"><span><Clock3 size={13} /> {module.duration} min</span><span className="content-reviewed">MICROSOFT LEARN</span></div><h3>{module.title}</h3><p>{module.description}</p><a href={module.sourceUrl} target="_blank" rel="noreferrer" className="text-link">Open official learning module <ArrowUpRight size={14} /></a></div></article>)}</div>
    {!filtered.length && <div className="empty-state">No modules match your search. Try a different term or topic.</div>}
    <div className="library-disclaimer"><ShieldCheck size={15} /><p><b>Independent certification preparation.</b> CloudAce AI is not affiliated with, endorsed by, or sponsored by Microsoft. Microsoft Azure and AZ-900 are referenced only to identify the certification and related learning subject matter. Content is a study aid; verify current exam requirements in the official study guide.</p></div>
  </div>
}

function SettingsPage({ data, update, notify }: SharedProps) {
  const [saved, setSaved] = useState(false)
  function setMinutes(minutes: number) {
    if (update({ ...data, preferences: { ...data.preferences, dailyMinutes: minutes } })) {
      setSaved(true)
      window.setTimeout(() => setSaved(false), 2500)
    }
  }
  function reset() {
    if (!window.confirm('Clear your quiz results, flashcard reviews, study plan, and preferences from this browser? This cannot be undone.')) return
    try {
      clearState()
      window.location.reload()
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Could not clear local demo data.')
    }
  }
  return <div className="content-page">
    <div className="page-title-row"><div><div className="eyebrow"><span className="eyebrow-dot" /> YOUR SPACE, YOUR PACE</div><h1>Settings</h1><p className="subheading">Manage your local demo preferences and learning data.</p></div><span className="demo-chip"><span /> Local demo</span></div>
    <div className="settings-layout"><section className="card settings-card"><div className="settings-section-head"><span className="settings-icon"><GraduationCap size={18} /></span><div><h2>Learning preferences</h2><p>Personalize your study experience</p></div></div><div className="setting-row"><div><b>Certification track</b><p>Current learning content</p></div><div className="setting-value"><Cloud size={16} /> AZ-900 <ChevronDown size={14} /></div></div><div className="setting-row"><div><b>Daily study time</b><p>Used when creating a study plan</p></div><select className="setting-select" value={data.preferences.dailyMinutes} onChange={(event) => setMinutes(Number(event.target.value))}><option value={15}>15 minutes</option><option value={30}>30 minutes</option><option value={45}>45 minutes</option><option value={60}>60 minutes</option></select></div><div className="setting-row"><div><b>Target exam date</b><p>{data.preferences.examDate ? 'Saved to your local plan' : 'Not set yet'}</p></div><Link to="/planner" className="text-link">{data.preferences.examDate ? new Date(`${data.preferences.examDate}T12:00:00`).toLocaleDateString() : 'Set a date'} <ArrowRight size={13} /></Link></div>{saved && <div className="inline-success"><CheckCircle2 size={15} /> Preference saved in this browser.</div>}</section>
      <section className="card settings-card"><div className="settings-section-head"><span className="settings-icon settings-violet"><ShieldCheck size={18} /></span><div><h2>Privacy & demo data</h2><p>Understand where your learning history lives</p></div></div><div className="privacy-callout"><span className="privacy-dot" /><div><b>Local demo mode is active</b><p>Your quiz attempts, flashcard reviews, and plan are stored in this browser’s local storage. They are not synced to a cloud account or sent to an AI service.</p></div></div><div className="setting-row"><div><b>AI tutoring</b><p>Live AI provider connection</p></div><span className="not-connected"><span /> Not configured</span></div><div className="setting-row"><div><b>Account & cloud sync</b><p>Supabase authentication and sync</p></div><span className="not-connected"><span /> Not configured</span></div><div className="settings-docs"><b>For developers</b><p>See the README for the database migration, secure AI function, and environment setup notes. No credentials are included.</p><a href="https://github.com/bazumanu1/cloudace-ai" target="_blank" rel="noreferrer">Project repository <ArrowUpRight size={12} /></a></div></section>
      <section className="card settings-card danger-card"><div className="settings-section-head"><span className="settings-icon settings-red"><RotateCcw size={17} /></span><div><h2>Reset local data</h2><p>Remove demo progress from this browser</p></div></div><p className="danger-description">This clears saved quiz results, flashcard review history, and your study plan from local storage. It does not affect anything in a cloud account.</p><button className="button button-danger" onClick={reset}>Clear local demo data <X size={15} /></button></section></div>
    <div className="settings-footnote"><ShieldCheck size={14} /> CloudAce AI is an independent study tool. Microsoft, Azure, and AZ-900 are referenced only to identify related subject matter.</div>
  </div>
}

export default App
