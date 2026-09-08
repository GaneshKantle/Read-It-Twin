-- Phase 10: restore public question fields for security_invoker view.
-- correct_answer remains unggranted so clients cannot select the answer key.

revoke all on table public.questions from anon, authenticated;
grant select (id, passage_id, question, options, type, created_at) on table public.questions to anon, authenticated;

drop policy if exists questions_select_public_cols on public.questions;
create policy questions_select_public_cols
  on public.questions
  for select
  to anon, authenticated
  using (true);

grant select on public.questions_public to anon, authenticated;
