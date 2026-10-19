insert into public.certifications (id, name, provider, description, skills_outline_url, content_version, is_published)
values (
  'az-900',
  'Microsoft Azure Fundamentals',
  'Microsoft',
  'Independent study content for foundational cloud concepts and Azure services.',
  'https://learn.microsoft.com/credentials/certifications/resources/study-guides/az-900',
  '2026-10',
  true
)
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  skills_outline_url = excluded.skills_outline_url,
  content_version = excluded.content_version,
  is_published = excluded.is_published,
  updated_at = now();

insert into public.certification_topics (id, certification_id, name, sort_order)
values
  ('az-900-cloud', 'az-900', 'Cloud concepts', 1),
  ('az-900-architecture', 'az-900', 'Azure architecture and services', 2),
  ('az-900-governance', 'az-900', 'Azure management and governance', 3)
on conflict (id) do update set name = excluded.name, sort_order = excluded.sort_order;

insert into public.learning_modules
  (id, certification_id, topic_id, title, description, duration_minutes, source_url, content_version, is_published)
values
  ('module-cloud', 'az-900', 'az-900-cloud', 'Describe cloud computing', 'Explore cloud benefits, deployment models, and shared responsibility.', 18, 'https://learn.microsoft.com/training/modules/describe-cloud-compute/', '2026-10', true),
  ('module-service', 'az-900', 'az-900-cloud', 'Describe cloud service types', 'Compare IaaS, PaaS, and SaaS with practical examples.', 22, 'https://learn.microsoft.com/training/modules/describe-cloud-service-types/', '2026-10', true),
  ('module-architecture', 'az-900', 'az-900-architecture', 'Describe Azure architecture', 'Learn about regions, availability zones, resources, and subscriptions.', 25, 'https://learn.microsoft.com/training/modules/describe-core-architectural-components-of-azure/', '2026-10', true),
  ('module-governance', 'az-900', 'az-900-governance', 'Describe governance tools', 'Understand Azure Policy and governance organization.', 24, 'https://learn.microsoft.com/training/modules/describe-features-tools-governance/', '2026-10', true)
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  source_url = excluded.source_url,
  content_version = excluded.content_version,
  is_published = excluded.is_published,
  updated_at = now();

insert into public.learning_content_versions (module_id, version, source_url, last_reviewed_at, review_status)
select id, content_version, source_url, current_date, 'approved'
from public.learning_modules
where certification_id = 'az-900'
on conflict (module_id, version) do update set
  source_url = excluded.source_url,
  last_reviewed_at = excluded.last_reviewed_at,
  review_status = excluded.review_status;

insert into public.questions
  (id, certification_id, topic_id, difficulty, question_format, question_text, explanation, source_url, content_version, is_published)
values
  ('cloud-01', 'az-900', 'az-900-cloud', 'Beginner', 'single', 'A retailer expects a short burst of traffic during a seasonal sale. Which cloud benefit lets it add resources during the sale and release them afterward?', 'Elasticity is the ability to automatically increase or decrease resources as demand changes.', 'https://learn.microsoft.com/training/modules/describe-cloud-compute/', '2026-10', true),
  ('cloud-02', 'az-900', 'az-900-cloud', 'Beginner', 'multiple', 'Which two are cloud deployment models? Select all that apply.', 'Public, private, and hybrid are cloud deployment models. Serverless is a cloud computing approach.', 'https://learn.microsoft.com/training/modules/describe-cloud-compute/', '2026-10', true),
  ('arch-01', 'az-900', 'az-900-architecture', 'Beginner', 'single', 'What is an Azure region?', 'An Azure region is a geographic area containing one or more datacenters connected by a low-latency network.', 'https://learn.microsoft.com/training/modules/describe-core-architectural-components-of-azure/', '2026-10', true),
  ('gov-01', 'az-900', 'az-900-governance', 'Beginner', 'single', 'Which tool can help estimate the cost of Azure products before deployment?', 'The Azure Pricing calculator helps estimate costs for planned Azure configurations. Actual charges depend on usage and applicable terms.', 'https://learn.microsoft.com/training/modules/describe-cost-management-azure/', '2026-10', true)
on conflict (id) do update set
  question_text = excluded.question_text,
  explanation = excluded.explanation,
  source_url = excluded.source_url,
  content_version = excluded.content_version,
  is_published = excluded.is_published,
  updated_at = now();

insert into public.question_options (id, question_id, option_text, position)
values
  ('00000000-0000-4000-8000-000000000101', 'cloud-01', 'Elasticity', 0),
  ('00000000-0000-4000-8000-000000000102', 'cloud-01', 'Data residency', 1),
  ('00000000-0000-4000-8000-000000000103', 'cloud-01', 'High availability', 2),
  ('00000000-0000-4000-8000-000000000104', 'cloud-01', 'Governance', 3),
  ('00000000-0000-4000-8000-000000000201', 'cloud-02', 'Hybrid cloud', 0),
  ('00000000-0000-4000-8000-000000000202', 'cloud-02', 'Private cloud', 1),
  ('00000000-0000-4000-8000-000000000203', 'cloud-02', 'Serverless cloud', 2),
  ('00000000-0000-4000-8000-000000000204', 'cloud-02', 'Relational cloud', 3),
  ('00000000-0000-4000-8000-000000000301', 'arch-01', 'A geographic area containing one or more datacenters connected by a low-latency network', 0),
  ('00000000-0000-4000-8000-000000000302', 'arch-01', 'A billing profile shared by all subscriptions', 1),
  ('00000000-0000-4000-8000-000000000303', 'arch-01', 'A single virtual machine host', 2),
  ('00000000-0000-4000-8000-000000000304', 'arch-01', 'A customer-managed firewall rule', 3),
  ('00000000-0000-4000-8000-000000000401', 'gov-01', 'Azure Pricing calculator', 0),
  ('00000000-0000-4000-8000-000000000402', 'gov-01', 'Azure Service Health', 1),
  ('00000000-0000-4000-8000-000000000403', 'gov-01', 'Azure Monitor', 2),
  ('00000000-0000-4000-8000-000000000404', 'gov-01', 'Microsoft Entra ID', 3)
on conflict (id) do update set
  option_text = excluded.option_text,
  position = excluded.position;

insert into public.question_answer_keys (question_id, correct_positions)
values
  ('cloud-01', '{0}'),
  ('cloud-02', '{0,1}'),
  ('arch-01', '{0}'),
  ('gov-01', '{0}')
on conflict (question_id) do update set
  correct_positions = excluded.correct_positions,
  updated_at = now();
