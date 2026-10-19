create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.certifications (
  id text primary key,
  name text not null,
  provider text not null,
  description text not null default '',
  skills_outline_url text not null,
  content_version text not null,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.certification_topics (
  id text primary key,
  certification_id text not null references public.certifications (id) on delete cascade,
  name text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (certification_id, name)
);

create table if not exists public.learning_modules (
  id text primary key,
  certification_id text not null references public.certifications (id) on delete cascade,
  topic_id text not null references public.certification_topics (id) on delete cascade,
  title text not null,
  description text not null,
  duration_minutes integer not null check (duration_minutes > 0),
  source_url text not null,
  content_version text not null,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.learning_content_versions (
  id uuid primary key default gen_random_uuid(),
  module_id text not null references public.learning_modules (id) on delete cascade,
  version text not null,
  source_url text not null,
  last_reviewed_at date not null,
  review_status text not null check (review_status in ('draft', 'approved', 'needs_review')),
  created_at timestamptz not null default now(),
  unique (module_id, version)
);

create table if not exists public.questions (
  id text primary key,
  certification_id text not null references public.certifications (id) on delete cascade,
  topic_id text not null references public.certification_topics (id) on delete cascade,
  difficulty text not null check (difficulty in ('Beginner', 'Intermediate', 'Advanced')),
  question_format text not null check (question_format in ('single', 'multiple', 'true_false', 'scenario')),
  question_text text not null,
  explanation text not null,
  source_url text not null,
  content_version text not null,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.question_options (
  id uuid primary key default gen_random_uuid(),
  question_id text not null references public.questions (id) on delete cascade,
  option_text text not null,
  position integer not null check (position >= 0),
  unique (question_id, position)
);

create table if not exists public.question_answer_keys (
  question_id text primary key references public.questions (id) on delete cascade,
  correct_positions smallint[] not null check (cardinality(correct_positions) > 0),
  updated_at timestamptz not null default now()
);

create table if not exists public.quizzes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  certification_id text not null references public.certifications (id),
  topic_id text references public.certification_topics (id),
  mode text not null check (mode in ('practice', 'assessment')),
  is_timed boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  quiz_id uuid references public.quizzes (id) on delete set null,
  score integer not null check (score >= 0),
  total_questions integer not null check (total_questions > 0),
  duration_seconds integer not null default 0 check (duration_seconds >= 0),
  completed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.quiz_answers (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.quiz_attempts (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  question_id text not null references public.questions (id),
  selected_positions smallint[] not null default '{}',
  is_correct boolean not null,
  flagged_for_review boolean not null default false,
  answered_at timestamptz not null default now(),
  unique (attempt_id, question_id)
);

create table if not exists public.flashcards (
  id text primary key,
  certification_id text not null references public.certifications (id) on delete cascade,
  topic_id text not null references public.certification_topics (id) on delete cascade,
  owner_id uuid references auth.users (id) on delete cascade,
  front text not null,
  back text not null,
  source_url text,
  content_version text not null,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.flashcard_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  flashcard_id text not null references public.flashcards (id) on delete cascade,
  review_count integer not null default 0 check (review_count >= 0),
  correct_recall_count integer not null default 0 check (correct_recall_count >= 0),
  difficulty_rating text not null check (difficulty_rating in ('forgot', 'difficult', 'known')),
  interval_days integer not null default 0 check (interval_days between 0 and 30),
  last_reviewed_at timestamptz not null default now(),
  next_due_at timestamptz not null default now(),
  unique (user_id, flashcard_id)
);

create table if not exists public.study_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  certification_id text not null references public.certifications (id),
  target_exam_date date,
  daily_minutes integer not null default 30 check (daily_minutes between 10 and 240),
  study_days smallint[] not null default '{1,2,3,4,5}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.study_sessions (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.study_plans (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  topic_id text references public.certification_topics (id),
  title text not null,
  session_type text not null check (session_type in ('learn', 'practice', 'review', 'checkpoint')),
  scheduled_date date not null,
  duration_minutes integer not null check (duration_minutes > 0),
  completed_at timestamptz,
  skipped_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.topic_mastery (
  user_id uuid not null references auth.users (id) on delete cascade,
  topic_id text not null references public.certification_topics (id) on delete cascade,
  questions_attempted integer not null default 0 check (questions_attempted >= 0),
  correct_answers integer not null default 0 check (correct_answers >= 0),
  updated_at timestamptz not null default now(),
  primary key (user_id, topic_id),
  check (correct_answers <= questions_attempted)
);

create table if not exists public.user_preferences (
  user_id uuid primary key references auth.users (id) on delete cascade,
  certification_id text references public.certifications (id),
  target_exam_date date,
  daily_minutes integer not null default 30 check (daily_minutes between 10 and 240),
  study_days smallint[] not null default '{1,2,3,4,5}',
  locale text not null default 'en',
  updated_at timestamptz not null default now()
);

create table if not exists public.ai_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null default 'Study session',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ai_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.ai_conversations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  source_urls text[] not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists learning_modules_cert_topic_idx on public.learning_modules (certification_id, topic_id) where is_published;
create index if not exists questions_cert_topic_idx on public.questions (certification_id, topic_id) where is_published;
create index if not exists question_options_question_position_idx on public.question_options (question_id, position);
create index if not exists quiz_attempts_user_completed_idx on public.quiz_attempts (user_id, completed_at desc);
create index if not exists quiz_answers_user_question_idx on public.quiz_answers (user_id, question_id);
create index if not exists flashcard_reviews_user_due_idx on public.flashcard_reviews (user_id, next_due_at);
create index if not exists study_sessions_user_date_idx on public.study_sessions (user_id, scheduled_date);
create index if not exists ai_messages_user_created_idx on public.ai_messages (user_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger certifications_set_updated_at before update on public.certifications
  for each row execute function public.set_updated_at();
create trigger learning_modules_set_updated_at before update on public.learning_modules
  for each row execute function public.set_updated_at();
create trigger questions_set_updated_at before update on public.questions
  for each row execute function public.set_updated_at();
create trigger flashcards_set_updated_at before update on public.flashcards
  for each row execute function public.set_updated_at();
create trigger study_plans_set_updated_at before update on public.study_plans
  for each row execute function public.set_updated_at();
create trigger topic_mastery_set_updated_at before update on public.topic_mastery
  for each row execute function public.set_updated_at();
create trigger user_preferences_set_updated_at before update on public.user_preferences
  for each row execute function public.set_updated_at();
create trigger ai_conversations_set_updated_at before update on public.ai_conversations
  for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.certifications enable row level security;
alter table public.certification_topics enable row level security;
alter table public.learning_modules enable row level security;
alter table public.learning_content_versions enable row level security;
alter table public.questions enable row level security;
alter table public.question_options enable row level security;
alter table public.question_answer_keys enable row level security;
alter table public.quizzes enable row level security;
alter table public.quiz_attempts enable row level security;
alter table public.quiz_answers enable row level security;
alter table public.flashcards enable row level security;
alter table public.flashcard_reviews enable row level security;
alter table public.study_plans enable row level security;
alter table public.study_sessions enable row level security;
alter table public.topic_mastery enable row level security;
alter table public.user_preferences enable row level security;
alter table public.ai_conversations enable row level security;
alter table public.ai_messages enable row level security;

create policy "Users manage their own profile" on public.profiles for all to authenticated
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

create policy "Published certifications are readable" on public.certifications for select to anon, authenticated
  using (is_published);
create policy "Admins manage certifications" on public.certifications for all to authenticated
  using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create policy "Published topics are readable" on public.certification_topics for select to anon, authenticated
  using (exists (select 1 from public.certifications c where c.id = certification_id and c.is_published));
create policy "Admins manage topics" on public.certification_topics for all to authenticated
  using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create policy "Published modules are readable" on public.learning_modules for select to anon, authenticated
  using (is_published);
create policy "Admins manage modules" on public.learning_modules for all to authenticated
  using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
create policy "Approved content versions are readable" on public.learning_content_versions for select to anon, authenticated
  using (review_status = 'approved');
create policy "Admins manage content versions" on public.learning_content_versions for all to authenticated
  using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create policy "Published questions are readable" on public.questions for select to anon, authenticated
  using (is_published);
create policy "Admins manage questions" on public.questions for all to authenticated
  using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
create policy "Options for published questions are readable" on public.question_options for select to anon, authenticated
  using (exists (select 1 from public.questions q where q.id = question_id and q.is_published));
create policy "Admins manage question options" on public.question_options for all to authenticated
  using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
create policy "Admins manage question answer keys" on public.question_answer_keys for all to authenticated
  using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create policy "Users read their quizzes" on public.quizzes for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "Users read their attempts" on public.quiz_attempts for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "Users read their quiz answers" on public.quiz_answers for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users read published or owned flashcards" on public.flashcards for select to authenticated
  using (is_published or owner_id = (select auth.uid()));
create policy "Anyone can read published flashcards" on public.flashcards for select to anon
  using (is_published);
create policy "Users manage their personal flashcards" on public.flashcards for all to authenticated
  using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy "Admins manage shared flashcards" on public.flashcards for all to authenticated
  using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
create policy "Users manage their card reviews" on public.flashcard_reviews for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create policy "Users manage their plans" on public.study_plans for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users manage their sessions" on public.study_sessions for all to authenticated
  using ((select auth.uid()) = user_id and exists (
    select 1 from public.study_plans p where p.id = plan_id and p.user_id = (select auth.uid())
  ))
  with check ((select auth.uid()) = user_id and exists (
    select 1 from public.study_plans p where p.id = plan_id and p.user_id = (select auth.uid())
  ));
create policy "Users manage their topic mastery" on public.topic_mastery for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users manage their preferences" on public.user_preferences for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create policy "Users manage their AI conversations" on public.ai_conversations for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users manage their AI messages" on public.ai_messages for all to authenticated
  using ((select auth.uid()) = user_id) with check (
    (select auth.uid()) = user_id and exists (
      select 1 from public.ai_conversations c
      where c.id = conversation_id and c.user_id = (select auth.uid())
    )
  );

grant select on public.certifications, public.certification_topics, public.learning_modules,
  public.learning_content_versions, public.questions, public.question_options, public.flashcards to anon, authenticated;
grant insert, update, delete on public.certifications, public.certification_topics, public.learning_modules,
  public.learning_content_versions, public.questions, public.question_options, public.flashcards to authenticated;
grant select, insert, update, delete on public.profiles, public.flashcard_reviews, public.flashcards, public.study_plans, public.study_sessions,
  public.topic_mastery, public.user_preferences, public.ai_conversations, public.ai_messages to authenticated;
grant select on public.quizzes, public.quiz_attempts, public.quiz_answers to authenticated;
grant select on public.question_answer_keys to service_role;
grant select, insert, update, delete on public.question_answer_keys to authenticated;
grant select on public.questions, public.question_options to service_role;
grant select, insert, update, delete on public.quizzes, public.quiz_attempts, public.quiz_answers to service_role;
