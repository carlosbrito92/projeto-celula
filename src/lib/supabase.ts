import { createClient } from '@supabase/supabase-js';

// Chave anon/publishable do Supabase — segura para expor no client por design
// (é isso que o nome "publishable" significa). O gate real é RLS, não sigilo
// desta chave. Ver CLAUDE.md para o racional completo.
const SUPABASE_URL = 'https://tvhywnpctttrmzcyueii.supabase.co';
const SUPABASE_ANON_KEY =
  'sb_publishable_lFlZQfh76aiYaoKl1DXxAw_dLjU8-iG';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
