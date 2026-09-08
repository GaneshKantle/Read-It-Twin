-- Phase 10 follow-up: revoke internal helper from public clients
revoke all on function public.rls_auto_enable() from public, anon, authenticated;
