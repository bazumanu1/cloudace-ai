import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

type SubmittedAnswer = { questionId: string; selectedPositions: number[] }

function allowedOrigins() {
  return (Deno.env.get('ALLOWED_ORIGINS') ?? 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
}

function jsonResponse(body: unknown, status: number, origin: string | null) {
  const headers = new Headers({ 'Content-Type': 'application/json' })
  if (origin) {
    headers.set('Access-Control-Allow-Origin', origin)
    headers.set('Vary', 'Origin')
    headers.set('Access-Control-Allow-Headers', 'authorization, apikey, content-type, x-client-info')
    headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS')
  }
  return new Response(JSON.stringify(body), { status, headers })
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

function isValidAnswer(value: unknown): value is SubmittedAnswer {
  if (!isRecord(value) || typeof value.questionId !== 'string' || !/^[a-z0-9-]{1,80}$/i.test(value.questionId)) return false
  if (!Array.isArray(value.selectedPositions) || value.selectedPositions.length > 25) return false
  return value.selectedPositions.every((position) => Number.isInteger(position) && position >= 0 && position <= 24)
    && new Set(value.selectedPositions).size === value.selectedPositions.length
}

Deno.serve(async (request) => {
  const origin = request.headers.get('origin')
  if (!origin || !allowedOrigins().includes(origin)) return jsonResponse({ error: 'Origin is not allowed.' }, 403, null)
  if (request.method === 'OPTIONS') return jsonResponse({}, 200, origin)
  if (request.method !== 'POST') return jsonResponse({ error: 'Use POST to submit a quiz.' }, 405, origin)

  const token = request.headers.get('authorization')?.match(/^Bearer\s+(.+)$/i)?.[1]
  if (!token) return jsonResponse({ error: 'Sign in is required to save quiz results.' }, 401, origin)
  const contentLength = Number(request.headers.get('content-length') ?? 0)
  if (contentLength > 32_768) return jsonResponse({ error: 'Quiz submission exceeds the allowed size.' }, 413, origin)
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !anonKey || !serviceRoleKey) return jsonResponse({ error: 'Quiz persistence is not configured.' }, 503, origin)

  const authClient = createClient(supabaseUrl, anonKey, { auth: { autoRefreshToken: false, persistSession: false } })
  const { data: authData, error: authError } = await authClient.auth.getUser(token)
  if (authError || !authData.user) return jsonResponse({ error: 'Your session is invalid or expired. Sign in again.' }, 401, origin)

  let rawBody: string
  try {
    rawBody = await request.text()
  } catch {
    return jsonResponse({ error: 'Request body must be valid JSON.' }, 400, origin)
  }
  if (rawBody.length > 32_768) return jsonResponse({ error: 'Quiz submission exceeds the allowed size.' }, 413, origin)
  let body: unknown
  try {
    body = JSON.parse(rawBody)
  } catch {
    return jsonResponse({ error: 'Request body must be valid JSON.' }, 400, origin)
  }
  if (!isRecord(body) || !Array.isArray(body.answers) || body.answers.length < 1 || body.answers.length > 100) {
    return jsonResponse({ error: 'Submit between 1 and 100 valid question answers.' }, 400, origin)
  }
  const answers = body.answers.filter((answer): answer is SubmittedAnswer => isValidAnswer(answer))
  if (answers.length !== body.answers.length) return jsonResponse({ error: 'One or more submitted answers are invalid.' }, 400, origin)
  if (new Set(answers.map((answer) => answer.questionId)).size !== answers.length) {
    return jsonResponse({ error: 'Each question can only be submitted once.' }, 400, origin)
  }
  if (body.mode !== 'practice' && body.mode !== 'assessment') return jsonResponse({ error: 'Quiz mode is invalid.' }, 400, origin)
  if (typeof body.certificationId !== 'string' || body.certificationId.length > 80) return jsonResponse({ error: 'Certification is required.' }, 400, origin)
  const durationSeconds = body.durationSeconds
  if (typeof durationSeconds !== 'number' || !Number.isInteger(durationSeconds) || durationSeconds < 0 || durationSeconds > 86_400) {
    return jsonResponse({ error: 'Quiz duration is invalid.' }, 400, origin)
  }

  const service = createClient(supabaseUrl, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } })
  const questionIds = answers.map((answer) => answer.questionId)
  const { data: questions, error: questionError } = await service
    .from('questions')
    .select('id, certification_id, topic_id, explanation, source_url, question_options(position)')
    .in('id', questionIds)
    .eq('is_published', true)
  if (questionError) return jsonResponse({ error: 'Could not load the published quiz questions.' }, 500, origin)
  if (!questions || questions.length !== questionIds.length || questions.some((question) => question.certification_id !== body.certificationId)) {
    return jsonResponse({ error: 'One or more quiz questions are unavailable for this certification.' }, 400, origin)
  }

  const { data: keys, error: keyError } = await service
    .from('question_answer_keys')
    .select('question_id, correct_positions')
    .in('question_id', questionIds)
  if (keyError) return jsonResponse({ error: 'Could not load trusted grading data.' }, 500, origin)
  const answerKeyById = new Map((keys ?? []).map((key) => [key.question_id, key.correct_positions as number[]]))
  if (answerKeyById.size !== questionIds.length) return jsonResponse({ error: 'A published question is missing its approved answer key.' }, 500, origin)

  const graded = answers.map((submitted) => {
    const question = questions.find((item) => item.id === submitted.questionId)!
    const validPositions = new Set((question.question_options ?? []).map((option) => option.position))
    if (submitted.selectedPositions.some((position) => !validPositions.has(position))) return null
    const expected = [...(answerKeyById.get(submitted.questionId) ?? [])].sort((a, b) => a - b)
    const actual = [...submitted.selectedPositions].sort((a, b) => a - b)
    return {
      questionId: question.id,
      topicId: question.topic_id,
      selectedPositions: actual,
      correctPositions: expected,
      correct: expected.length === actual.length && expected.every((position, index) => position === actual[index]),
      explanation: question.explanation,
      sourceUrl: question.source_url,
    }
  })
  if (graded.some((answer) => answer === null)) return jsonResponse({ error: 'A submitted answer contains an unknown option.' }, 400, origin)
  const results = graded.filter((answer) => answer !== null)
  const score = results.filter((answer) => answer.correct).length
  const topicIds = [...new Set(results.map((answer) => answer.topicId))]
  const topicId = topicIds.length === 1 ? topicIds[0] : null

  const { data: quiz, error: quizError } = await service.from('quizzes').insert({
    user_id: authData.user.id,
    certification_id: body.certificationId,
    topic_id: topicId,
    mode: body.mode,
    is_timed: body.timed === true,
  }).select('id').single()
  if (quizError) return jsonResponse({ error: 'Could not save the quiz session.' }, 500, origin)

  const { data: attempt, error: attemptError } = await service.from('quiz_attempts').insert({
    user_id: authData.user.id,
    quiz_id: quiz.id,
    score,
    total_questions: results.length,
    duration_seconds: durationSeconds,
  }).select('id').single()
  if (attemptError) {
    await service.from('quizzes').delete().eq('id', quiz.id)
    return jsonResponse({ error: 'Could not save the quiz result.' }, 500, origin)
  }

  const rawFlaggedIds = body.flaggedQuestionIds ?? []
  if (!Array.isArray(rawFlaggedIds) || rawFlaggedIds.length > questionIds.length
    || rawFlaggedIds.some((id) => typeof id !== 'string' || !questionIds.includes(id))) {
    await service.from('quiz_attempts').delete().eq('id', attempt.id)
    await service.from('quizzes').delete().eq('id', quiz.id)
    return jsonResponse({ error: 'Flagged question IDs must belong to this quiz.' }, 400, origin)
  }
  const flaggedIds = new Set(rawFlaggedIds.filter((id): id is string => typeof id === 'string'))
  const answerRows = results.map((answer) => ({
    attempt_id: attempt.id,
    user_id: authData.user.id,
    question_id: answer.questionId,
    selected_positions: answer.selectedPositions,
    is_correct: answer.correct,
    flagged_for_review: flaggedIds.has(answer.questionId),
  }))
  const { error: answerError } = await service.from('quiz_answers').insert(answerRows)
  if (answerError) {
    await service.from('quiz_attempts').delete().eq('id', attempt.id)
    await service.from('quizzes').delete().eq('id', quiz.id)
    return jsonResponse({ error: 'Could not save all of the quiz answers.' }, 500, origin)
  }

  return jsonResponse({
    attemptId: attempt.id,
    score,
    total: results.length,
    answers: results,
  }, 200, origin)
})
