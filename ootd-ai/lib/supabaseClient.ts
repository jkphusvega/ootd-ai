import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase 환경 변수가 설정되지 않았습니다. .env.local을 확인해주세요.');
}

// Supabase 클라이언트 인스턴스 전역 생성 (Single connection)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
