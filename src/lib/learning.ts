import type { Question } from './content'

export type QuizAnswer = {
  questionId: string
  selected: number[]
  correct: boolean
}

export type QuizAttempt = {
  id: string
  completedAt: string
  questionIds: string[]
  flaggedQuestionIds: string[]
  answers: QuizAnswer[]
  score: number
  total: number
  durationSeconds: number
  mode: 'practice' | 'assessment'
  timed: boolean
}

export type ReviewRecord = {
  count: number
  knownCount: number
  intervalDays: number
  nextDueAt: string
  lastReviewedAt: string
  difficulty: 'forgot' | 'difficult' | 'known'
}

export type StudySession = {
  id: string
  date: string
  topic: string
  title: string
  minutes: number
  type: 'Learn' | 'Practice' | 'Review'
  completed: boolean
  skipped: boolean
}

export function isAnswerCorrect(selected: number[], answer: number[]) {
  return selected.length === answer.length && [...selected].sort().every((value, index) => value === [...answer].sort()[index])
}

export function scoreQuiz(questions: Question[], answers: Record<string, number[]>) {
  return questions.reduce((total, question) => total + Number(isAnswerCorrect(answers[question.id] ?? [], question.answer)), 0)
}

export function updateReviewRecord(previous: ReviewRecord | undefined, rating: ReviewRecord['difficulty'], now = new Date()): ReviewRecord {
  const count = (previous?.count ?? 0) + 1
  const knownCount = (previous?.knownCount ?? 0) + Number(rating === 'known')
  const intervalDays = rating === 'forgot'
    ? 0
    : rating === 'difficult'
      ? 1
      : Math.min(30, previous ? Math.max(2, Math.round(previous.intervalDays * 2.2)) : 2)
  const due = new Date(now)
  if (intervalDays === 0) due.setMinutes(due.getMinutes() + 10)
  else due.setDate(due.getDate() + intervalDays)

  return {
    count,
    knownCount,
    intervalDays,
    nextDueAt: due.toISOString(),
    lastReviewedAt: now.toISOString(),
    difficulty: rating,
  }
}

export function calculateReadiness(attempts: QuizAttempt[], topicNames: string[]) {
  const answeredQuestions = attempts.flatMap((attempt) => attempt.answers).filter((answer) => answer.selected.length > 0)
  const questionsAnswered = answeredQuestions.length
  const uniqueQuestions = new Set(answeredQuestions.map((answer) => answer.questionId)).size
  const topicScores = topicNames.map((topic) => {
    const topicQuestions = attempts.flatMap((attempt) =>
      attempt.answers
        .filter((answer) => answer.selected.length > 0
          && answer.questionId.startsWith(topic === 'Cloud concepts' ? 'cloud-' : topic === 'Azure architecture and services' ? 'arch-' : 'gov-'))
        .map((answer) => answer.correct),
    )
    return {
      topic,
      attempted: topicQuestions.length,
      accuracy: topicQuestions.length ? Math.round((topicQuestions.filter(Boolean).length / topicQuestions.length) * 100) : null,
    }
  })
  const recent = attempts.slice(0, 3)
  const recentAccuracy = recent.length
    ? recent.reduce((sum, attempt) => {
      const answered = attempt.answers.filter((answer) => answer.selected.length > 0)
      return sum + (answered.length ? answered.filter((answer) => answer.correct).length / answered.length : 0)
    }, 0) / recent.length * 100
    : 0
  const topicCoverage = topicScores.filter((topic) => topic.attempted > 0).length / Math.max(1, topicNames.length) * 100
  const accuracy = questionsAnswered
    ? answeredQuestions.filter((answer) => answer.correct).length / questionsAnswered * 100
    : 0
  const attemptScores = attempts.map((attempt) => attempt.total ? attempt.score / attempt.total * 100 : 0)
  const scoreMean = attemptScores.length
    ? attemptScores.reduce((sum, score) => sum + score, 0) / attemptScores.length
    : 0
  const variance = attemptScores.length > 1
    ? attemptScores.reduce((sum, score) => sum + (score - scoreMean) ** 2, 0) / attemptScores.length
    : 0
  const consistency = attemptScores.length > 1 ? Math.max(0, Math.round(100 - Math.sqrt(variance))) : 0
  const questionBreadth = Math.min(100, Math.round(uniqueQuestions / 20 * 100))
  const readiness = Math.round(
    accuracy * 0.35
    + recentAccuracy * 0.25
    + topicCoverage * 0.2
    + questionBreadth * 0.1
    + consistency * 0.1,
  )

  return {
    questionsAnswered,
    uniqueQuestions,
    topicScores,
    accuracy: Math.round(accuracy),
    recentAccuracy: Math.round(recentAccuracy),
    topicCoverage: Math.round(topicCoverage),
    questionBreadth,
    consistency,
    estimate: questionsAnswered >= 10 && topicCoverage >= 66 ? readiness : null,
  }
}

export function generateStudyPlan(
  examDate: string,
  minutesPerSession: number,
  studyDays: number[],
  weakTopics: string[],
  now = new Date(),
): StudySession[] {
  const target = new Date(`${examDate}T12:00:00`)
  const start = new Date(now)
  start.setHours(12, 0, 0, 0)
  if (Number.isNaN(target.valueOf()) || target <= start) {
    throw new Error('Choose an exam date at least one day in the future.')
  }
  if (!Number.isInteger(minutesPerSession) || minutesPerSession < 10 || minutesPerSession > 240) {
    throw new Error('Study sessions must be between 10 and 240 minutes.')
  }
  if (!studyDays.length || studyDays.some((day) => !Number.isInteger(day) || day < 0 || day > 6)) {
    throw new Error('Select at least one valid study day.')
  }

  const topics = weakTopics.length ? weakTopics : ['Cloud concepts', 'Azure architecture and services', 'Azure management and governance']
  const plan: StudySession[] = []
  const schedule = [
    { type: 'Learn' as const, title: 'Learn a core concept' },
    { type: 'Practice' as const, title: 'Practice and explain your answers' },
    { type: 'Review' as const, title: 'Review flashcards and revisit weak spots' },
  ]
  const day = new Date(start)
  let topicIndex = 0
  let sessionIndex = 0
  while (day < target && plan.length < 42) {
    if (studyDays.includes(day.getDay())) {
      const activity = schedule[sessionIndex % schedule.length]
      plan.push({
        id: `session-${day.toISOString().slice(0, 10)}-${sessionIndex}`,
        date: day.toISOString().slice(0, 10),
        topic: topics[topicIndex % topics.length],
        title: activity.title,
        minutes: minutesPerSession,
        type: activity.type,
        completed: false,
        skipped: false,
      })
      topicIndex += 1
      sessionIndex += 1
    }
    day.setDate(day.getDate() + 1)
  }
  if (plan.length === 0) throw new Error('No available study days fall before your exam date.')
  return plan
}
