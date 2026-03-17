import { createClient } from '@supabase/supabase-js';

// Ton URL de projet (déjà identifiée)
const supabaseUrl = 'https://uojsmshjapihgyrupnrp.supabase.co';

// ICI : Colle la longue suite de caractères de la clé "anon" "public"
const supabaseAnonKey = 'sb_publishable_3072mYf2FgoFyJzSEvjczQ_ODsFJMQl'; 

export const supabase = createClient(supabaseUrl, supabaseAnonKey);