import { describe, expect, it } from 'vitest'
import { questions, topics } from './content'
import {
  calculateReadiness, generateStudyPlan, isAnswerCorrect, scoreQuiz,
  updateReviewRecord, type QuizAttempt,
} from './learning'

describe('quiz scoring', () => {
  it('requires every correct option and rejects extra selections', () => {
    expect(isAnswerCorrect([0, 1], [1, 0])).toBe(true)
    expect(isAnswerCorrect([0], [0, 1])).toBe(false)
    expect(isAnswerCorrect([0, 1, 2], [0, 1])).toBe(false)
    expect(isAnswerCorrect([], [])).toBe(true)
  })

  it('scores trusted single-answer and multiple-answer keys', () => {
    const mixed = [questions[0], questions[1]]
    expect(scoreQuiz(mixed, { 'cloud-01': [0], 'cloud-02': [0, 1] })).toBe(2)
    expect(scoreQuiz(mixed, { 'cloud-01': [1], 'cloud-02': [0] })).toBe(0)
  })
})

describe('flashcard scheduling', () => {
  const now = new Date('2026-10-19T09:00:00.000Z')

  it('schedules forgotten, difficult, and known cards with bounded intervals', () => {
    const forgotten = updateReviewRecord(undefined, 'forgot', now)
    expect(forgotten.intervalDays).toBe(0)
    expect(forgotten.nextDueAt).toBe('2026-10-19T09:10:00.000Z')

    const difficult = updateReviewRecord(undefined, 'difficult', now)
    expect(difficult.intervalDays).toBe(1)
    expect(difficult.nextDueAt).toBe('2026-10-20T09:00:00.000Z')

    let known = updateReviewRecord(undefined, 'known', now)
    for (let index = 0; index < 10; index += 1) known = updateReviewRecord(known, 'known', now)
    expect(known.intervalDays).toBe(30)
    expect(known.knownCount).toBe(11)
  })
})

describe('practice readiness', () => {
  const makeAttempt = (id: string, questionIds: string[], score: number, date: string): QuizAttempt => ({
    id,
    completedAt: date,
    questionIds,
    flaggedQuestionIds: [],
    answers: questionIds.map((questionId, index) => ({
      questionId,
      selected: [0],
      correct: index < score,
    })),
    score,
    total: questionIds.length,
    durationSeconds: 60,
    mode: 'practice',
    timed: false,
  })

  it('withholds an estimate until both volume and topic coverage are sufficient', () => {
    const insufficient = calculateReadiness([makeAttempt('one', ['cloud-01', 'cloud-02'], 2, '2026-10-19')], topics)
    expect(insufficient.estimate).toBeNull()
    expect(insufficient.topicCoverage).toBe(33)
  })

  it('includes accuracy, recent performance, coverage, unique questions, and consistency', () => {
    const attempts = [
      makeAttempt('newer', ['cloud-01', 'cloud-02', 'cloud-03', 'cloud-04', 'arch-01', 'arch-02'], 6, '2026-10-19'),
      makeAttempt('older', ['cloud-05', 'cloud-06', 'arch-03', 'arch-04', 'gov-01', 'gov-02'], 3, '2026-10-18'),
    ]
    const readiness = calculateReadiness(attempts, topics)
    expect(readiness.questionsAnswered).toBe(12)
    expect(readiness.uniqueQuestions).toBe(12)
    expect(readiness.topicCoverage).toBe(100)
    expect(readiness.consistency).toBe(75)
    expect(readiness.estimate).toBeGreaterThan(0)
  })
})

describe('study planning', () => {
  const now = new Date('2026-10-19T09:00:00.000Z')

  it('creates sessions only on selected days before the exam date', () => {
    const sessions = generateStudyPlan('2026-10-27', 30, [2, 4], ['Azure architecture and services'], now)
    expect(sessions.length).toBeGreaterThan(0)
    expect(sessions.every((session) => [2, 4].includes(new Date(`${session.date}T12:00:00`).getDay()))).toBe(true)
    expect(sessions.every((session) => session.date < '2026-10-27')).toBe(true)
    expect(sessions[0].topic).toBe('Azure architecture and services')
  })

  it('rejects past dates, invalid durations, and empty availability', () => {
    expect(() => generateStudyPlan('2026-10-19', 30, [1], [], now)).toThrow(/future/)
    expect(() => generateStudyPlan('2026-10-25', 5, [1], [], now)).toThrow(/between 10 and 240/)
    expect(() => generateStudyPlan('2026-10-25', 30, [], [], now)).toThrow(/at least one/)
  })
})
