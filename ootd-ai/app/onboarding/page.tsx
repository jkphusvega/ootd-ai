'use client';
import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Loader2, ArrowRight, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createClient } from '../../lib/supabase/client';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../components/ToastProvider';

export default function OnboardingPage() {
  const { user, loading: authLoading } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const { toast } = useToast();

  const [nickname, setNickname] = useState('');
  const [profilePreview, setProfilePreview] = useState<string | null>(null);
  const [profileFile, setProfileFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ?force=true 쿼리 스트링 감지 (개발/테스트용 강제 진입)
  const isForceMode = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return new URLSearchParams(window.location.search).get('force') === 'true';
  }, []);

  // 인증 감지 및 리다이렉트 제어
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace('/login');
      return;
    }

    const checkExistingProfile = async () => {
      try {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('user_id, nickname, profile_image')
          .eq('user_id', user.id)
          .single();

        if (data && !isForceMode) {
          // 이미 프로필이 존재하고 force 모드가 아니면 메인 홈으로 바로 보냄
          router.replace('/');
        } else {
          // 신규 유저 또는 강제 진입 모드일 때 입력 기본값 매핑
          if (data) {
            setNickname(data.nickname || '');
            setProfilePreview(data.profile_image || null);
          } else {
            const defaultName =
              user.user_metadata?.name ||
              user.user_metadata?.full_name ||
              user.email?.split('@')[0] || '';
            setNickname(defaultName);
            setProfilePreview(
              user.user_metadata?.avatar_url || 
              user.user_metadata?.picture || 
              null
            );
          }
          setIsChecking(false);
        }
      } catch (err) {
        console.error('Profile check error:', err);
        setIsChecking(false);
      }
    };

    checkExistingProfile();
  }, [user, authLoading, router, supabase, isForceMode]);

  // 파일 선택 및 이미지 미리보기 생성
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast('5MB 이하의 이미지만 업로드할 수 있습니다.', 'error');
        return;
      }
      setProfileFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Supabase Storage 이미지 업로드
  const uploadProfileImage = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop() || 'png';
      const fileName = `profile_${user?.id}_${Date.now()}.${fileExt}`;
      const filePath = `profiles/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('clothes')
        .upload(filePath, file, { cacheControl: '3600', upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('clothes').getPublicUrl(filePath);
      return data.publicUrl;
    } catch (err) {
      console.error('Image upload error:', err);
      return null;
    }
  };

  // 프로필 데이터 저장 공통 함수
  const saveProfileData = async (nameToSave: string, imgUrlToSave: string | null) => {
    if (!user) return;
    setIsSaving(true);
    
    try {
      let finalImgUrl = imgUrlToSave;
      
      // 새로 선택한 파일이 있으면 스토리지 업로드 진행 후 Auth 메타데이터 업데이트
      if (profileFile) {
        const uploadedUrl = await uploadProfileImage(profileFile);
        if (uploadedUrl) {
          finalImgUrl = uploadedUrl;
          const { error: authErr } = await supabase.auth.updateUser({
            data: { avatar_url: uploadedUrl }
          });
          if (authErr) {
            console.error('Auth metadata update error:', authErr);
          }
        }
      }

      // user_profiles 에는 profile_image 컬럼이 없으므로 제외하고 upsert 수행
      const { error } = await supabase.from('user_profiles').upsert({
        user_id: user.id,
        nickname: nameToSave.trim() || 'OOTD User',
        height: 175,
        weight: 70,
        fit_preference: 'regular',
        style_moods: [],
        body_goal: 'none',
        style_contexts: [],
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

      if (error) {
        console.error('Supabase DB Error:', error);
        toast(`DB 저장 에러: ${error.message} (${error.details || '상세없음'})`, 'error');
        throw error;
      }

      toast('반가워요! 프로필 설정이 완료되었습니다.', 'success');
      localStorage.setItem('ootd_onboarded', 'true');
      router.push('/');
      router.refresh();
    } catch (err: any) {
      console.error('Save profile error:', err);
      if (err.message && !err.message.includes('DB 저장 에러')) {
        toast(`저장 에러: ${err.message}`, 'error');
      }
    } finally {
      setIsSaving(false);
    }
  };

  // '시작하기' 버튼 핸들러
  const handleStart = () => {
    if (!nickname.trim()) {
      toast('닉네임을 입력해 주세요.', 'error');
      return;
    }
    saveProfileData(nickname, profilePreview);
  };

  // '건너뛰기' 버튼 핸들러
  const handleSkip = () => {
    const defaultName =
      nickname.trim() ||
      user?.user_metadata?.name ||
      user?.user_metadata?.full_name ||
      user?.email?.split('@')[0] ||
      'OOTD User';

    const defaultImg = 
      profilePreview || 
      user?.user_metadata?.avatar_url || 
      user?.user_metadata?.picture || 
      null;

    saveProfileData(defaultName, defaultImg);
  };

  if (isChecking || authLoading) {
    return (
      <div className="min-h-screen bg-[#F9F9FB] dark:bg-[#0c0c0f] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-zinc-300 dark:text-zinc-700" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-[#0c0c0f] dark:to-[#16161a] text-zinc-900 dark:text-white font-sans flex flex-col justify-center items-center px-6 py-12">
      <input 
        type="file" 
        accept="image/*" 
        className="hidden" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
      />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-md bg-white/70 dark:bg-zinc-900/60 backdrop-blur-xl border border-zinc-200/50 dark:border-zinc-800/50 shadow-2xl rounded-3xl p-8 md:p-10 flex flex-col items-center relative overflow-hidden"
      >
        {/* Decorative subtle background lights */}
        <div className="absolute -top-10 -left-10 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header copy */}
        <div className="text-center mb-8 relative z-10">
          <span className="text-2xl mb-2 block">✨</span>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight mb-2 bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-700 dark:from-white dark:via-zinc-200 dark:to-zinc-400 bg-clip-text text-transparent">
            반가워요!
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-xs md:text-sm font-medium leading-relaxed max-w-[280px] mx-auto">
            나만의 프로필 정보를 설정하고<br />스마트 AI 코디 추천을 시작하세요.
          </p>
        </div>

        {/* Profile Image Uploader */}
        <div className="mb-8 relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
          <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-100 dark:bg-zinc-800/50 flex items-center justify-center shadow-md relative transition-transform duration-300 active:scale-95 group-hover:border-zinc-400 dark:group-hover:border-zinc-600">
            {profilePreview ? (
              <img src={profilePreview} alt="Profile Preview" className="w-full h-full object-cover" />
            ) : (
              <User className="w-10 h-10 text-zinc-400" />
            )}
            
            {/* Dimmed hover effect */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
              <Camera className="w-6 h-6 text-white" />
            </div>
          </div>
          
          {/* Badge */}
          <div className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-black dark:bg-white text-white dark:text-black shadow-lg border-2 border-white dark:border-zinc-900 flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
            <Camera className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Nickname Input Form */}
        <div className="w-full mb-8 relative z-10">
          <label className="text-[10px] font-extrabold tracking-widest uppercase text-zinc-400 dark:text-zinc-500 block mb-2">
            사용할 닉네임
          </label>
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            maxLength={20}
            placeholder="닉네임을 입력해 주세요"
            disabled={isSaving}
            className="w-full px-4 py-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 focus:border-zinc-900 dark:focus:border-white focus:ring-1 focus:ring-zinc-900 dark:focus:ring-white outline-none transition-all dark:text-white font-semibold text-sm disabled:opacity-50"
          />
        </div>

        {/* Action Buttons */}
        <div className="w-full flex flex-col gap-3 relative z-10">
          <button
            onClick={handleStart}
            disabled={isSaving}
            className="w-full flex items-center justify-center gap-2 py-4 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-extrabold tracking-widest text-[12px] uppercase rounded-2xl shadow-lg hover:bg-black dark:hover:bg-zinc-100 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                저장 중...
              </>
            ) : (
              <>
                시작하기
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
          
          <button
            onClick={handleSkip}
            disabled={isSaving}
            className="w-full py-4 text-[11px] font-bold text-zinc-400 dark:text-zinc-500 tracking-widest uppercase hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors disabled:opacity-50"
          >
            건너뛰기
          </button>
        </div>
      </motion.div>
    </div>
  );
}
