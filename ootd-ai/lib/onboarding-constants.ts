export const STYLE_PHOTOS = [
  {
    id: 'minimal-1',
    url: 'https://images.unsplash.com/photo-1761896902115-49793a359daf?w=400&h=600&fit=crop&q=80',
    style: 'minimal', styleLabel: '미니멀',
    tags: { colors: ['white', 'neutral', 'beige'], fit: 'slim', formality: 'smart-casual', vibe: ['clean', 'modern', 'quiet'] },
  },
  {
    id: 'street-1',
    url: 'https://images.unsplash.com/photo-1576188973526-0e5d7047b0cf?w=400&h=600&fit=crop&q=80',
    style: 'street', styleLabel: '스트리트',
    tags: { colors: ['black', 'grey', 'pink'], fit: 'oversized', formality: 'casual', vibe: ['hype', 'urban', 'edgy'] },
  },
  {
    id: 'oldmoney-1',
    url: 'https://images.unsplash.com/photo-1761896904104-334cad0f5d3b?w=400&h=600&fit=crop&q=80',
    style: 'oldmoney', styleLabel: '올드머니',
    tags: { colors: ['cream', 'beige', 'brown'], fit: 'tailored', formality: 'business-casual', vibe: ['classic', 'elegant', 'quiet-luxury'] },
  },
  {
    id: 'gorpcore-1',
    url: 'https://images.unsplash.com/photo-1754666104611-ff0464cef605?w=400&h=600&fit=crop&q=80',
    style: 'gorpcore', styleLabel: '고프코어',
    tags: { colors: ['olive', 'brown', 'earth'], fit: 'regular', formality: 'casual', vibe: ['outdoor', 'functional', 'rugged'] },
  },
  {
    id: 'amekaji-1',
    url: 'https://images.unsplash.com/photo-1708523842501-800cd1c7505e?w=400&h=600&fit=crop&q=80',
    style: 'amekaji', styleLabel: '아메카지',
    tags: { colors: ['denim', 'indigo', 'white'], fit: 'regular', formality: 'casual', vibe: ['workwear', 'vintage', 'rugged'] },
  },
  {
    id: 'y2k-1',
    url: 'https://images.unsplash.com/photo-1632469188022-b5db09a70fbc?w=400&h=600&fit=crop&q=80',
    style: 'y2k', styleLabel: 'Y2K',
    tags: { colors: ['brown', 'warm', 'earth'], fit: 'regular', formality: 'casual', vibe: ['retro', 'cozy', 'playful'] },
  },
];

export const CONTEXTS = [
  { id: 'ctx_daily',  label: '일상 외출',     desc: '편하게 돌아다닐 때' },
  { id: 'ctx_work',   label: '출근·학교',     desc: '깔끔하고 단정하게' },
  { id: 'ctx_date',   label: '데이트',        desc: '조금 더 신경 쓰고 싶을 때' },
  { id: 'ctx_sport',  label: '운동·액티비티', desc: '활동적이고 편한' },
  { id: 'ctx_formal', label: '격식·행사',     desc: '세미포멀 이상' },
];

export const BODY_GOALS = [
  { id: 'taller',  label: '비율 보완 (다리가 길어보이게)', emoji: '📏' },
  { id: 'broader', label: '체형 보완 (어깨/상체 커버)',   emoji: '🏋️' },
  { id: 'slimmer', label: '슬림 핏 (전체적으로 갸름하게)', emoji: '🕴️' },
];
