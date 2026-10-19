import type { QuizAttempt, ReviewRecord, StudySession } from './learning'
import { z } from 'zod'

const STORAGE_KEY = 'cloudace-ai-demo-v1'

export type DemoState = {
  attempts: QuizAttempt[]
  reviews: Record<string, ReviewRecord>
  plan: StudySession[]
  preferences: {
    examDate: string
    dailyMinutes: number
    studyDays: number[]
  }
}

const initialState: DemoState = {
  attempts: [],
  reviews: {},
  plan: [],
  preferences: { examDate: '', dailyMinutes: 30, studyDays: [1, 2, 3, 4, 5] },
}

const demoStateSchema = z.object({
  attempts: z.array(z.object({
    id: z.string(),
    completedAt: z.string().datetime(),
    questionIds: z.array(z.string()),
    flaggedQuestionIds: z.array(z.string()),
    answers: z.array(z.object({
      questionId: z.string(),
      selected: z.array(z.number().int().nonnegative()),
      correct: z.boolean(),
    })),
    score: z.number().int().nonnegative(),
    total: z.number().int().positive(),
    durationSeconds: z.number().int().nonnegative(),
    mode: z.enum(['practice', 'assessment']),
    timed: z.boolean(),
  })),
  reviews: z.record(z.string(), z.object({
    count: z.number().int().nonnegative(),
    knownCount: z.number().int().nonnegative(),
    intervalDays: z.number().int().min(0).max(30),
    nextDueAt: z.string().datetime(),
    lastReviewedAt: z.string().datetime(),
    difficulty: z.enum(['forgot', 'difficult', 'known']),
  })),
  plan: z.array(z.object({
    id: z.string(),
    date: z.string().date(),
    topic: z.string(),
    title: z.string(),
    minutes: z.number().int().positive(),
    type: z.enum(['Learn', 'Practice', 'Review']),
    completed: z.boolean(),
    skipped: z.boolean(),
  })),
  preferences: z.object({
    examDate: z.string(),
    dailyMinutes: z.number().int().min(10).max(240),
    studyDays: z.array(z.number().int().min(0).max(6)),
  }),
})

export function loadState(): DemoState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return initialState
    const parsed: unknown = JSON.parse(stored)
    const validated = demoStateSchema.safeParse(parsed)
    if (!validated.success) {
      console.error('Stored CloudAce demo data is invalid.', validated.error)
      return initialState
    }
    return validated.data
  } catch (error) {
    console.error('Could not read CloudAce demo data.', error)
    return initialState
  }
}

export function saveState(state: DemoState) {
  try {
    const validated = demoStateSchema.safeParse(state)
    if (!validated.success) throw new Error('The learning update was invalid and was not saved.')
    localStorage.setItem(STORAGE_KEY, JSON.stringify(validated.data))
  } catch (error) {
    console.error('Could not save CloudAce demo data.', error)
    if (error instanceof Error) throw error
    throw new Error('Your browser could not save this update. Check available storage and try again.')
  }
}

export function clearState() {
  localStorage.removeItem(STORAGE_KEY)
}
