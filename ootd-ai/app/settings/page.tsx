'use client';
import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { User, Ruler, Sparkles, LogOut, Loader2, Moon, Sun, Trash2, AlertTriangle, Bell, BellOff, Share2, Copy, MessageSquare, Send } from 'lucide-react';
import { usePushNotification } from '../../hooks/usePushNotification';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '../../lib/supabase/client';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../components/ThemeProvider';
import { useToast } from '../../components/ToastProvider';

const MOODS = [
  { id: 'minimal', label: '미니멀', emoji: '깔끔한' },
  { id: 'street', label: '스트릿', emoji: '힙한' },
  { id: 'casual', label: '캐주얼', emoji: '편안한' },
  { id: 'gorpcore', label: '고프코어', emoji: '트렌디' },
  { id: 'cityboy', label: '시티보이', emoji: '오버핏' },
  { id: 'vintage', label: '빈티지', emoji: '레트로' },
];

const BODY_GOALS = [
  { id: 'taller', label: '비율 보완 (다리가 길어보이게)', emoji: '📏' },
  { id: 'broader', label: '체형 보완 (어깨/상체 커버)', emoji: '🏋️' },
  { id: 'slimmer', label: '슬림 핏 (전체적으로 갸름하게)', emoji: '🕴️' },
];

// 서비스 전용 문의 이메일 (개인 이메일 대신 서비스용 이메일 사용)
const SUPPORT_EMAIL = 'ootdai.help@gmail.com';

export default function SettingsPage() {
  const { user, loading: authLoading } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [nickname, setNickname] = useState('');
  const [height, setHeight] = useState(175);
  const [weight, setWeight] = useState(70);
  const [fit, setFit] = useState('regular');
  const [selectedMoods, setSelectedMoods] = useState<string[]>([]);
  const [bodyGoal, setBodyGoal] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPublic, setIsPublic] = useState(false);
  const [shareId, setShareId] = useState('');
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();
  const { state: pushState, subscribe: subscribePush, unsubscribe: unsubscribePush } = usePushNotification(user?.id);
  const [contactMessage, setContactMessage] = useState('');
  const [contactSending, setContactSending] = useState(false);

  // 비로그인 차단
  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [authLoading, user, router]);

  useEffect(() => {
    const fetchProfile = async () => {
      if (authLoading) return;
      if (!user) {
        setIsLoading(false);
        return;
      }
      
      try {
        const { data } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (data) {
          setNickname(data.nickname || '');
          setHeight(data.height || 175);
          setWeight(data.weight || 70);
          setFit(data.fit_preference || 'regular');
          setSelectedMoods(data.style_moods || []);
          setBodyGoal(data.body_goal || '');
          setIsPublic(data.is_public || false);
          setShareId(data.share_id || '');
        }
      } catch (err) {
        console.error('Fetch profile error:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, [user, authLoading, supabase]);

  const toggleMood = (id: string) => {
    setSelectedMoods(prev =>
      prev.includes(id) ? prev.filter(m => m !== id) :
      prev.length < 3 ? [...prev, id] : prev
    );
  };

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('user_profiles')
        .upsert({
          user_id: user.id,
          nickname: nickname.trim(),
          height,
          weight,
          fit_preference: fit,
          style_moods: selectedMoods,
          body_goal: bodyGoal,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });

      if (error) throw error;
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err) {
      console.error(err);
      toast('저장 중 오류가 발생했습니다.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    setIsDeleting(true);
    try {
      const res = await fetch('/api/delete-account', { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || '계정 삭제 중 오류가 발생했습니다.');
      }
      toast('계정이 삭제되었습니다. 이용해주셔서 감사합니다.', 'success');
      router.push('/login');
      router.refresh();
    } catch (err) {
      console.error('Account deletion error:', err);
      toast(err instanceof Error ? err.message : '계정 삭제 중 오류가 발생했습니다.', 'error');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleTogglePublic = async () => {
    if (!user) return;
    const newIsPublic = !isPublic;
    
    // Generate shareId if it doesn't exist AND we are turning it on
    let newShareId = shareId;
    if (newIsPublic && !shareId) {
      newShareId = Math.random().toString(36).substring(2, 10);
      setShareId(newShareId);
    }
    
    setIsPublic(newIsPublic);
    
    try {
      await supabase.from('user_profiles').upsert({
        user_id: user.id,
        is_public: newIsPublic,
        ...(newShareId && { share_id: newShareId }),
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });
      
      if (newIsPublic) toast('옷장이 공개되었습니다.', 'success');
      else toast('옷장이 비공개로 전환되었습니다.', 'success');
    } catch {
      setIsPublic(!newIsPublic);
      toast('오류가 발생했습니다.', 'error');
    }
  };

  const copyShareLink = async () => {
    const link = `${window.location.origin}/shared/${shareId}`;
    try {
      await navigator.clipboard.writeText(link);
      toast('링크가 복사되었습니다.', 'success');
    } catch {
      toast('링크 복사에 실패했습니다.', 'error');
    }
  };

  const handleContactSubmit = async () => {
    if (!contactMessage.trim()) return;
    setContactSending(true);
    try {
      // 이메일 앱으로 문의 내용 전송
      const subject = encodeURIComponent('[OOTD AI 문의]');
      const body = encodeURIComponent(
        `사용자 이메일: ${user?.email || '비로그인'}\n\n문의 내용:\n${contactMessage}`
      );
      window.open(`mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`, '_self');
      
      setContactMessage('');
      toast('이메일 앱이 열렸습니다. 전송해주세요!', 'success');
    } catch {
      toast('문의 전송에 실패했습니다.', 'error');
    } finally {
      setContactSending(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-zinc-300" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#0c0c0f] font-sans pb-28 lg:pb-8">
      <div className="max-w-lg mx-auto px-6 pt-14 lg:pt-8">

        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl font-extrabold tracking-tight text-black dark:text-white">설정</h1>
          <p className="text-sm text-zinc-400 mt-1">프로필과 스타일 정보를 관리합니다</p>
        </div>

        {/* Profile Section */}
        <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-6 mb-6 shadow-sm">
          
          <div className="flex items-center gap-2 mb-6">
            <User className="w-4 h-4 text-zinc-400" />
            <span className="text-[11px] font-extrabold tracking-widest uppercase text-zinc-400">프로필</span>
          </div>

          {/* Avatar + Email */}
          <div className="flex items-center gap-4 mb-8 pb-6 border-b border-zinc-100 dark:border-zinc-800">
            <div className="w-14 h-14 rounded-full bg-zinc-100 overflow-hidden border-2 border-zinc-200 flex items-center justify-center shrink-0">
              {user?.user_metadata?.avatar_url ? (
                <img src={user.user_metadata.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <User className="w-6 h-6 text-zinc-400" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200 truncate">{user?.email}</p>
              <p className="text-[10px] text-zinc-400 tracking-wider uppercase mt-0.5">Google Account</p>
            </div>
          </div>

          {/* Nickname */}
          <div className="mb-6">
            <label className="text-[11px] font-bold tracking-widest uppercase text-zinc-400 block mb-2">닉네임</label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              maxLength={20}
              disabled={isSaving}
              className="w-full pb-2 text-lg font-bold bg-transparent border-b-2 border-zinc-200 dark:border-zinc-700 focus:border-black dark:focus:border-white outline-none transition-colors dark:text-white disabled:opacity-50"
            />
          </div>
        </motion.section>

        {/* Body Info */}
        <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-6 mb-6 shadow-sm">
          
          <div className="flex items-center gap-2 mb-6">
            <Ruler className="w-4 h-4 text-zinc-400" />
            <span className="text-[11px] font-extrabold tracking-widest uppercase text-zinc-400">체형 정보</span>
          </div>

          <div className="space-y-8">
            {/* Height */}
            <div>
              <div className="flex justify-between items-end mb-3">
                <span className="text-[11px] font-bold tracking-widest uppercase text-zinc-400">키</span>
                <span className="text-2xl font-black text-black dark:text-white">{height}<span className="text-sm text-zinc-400 ml-1">cm</span></span>
              </div>
              <input type="range" min="150" max="200" value={height}
                onChange={(e) => setHeight(Number(e.target.value))}
                className="w-full h-2 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-black" />
            </div>

            {/* Weight */}
            <div>
              <div className="flex justify-between items-end mb-3">
                <span className="text-[11px] font-bold tracking-widest uppercase text-zinc-400">몸무게</span>
                <span className="text-2xl font-black text-black dark:text-white">{weight}<span className="text-sm text-zinc-400 ml-1">kg</span></span>
              </div>
              <input type="range" min="40" max="120" value={weight}
                onChange={(e) => setWeight(Number(e.target.value))}
                className="w-full h-2 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-black" />
            </div>

            {/* Fit */}
            <div>
              <span className="text-[11px] font-bold tracking-widest uppercase text-zinc-400 block mb-3">선호 핏</span>
              <div className="flex gap-2">
                {['Slim', 'Regular', 'Oversized'].map(f => (
                  <button key={f} onClick={() => setFit(f.toLowerCase())}
                    className={`flex-1 py-3 rounded-xl text-[11px] font-bold tracking-widest uppercase transition-all ${
                      fit === f.toLowerCase()
                        ? 'bg-black text-white shadow-md'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:bg-zinc-200'
                    }`}>
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* Styling Goal */}
            <div className="pt-6 border-t border-zinc-100 dark:border-zinc-800">
              <span className="text-[11px] font-bold tracking-widest uppercase text-zinc-400 block mb-3">체형 보완 목표</span>
              <div className="flex flex-col gap-2">
                {BODY_GOALS.map(goal => (
                  <button key={goal.id} onClick={() => setBodyGoal(goal.id)}
                    className={`py-3.5 px-4 rounded-xl text-left transition-all flex gap-3 items-center border ${
                      bodyGoal === goal.id
                        ? 'bg-black text-white border-black shadow-md'
                        : 'bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700'
                    }`}>
                    <span className="text-xl shrink-0">{goal.emoji}</span>
                    <span className={`block text-xs font-bold ${bodyGoal === goal.id ? 'text-white' : 'text-zinc-800 dark:text-zinc-200'}`}>
                      {goal.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </motion.section>

        {/* Style Mood */}
        <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-6 mb-6 shadow-sm">
          
          <div className="flex items-center gap-2 mb-6">
            <Sparkles className="w-4 h-4 text-zinc-400" />
            <span className="text-[11px] font-extrabold tracking-widest uppercase text-zinc-400">스타일 DNA (최대 3개)</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {MOODS.map(mood => {
              const isSelected = selectedMoods.includes(mood.id);
              return (
                <button key={mood.id} onClick={() => toggleMood(mood.id)}
                  className={`py-3.5 rounded-xl text-center transition-all ${
                    isSelected
                      ? 'bg-black text-white shadow-md'
                      : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                  }`}>
                  <span className="block text-[10px] font-bold">{mood.label}</span>
                </button>
              );
            })}
          </div>
        </motion.section>

        {/* Push Notifications */}
        <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-6 mb-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                pushState === 'subscribed' ? 'bg-indigo-100 text-indigo-600' : 'bg-zinc-100 text-zinc-400'
              }`}>
                {pushState === 'subscribed' ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
              </div>
              <div>
                <p className="font-bold text-sm text-zinc-800 dark:text-zinc-200">코디 추천 알림 (PWA)</p>
                <p className="text-[10px] text-zinc-400">매일 앱에서 스마트 코디 알림 받기</p>
              </div>
            </div>
            
            {pushState === 'loading' ? (
              <Loader2 className="w-5 h-5 animate-spin text-zinc-300" />
            ) : pushState === 'unsupported' ? (
              <span className="text-[10px] text-zinc-400 bg-zinc-100 px-2 py-1 rounded">미지원 OS</span>
            ) : pushState === 'denied' ? (
              <span className="text-[10px] text-red-400 bg-red-50 px-2 py-1 rounded">OS 알림 설정 확인</span>
            ) : (
              <button 
                onClick={pushState === 'subscribed' ? unsubscribePush : subscribePush}
                className={`relative w-14 h-8 rounded-full transition-colors duration-300 ${
                  pushState === 'subscribed' ? 'bg-indigo-600' : 'bg-zinc-300'
                }`}>
                <motion.div
                  className="absolute top-1 w-6 h-6 bg-white rounded-full shadow-md"
                  animate={{ left: pushState === 'subscribed' ? '30px' : '4px' }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              </button>
            )}
          </div>
        </motion.section>

        {/* Share Wardrobe */}
        <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-6 mb-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                isPublic ? 'bg-emerald-100 text-emerald-600' : 'bg-zinc-100 text-zinc-400'
              }`}>
                <Share2 className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-sm text-zinc-800 dark:text-zinc-200">옷장 공유</p>
                <p className="text-[10px] text-zinc-400">선택한 옷장 아이템을 친구와 공유</p>
              </div>
            </div>
            <button onClick={handleTogglePublic}
              className={`relative w-14 h-8 rounded-full transition-colors duration-300 ${
                isPublic ? 'bg-emerald-500' : 'bg-zinc-300'
              }`}>
              <motion.div
                className="absolute top-1 w-6 h-6 bg-white rounded-full shadow-md"
                animate={{ left: isPublic ? '30px' : '4px' }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            </button>
          </div>
          
          {isPublic && shareId && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="pt-2">
              <div className="flex items-center justify-between p-3 bg-zinc-50 border border-zinc-200 rounded-xl">
                <span className="text-[10px] font-mono text-zinc-500 truncate mr-2">
                  {window.location.origin}/shared/{shareId}
                </span>
                <button onClick={copyShareLink} className="p-2 bg-white rounded flex items-center shrink-0 shadow-sm border border-zinc-200 hover:bg-zinc-50">
                  <Copy className="w-3.5 h-3.5 text-zinc-600" />
                </button>
              </div>
            </motion.div>
          )}
        </motion.section>

        {/* Dark Mode */}
        <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-6 mb-6 shadow-sm">
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                theme === 'dark' ? 'bg-indigo-900' : 'bg-amber-100'
              }`}>
                {theme === 'dark' ? (
                  <Moon className="w-5 h-5 text-indigo-300" />
                ) : (
                  <Sun className="w-5 h-5 text-amber-600" />
                )}
              </div>
              <div>
                <p className="font-bold text-sm text-zinc-800 dark:text-zinc-200">다크 모드</p>
                <p className="text-[10px] text-zinc-400">{theme === 'dark' ? '어두운 테마 사용 중' : '밝은 테마 사용 중'}</p>
              </div>
            </div>
            <button onClick={toggleTheme}
              className={`relative w-14 h-8 rounded-full transition-colors duration-300 ${
                theme === 'dark' ? 'bg-indigo-600' : 'bg-zinc-300'
              }`}>
              <motion.div
                className="absolute top-1 w-6 h-6 bg-white rounded-full shadow-md"
                animate={{ left: theme === 'dark' ? '30px' : '4px' }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            </button>
          </div>
        </motion.section>

        {/* Contact / Inquiry */}
        <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-6 mb-6 shadow-sm">
          
          <div className="flex items-center gap-2 mb-6">
            <MessageSquare className="w-4 h-4 text-zinc-400" />
            <span className="text-[11px] font-extrabold tracking-widest uppercase text-zinc-400">문의하기</span>
          </div>

          <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4 leading-relaxed">
            서비스 이용 중 불편한 점이나 건의사항이 있으시면 아래에 남겨주세요.
            이메일로도 문의하실 수 있습니다.
          </p>

          <textarea
            value={contactMessage}
            onChange={(e) => setContactMessage(e.target.value)}
            placeholder="문의 내용을 입력해주세요..."
            rows={4}
            className="w-full p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 outline-none focus:border-zinc-400 dark:focus:border-zinc-500 transition resize-none mb-4"
          />

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleContactSubmit}
              disabled={contactSending || !contactMessage.trim()}
              className="flex-1 py-3 bg-black dark:bg-white text-white dark:text-black rounded-xl font-bold text-xs tracking-wide hover:bg-zinc-800 dark:hover:bg-zinc-200 transition disabled:opacity-40 flex items-center justify-center gap-2"
            >
              {contactSending ? (
                <><Loader2 className="w-3.5 h-3.5 animate-spin" /> 전송 중...</>
              ) : (
                <><Send className="w-3.5 h-3.5" /> 문의 보내기</>
              )}
            </button>
            
            <a
              href={`mailto:${SUPPORT_EMAIL}?subject=[OOTD AI 문의] &body=사용자 이메일: ${user?.email || ''}%0A%0A문의 내용:%0A`}
              className="flex-1 py-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-xl font-bold text-xs tracking-wide hover:bg-zinc-200 dark:hover:bg-zinc-700 transition flex items-center justify-center gap-2 border border-zinc-200 dark:border-zinc-700"
            >
              <MessageSquare className="w-3.5 h-3.5" /> 이메일로 문의
            </a>
          </div>

          <p className="text-[10px] text-zinc-400 mt-3 text-center">
            문의 이메일: {SUPPORT_EMAIL}
          </p>
        </motion.section>

        {/* Save Button */}
        <motion.button
          onClick={handleSave}
          disabled={isSaving}
          whileTap={{ scale: 0.98 }}
          className={`w-full py-4 rounded-2xl font-extrabold tracking-widest text-[12px] uppercase shadow-xl transition-all flex items-center justify-center gap-2 mb-4 ${
            saveSuccess
              ? 'bg-emerald-500 text-white'
              : 'bg-black text-white hover:bg-zinc-800'
          }`}
        >
          {isSaving ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> 저장 중...</>
          ) : saveSuccess ? (
            '✓ 저장 완료!'
          ) : (
            '변경사항 저장하기'
          )}
        </motion.button>

        {/* Logout */}
        <button onClick={handleLogout}
          className="w-full py-4 bg-white border border-zinc-200 rounded-2xl text-red-500 font-bold text-sm flex items-center justify-center gap-2 hover:bg-red-50 transition mb-4">
          <LogOut className="w-4 h-4" /> 로그아웃
        </button>

        {/* Account Deletion */}
        {!showDeleteConfirm ? (
          <button onClick={() => setShowDeleteConfirm(true)}
            className="w-full py-3 bg-white border border-zinc-100 rounded-2xl text-zinc-400 font-medium text-xs flex items-center justify-center gap-2 hover:bg-red-50 hover:text-red-400 hover:border-red-200 transition mb-6">
            <Trash2 className="w-3.5 h-3.5" /> 계정 삭제
          </button>
        ) : (
          <div className="w-full p-4 bg-red-50 border border-red-200 rounded-2xl mb-6">
            <div className="flex items-start gap-3 mb-3">
              <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-red-700 mb-1">정말 계정을 삭제하시겠습니까?</p>
                <p className="text-xs text-red-500">모든 데이터(옷장, OOTD 기록, 프로필)가 즉시 영구 삭제되며 복구할 수 없습니다.</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={handleDeleteAccount} disabled={isDeleting}
                className="flex-1 py-2.5 bg-red-500 text-white rounded-xl font-bold text-xs tracking-wide hover:bg-red-600 transition disabled:opacity-50 flex items-center justify-center gap-1">
                {isDeleting ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> 삭제 중...</> : '영구 삭제'}
              </button>
              <button onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2.5 bg-white text-zinc-600 rounded-xl font-bold text-xs border border-zinc-200 hover:bg-zinc-50 transition">
                취소
              </button>
            </div>
          </div>
        )}

        {/* Legal Links */}
        <div className="flex items-center justify-center gap-4 mb-6">
          <Link href="/privacy" className="text-[10px] text-zinc-400 hover:text-zinc-600 transition font-medium">개인정보 처리방침</Link>
          <span className="text-zinc-200">|</span>
          <Link href="/terms" className="text-[10px] text-zinc-400 hover:text-zinc-600 transition font-medium">이용약관</Link>
        </div>

        {/* App Info */}
        <div className="text-center pb-8">
          <p className="text-[10px] text-zinc-300 font-bold tracking-widest uppercase">OOTD AI v1.0</p>
        </div>
      </div>
    </div>
  );
}
