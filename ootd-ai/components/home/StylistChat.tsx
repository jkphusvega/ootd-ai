'use client';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Sparkles, Lock, ExternalLink } from 'lucide-react';
import type { FashionCritique } from '../../hooks/useOotdAnalysis';

function parseItems(text: string): { body: string; items: string[] } {
  const itemsMatch = text.match(/##ITEMS:\s*(.+)$/m);
  if (!itemsMatch) return { body: text, items: [] };
  const items = itemsMatch[1].split(',').map(s => s.trim()).filter(Boolean);
  const body = text.replace(/\n?##ITEMS:\s*.+$/m, '').trim();
  return { body, items };
}

function musinsaUrl(item: string) {
  return `https://www.musinsa.com/search/goods?keyword=${encodeURIComponent(item)}`;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface Props {
  critique: FashionCritique;
}

function buildSuggestions(critique: FashionCritique): string[] {
  const suggestions: string[] = [];

  // 개선점에서 첫 번째 문제 → 구체적 질문 생성
  if (critique.improvements?.length) {
    const issue = critique.improvements[0].split(' → ')[0].trim();
    suggestions.push(`${issue}를 어떻게 고치면 좋아?`);
  }

  // 가장 낮은 카테고리 점수 → 관련 질문
  const cats = [
    { key: 'fit' as const, label: '핏' },
    { key: 'color' as const, label: '컬러 조합' },
    { key: 'styling' as const, label: '스타일링' },
  ];
  const lowest = cats.sort((a, b) => (critique[a.key] ?? 100) - (critique[b.key] ?? 100))[0];
  if (lowest && (critique[lowest.key] ?? 100) < 75) {
    suggestions.push(`${lowest.label}을 더 좋게 만들 수 있는 방법 알려줘`);
  }

  // 잘된 점 기반 — 비슷한 스타일 확장 질문
  if (critique.strengths?.length) {
    suggestions.push('비슷한 무드로 다른 날씨에도 입을 수 있는 코디 알려줘');
  }

  // 폴백
  if (suggestions.length < 2) {
    suggestions.push('신발은 뭘 매치하면 좋아?');
    suggestions.push('이 룩에 어울리는 아우터 추천해줘');
  }

  return suggestions.slice(0, 3);
}

export default function StylistChat({ critique }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [isLimited, setIsLimited] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggested = buildSuggestions(critique);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 200);
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isOpen, messages]);

  const send = async (question: string) => {
    if (!question.trim() || isLoading || isLimited) return;
    const userMsg: Message = { role: 'user', content: question };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    const assistantMsg: Message = { role: 'assistant', content: '' };
    setMessages(prev => [...prev, assistantMsg]);

    try {
      const res = await fetch('/api/ask-stylist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          critiqueContext: critique,
          history: messages,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        if (res.status === 429) setIsLimited(true);
        setMessages(prev => {
          const next = [...prev];
          next[next.length - 1] = { role: 'assistant', content: err.error || '오류가 발생했습니다.' };
          return next;
        });
        return;
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let full = '';
      let firstChunk = true;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const raw = decoder.decode(value, { stream: true });

        if (firstChunk && raw.startsWith('\x00')) {
          // 남은 횟수 파싱 (첫 바이트가 \x00인 경우)
          const nullIdx = raw.indexOf('\x00');
          const afterNull = raw.slice(nullIdx + 1);
          const numEnd = afterNull.search(/\D/);
          const numStr = numEnd === -1 ? afterNull : afterNull.slice(0, numEnd);
          if (numStr) setRemaining(parseInt(numStr));
          full += numEnd === -1 ? '' : afterNull.slice(numEnd);
          firstChunk = false;
        } else {
          firstChunk = false;
          full += raw;
        }

        const currentFull = full;
        setMessages(prev => {
          const next = [...prev];
          next[next.length - 1] = { role: 'assistant', content: currentFull };
          return next;
        });
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
    } catch {
      setMessages(prev => {
        const next = [...prev];
        next[next.length - 1] = { role: 'assistant', content: '네트워크 오류가 발생했습니다.' };
        return next;
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mt-4">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="w-full py-3 rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 text-[12px] font-semibold flex items-center justify-center gap-2 hover:border-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5" />
          스타일리스트에게 더 물어보기
          <span className="text-[10px] bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded-full">무료 3회</span>
        </button>
      ) : (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden"
          >
            {/* 헤더 */}
            <div className="flex items-center gap-2 px-4 py-3 bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800">
              <Sparkles className="w-3.5 h-3.5 text-purple-500" />
              <span className="text-[11px] font-extrabold text-zinc-700 dark:text-zinc-300 tracking-wide">패션 에디터에게 물어보기</span>
              {remaining !== null && (
                <span className="ml-auto text-[10px] text-zinc-400">오늘 {remaining}회 남음</span>
              )}
            </div>

            {/* 메시지 */}
            <div className="px-4 py-3 flex flex-col gap-3 max-h-64 overflow-y-auto bg-white dark:bg-zinc-950">
              {messages.length === 0 && (
                <div className="flex flex-col gap-2">
                  <p className="text-[11px] text-zinc-400 text-center mb-1">궁금한 것을 자유롭게 물어보세요</p>
                  {suggested.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => send(s)}
                      className="text-left text-[11px] text-zinc-600 dark:text-zinc-400 px-3 py-2 bg-zinc-50 dark:bg-zinc-900 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors border border-zinc-100 dark:border-zinc-800"
                    >
                      "{s}"
                    </button>
                  ))}
                </div>
              )}

              {messages.map((msg, i) => {
                if (msg.role === 'user') {
                  return (
                    <div key={i} className="flex justify-end">
                      <div className="max-w-[85%] rounded-2xl rounded-br-sm px-3 py-2 text-[12px] leading-relaxed font-medium bg-zinc-900 dark:bg-white text-white dark:text-zinc-900">
                        {msg.content}
                      </div>
                    </div>
                  );
                }
                const { body, items } = parseItems(msg.content);
                return (
                  <div key={i} className="flex justify-start">
                    <div className="max-w-[90%] flex flex-col gap-2">
                      <div className="rounded-2xl rounded-bl-sm px-3 py-2 text-[12px] leading-relaxed font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200">
                        {body || (
                          <span className="flex gap-1 items-center py-0.5">
                            <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                          </span>
                        )}
                      </div>
                      {items.length > 0 && (
                        <div className="flex flex-col gap-1">
                          <p className="text-[10px] text-zinc-400 font-semibold px-1">무신사에서 찾아보기</p>
                          <div className="flex flex-wrap gap-1.5">
                            {items.map((item, j) => (
                              <a
                                key={j}
                                href={musinsaUrl(item)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[11px] font-bold bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:border-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                              >
                                {item}
                                <ExternalLink className="w-2.5 h-2.5 text-zinc-400 shrink-0" />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {isLimited && (
                <div className="flex items-center gap-2 px-3 py-2.5 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800 mt-1">
                  <Lock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <p className="text-[11px] text-amber-700 dark:text-amber-400 font-medium">오늘 무료 질문을 모두 사용했어요. 프리미엄 플랜에서 무제한으로 이용하세요.</p>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* 입력창 */}
            {!isLimited && (
              <div className="flex gap-2 p-3 bg-zinc-50 dark:bg-zinc-900 border-t border-zinc-100 dark:border-zinc-800">
                <input
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send(input)}
                  placeholder="셔츠 기장이 길면 어떻게 입어야 해?"
                  disabled={isLoading}
                  className="flex-1 text-[12px] bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2.5 outline-none focus:border-zinc-400 dark:focus:border-zinc-500 placeholder:text-zinc-300 dark:placeholder:text-zinc-600 disabled:opacity-50 text-zinc-800 dark:text-zinc-200"
                />
                <button
                  onClick={() => send(input)}
                  disabled={!input.trim() || isLoading}
                  className="w-9 h-9 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl flex items-center justify-center shrink-0 disabled:opacity-30 transition hover:bg-zinc-700 dark:hover:bg-zinc-200 active:scale-95"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
