import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uojsmshjapihgyrupnrp.supabase.co';

const supabaseAnonKey = 'sb_publishable_3072mYf2FgoFyJzSEvjczQ_ODsFJMQl'; 

export const supabase = createClient(supabaseUrl, supabaseAnonKey);