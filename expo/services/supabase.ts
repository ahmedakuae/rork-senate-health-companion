import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

const supabaseUrl = (Constants.expoConfig?.extra?.supabaseUrl as string) || process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = (Constants.expoConfig?.extra?.supabaseAnonKey as string) || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('[Supabase] Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

console.log('[Supabase] Client initialized with URL:', supabaseUrl ? supabaseUrl.substring(0, 30) + '...' : 'MISSING');
