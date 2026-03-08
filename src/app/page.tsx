'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Flame,
  Gamepad2,
  Store,
  User,
  RefreshCw,
  CheckCircle2,
  Timer,
  Zap,
  ShoppingBag,
  Check,
  Coins,
  ArrowRight,
  Clock,
  Sparkles,
  Award
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  onSnapshot
} from 'firebase/firestore';
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged,
  signInWithCustomToken
} from 'firebase/auth';

// --- Local Globals Fallback ---
// In case __firebase_config is not defined (e.g., standard Next.js local environment)
if (typeof globalThis !== 'undefined') {
  if (typeof (globalThis as any).__firebase_config === 'undefined') {
    (globalThis as any).__firebase_config = JSON.stringify({
      apiKey: "dummy-key",
      projectId: "dummy-project"
    });
  }
}

const getGlobalOrFallbackString = (key: string, fallback?: string) => {
  if (typeof globalThis !== 'undefined' && (globalThis as any)[key]) {
    return (globalThis as any)[key];
  }
  return fallback;
};

// --- Firebase Configuration ---
const __firebase_config = getGlobalOrFallbackString('__firebase_config');
const __app_id = getGlobalOrFallbackString('__app_id', 'quest-study-final-v1');
const __initial_auth_token = getGlobalOrFallbackString('__initial_auth_token');

const firebaseConfig = JSON.parse(__firebase_config);

// Try to initialize firebase, gracefully catch if it's a dummy config causing real network errors down the line
let app: any;
let auth: any;
let db: any;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
} catch (e) {
  console.warn("Firebase initialization error:", e);
}

const appId = typeof __app_id !== 'undefined' ? __app_id : 'quest-study-final-v1';

// --- PRD Data ---
const QUEST_POOL = [
  { id: 'q1', title: '책상 30초 정리하기', sub: '환경이 공부를 만든다', xp: 20, color: 'bg-[#FFDE59]' },
  { id: 'q2', title: '영단어 1개 쓰기', sub: '딱 하나만 적어보자', xp: 15, color: 'bg-[#FF914D]' },
  { id: 'q3', title: '교과서 1페이지 읽기', sub: '제목만 읽어도 성공', xp: 25, color: 'bg-[#FF5757]' },
  { id: 'q4', title: '플래너 펼치기', sub: '오늘의 운세 확인하듯', xp: 10, color: 'bg-[#7ED957]' },
  { id: 'q5', title: '기지개 5초 켜기', sub: '뇌에 산소를 공급해', xp: 10, color: 'bg-[#38B6FF]' },
  { id: 'q6', title: '수학 문제 1개 풀기', sub: '가장 쉬운 걸로 골라', xp: 30, color: 'bg-[#CB6CE6]' },
];

const EVOLUTION_STAGES = [
  { level: 1, name: '깨진 알', icon: '🥚', tier: 1 },
  { level: 5, name: '공부 병아리', icon: '🐣', tier: 2 },
  { level: 10, name: '열공 닭', icon: '🐔', tier: 3 },
  { level: 20, name: '학문 부엉이', icon: '🦉', tier: 4 },
  { level: 40, name: '전설의 불사조', icon: '🔥', tier: 5 },
];

const SHOP_ITEMS = [
  { id: 'item_eyes', name: '퀭한 다크써클', price: 200, icon: '🐼', type: 'acc', desc: '"어제 좀 달렸나?"' },
  { id: 'item_band', name: '필승 머리띠', price: 500, icon: '🎗️', type: 'acc', desc: '불꽃 이펙트 활성화' },
  { id: 'item_pencil', name: '황금 연필', price: 1000, icon: '✏️', type: 'tool', desc: 'XP 획득량 +5%' },
  { id: 'item_jacket', name: '과잠 (Jacket)', price: 1500, icon: '🧥', type: 'skin', desc: '대학 과잠 스타일' },
  { id: 'item_bg', name: '독서실 테마', price: 2000, icon: '🏢', type: 'bg', desc: '집중되는 어두운 배경' },
];

// --- Styled Components (Neo-Brutalism) ---
const NeoCard = ({ children, className = "", onClick }: { children: React.ReactNode, className?: string, onClick?: () => void }) => (
  <div
    onClick={onClick}
    className={`border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer p-4 ${className}`}
  >
    {children}
  </div>
);

const NeoButton = ({ children, onClick, color = "bg-[#38B6FF]", full = false, disabled = false }: { children: React.ReactNode, onClick: () => void, color?: string, full?: boolean, disabled?: boolean }) => (
  <button
    disabled={disabled}
    onClick={onClick}
    className={`${full ? 'w-full' : ''} border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1 ${color} p-4 font-black uppercase text-xl transition-all ${disabled ? 'opacity-50 grayscale cursor-not-allowed shadow-none translate-x-1 translate-y-1' : ''}`}
  >
    {children}
  </button>
);

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [view, setView] = useState('home'); // home, action, profile, shop
  const [selectedQuest, setSelectedQuest] = useState<any>(null);
  const [previewItem, setPreviewItem] = useState<any>(null);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [rewardAnim, setRewardAnim] = useState<string | null>(null);

  // Fallback state if auth fails
  const [isTestMode, setIsTestMode] = useState(false);

  // 1. Auth Init
  useEffect(() => {
    let unsubscribe = () => { };

    const initAuth = async () => {
      try {
        if (!auth) throw new Error("Firebase Auth not initialized");

        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }

        unsubscribe = onAuthStateChanged(auth, setUser);
      } catch (err) {
        console.warn("Auth initialization failed. Using in-memory Test Mode.", err);
        setIsTestMode(true);
        setUser({ uid: 'mock-user-123' });
      }
    };
    initAuth();
    return () => unsubscribe();
  }, []);

  // 2. Data Sync + Stamina logic
  useEffect(() => {
    if (!user) return;

    const initialData = {
      level: 1, xp: 0, maxXp: 100, qp: 0, streak: 0, stamina: 5,
      staminaUpdatedAt: Date.now(), inventory: [], equipped: {},
      dailyQuests: getRandomQuests(3), lastVisit: new Date().toDateString(),
      completedTotal: 0
    };

    if (isTestMode || !db) {
      setUserData(initialData);
      return;
    }

    try {
      const userRef = doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'current');

      const unsub = onSnapshot(userRef, (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          const now = Date.now();
          const lastStaminaUpdate = data.staminaUpdatedAt || now;
          const hoursPassed = Math.floor((now - lastStaminaUpdate) / (1000 * 60 * 60));

          if (hoursPassed > 0 && data.stamina < 5) {
            const newStamina = Math.min(5, data.stamina + hoursPassed);
            updateDoc(userRef, {
              stamina: newStamina,
              staminaUpdatedAt: now
            });
          }
          setUserData(data);
        } else {
          setDoc(userRef, initialData);
        }
      });
      return () => unsub();
    } catch (e) {
      console.warn("Firestore listener failed, using Test Mode", e);
      setIsTestMode(true);
      setUserData(initialData);
    }
  }, [user, isTestMode]);

  const getRandomQuests = (count: number) => {
    return [...QUEST_POOL].sort(() => 0.5 - Math.random()).slice(0, count);
  };

  // 3. Quest Completion Logic
  const handleQuestComplete = async () => {
    if (!user || !selectedQuest || !userData || userData.stamina <= 0) return;
    if (navigator.vibrate) navigator.vibrate(50);

    // QP Random Reward (10~30)
    const earnedQp = Math.floor(Math.random() * 21) + 10;
    setRewardAnim(`+${earnedQp} QP 획득!`);
    setTimeout(() => setRewardAnim(null), 2000);

    let nextXp = userData.xp + selectedQuest.xp;
    let nextLevel = userData.level;
    let nextMaxXp = userData.maxXp;

    // Golden Pencil Bonus
    if (userData.equipped?.tool === 'item_pencil') {
      nextXp += Math.round(selectedQuest.xp * 0.05);
    }

    if (nextXp >= nextMaxXp) {
      nextXp -= nextMaxXp;
      nextLevel += 1;
      nextMaxXp = Math.floor(nextMaxXp * 1.25);
      setShowLevelUp(true);
    }

    const updatedQuests = userData.dailyQuests.map((q: any) =>
      q.id === selectedQuest.id ? { ...q, completed: true } : q
    );

    const newData = {
      ...userData,
      xp: nextXp,
      level: nextLevel,
      maxXp: nextMaxXp,
      qp: (userData.qp || 0) + earnedQp,
      stamina: userData.stamina - 1,
      staminaUpdatedAt: Date.now(),
      dailyQuests: updatedQuests,
      streak: Math.max(userData.streak || 0, 1),
      completedTotal: (userData.completedTotal || 0) + 1
    };

    if (isTestMode || !db) {
      setUserData(newData);
    } else {
      const userRef = doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'current');
      await updateDoc(userRef, {
        xp: nextXp,
        level: nextLevel,
        maxXp: nextMaxXp,
        qp: newData.qp,
        stamina: newData.stamina,
        staminaUpdatedAt: newData.staminaUpdatedAt,
        dailyQuests: updatedQuests,
        streak: newData.streak,
        completedTotal: newData.completedTotal
      });
    }

    setView('home');
    setSelectedQuest(null);
  };

  // 4. Shop Handlers
  const handleShopAction = async (item: any) => {
    if (!user || !userData) return;
    const isOwned = userData.inventory?.includes(item.id);

    const currentEquipped = userData.equipped || {};
    const nextEquipped = { ...currentEquipped };

    if (isOwned) {
      if (currentEquipped[item.type] === item.id) {
        delete nextEquipped[item.type];
      } else {
        nextEquipped[item.type] = item.id;
      }

      if (isTestMode || !db) {
        setUserData({ ...userData, equipped: nextEquipped });
      } else {
        const userRef = doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'current');
        await updateDoc(userRef, { equipped: nextEquipped });
      }
    } else {
      if (userData.qp < item.price) return;

      const nextInventory = [...(userData.inventory || []), item.id];
      nextEquipped[item.type] = item.id;

      if (isTestMode || !db) {
        setUserData({
          ...userData,
          qp: userData.qp - item.price,
          inventory: nextInventory,
          equipped: nextEquipped
        });
      } else {
        const userRef = doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'current');
        await updateDoc(userRef, {
          qp: userData.qp - item.price,
          inventory: nextInventory,
          equipped: nextEquipped
        });
      }
      if (navigator.vibrate) navigator.vibrate([30, 30, 30]);
    }
    setPreviewItem(null);
  };

  if (!user || !userData) return <div className="min-h-screen bg-[#FFFBEB] flex items-center justify-center font-black text-2xl">로딩 중...</div>;

  const currentStage = [...EVOLUTION_STAGES].reverse().find(s => userData.level >= s.level) || EVOLUTION_STAGES[0];

  // Real-time Preview Logic
  const getAvatarDisplay = (type: string) => {
    if (previewItem && previewItem.type === type) return previewItem;
    const eqId = userData.equipped?.[type];
    return SHOP_ITEMS.find(i => i.id === eqId);
  };

  const activeAcc = getAvatarDisplay('acc');
  const activeTool = getAvatarDisplay('tool');
  const isStudyTheme = getAvatarDisplay('bg')?.id === 'item_bg';

  return (
    <div className={`min-h-screen ${isStudyTheme ? 'bg-slate-900' : 'bg-[#FFFBEB]'} text-black font-['Outfit'] select-none max-w-md mx-auto relative overflow-hidden flex flex-col border-x-4 border-black transition-colors duration-700`}>

      {/* Header */}
      <header className={`p-6 border-b-4 border-black ${isStudyTheme ? 'bg-slate-800 text-white' : 'bg-white'} flex justify-between items-center sticky top-0 z-30`}>
        <div className="flex items-center gap-3">
          <div className="relative group" onClick={() => setView('profile')}>
            <div className="w-14 h-14 border-4 border-black flex items-center justify-center bg-[#CB6CE6] text-3xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] group-active:translate-x-1 group-active:translate-y-1 group-active:shadow-none transition-all">
              {currentStage.icon}
            </div>
            {activeAcc && <div className="absolute -top-3 -right-3 text-2xl animate-bounce drop-shadow-md">{activeAcc.icon}</div>}
            {activeTool && <div className="absolute -bottom-1 -left-1 text-xl rotate-12">{activeTool.icon}</div>}
          </div>
          <div>
            <div className={`text-[10px] font-black uppercase ${isStudyTheme ? 'text-slate-400' : 'text-slate-500'}`}>Tier {currentStage.tier}</div>
            <div className="text-sm font-black tracking-tight">{currentStage.name}</div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="flex gap-2">
            <div className="bg-[#FF5757] border-4 border-black px-2 py-0.5 flex items-center gap-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-black">
              <Flame size={14} fill="currentColor" />
              <span className="font-black text-sm">{userData.streak}</span>
            </div>
            <div className="bg-[#38B6FF] border-4 border-black px-2 py-0.5 flex items-center gap-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-black">
              <Zap size={14} fill="currentColor" />
              <span className="font-black text-sm">{userData.stamina}</span>
            </div>
          </div>
          <div className={`text-[10px] font-black ${isStudyTheme ? 'text-white' : 'text-black'}`}>{userData.qp || 0} QP</div>
        </div>
      </header>

      {/* Pop-up Overlay */}
      {rewardAnim && (
        <div className="fixed top-32 left-1/2 -translate-x-1/2 z-[100] bg-[#FFDE59] border-4 border-black px-6 py-2 font-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] animate-bounce text-black">
          <div className="flex items-center gap-2"><Coins size={18} /> {rewardAnim}</div>
        </div>
      )}

      {/* Content */}
      <main className="flex-1 p-6 space-y-6 pb-24 overflow-y-auto relative">

        {/* XP Progress Bar */}
        <section className={`border-4 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${isStudyTheme ? 'bg-slate-800 text-white' : 'bg-white'}`}>
          <div className="flex justify-between text-[10px] font-black uppercase mb-1 tracking-widest">
            <span>XP Growth (Lv.{userData.level})</span>
            <span>{userData.xp} / {userData.maxXp}</span>
          </div>
          <div className="h-4 border-2 border-black bg-slate-100 p-0.5 overflow-hidden">
            <div
              className="h-full bg-[#7ED957] border-r-2 border-black transition-all duration-1000 ease-out"
              style={{ width: `${(userData.xp / userData.maxXp) * 100}%` }}
            />
          </div>
        </section>

        {/* Dashboard View */}
        {view === 'home' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex justify-between items-center">
              <h2 className={`text-2xl font-black italic uppercase ${isStudyTheme ? 'text-white' : ''}`}>퀘스트 보드</h2>
              <button
                onClick={() => {
                  if (isTestMode || !db) {
                    setUserData({ ...userData, dailyQuests: getRandomQuests(3) });
                  } else {
                    updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'current'), { dailyQuests: getRandomQuests(3) });
                  }
                }}
                className="text-[10px] font-black border-2 border-black px-2 py-1 bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none flex items-center gap-1 text-black"
              >
                <RefreshCw size={10} /> SHUFFLE
              </button>
            </div>

            <div className="space-y-4">
              {userData.dailyQuests?.map((q: any) => (
                <NeoCard
                  key={q.id}
                  className={`${q.color} ${q.completed ? 'opacity-40 grayscale pointer-events-none shadow-none text-black' : 'text-black'}`}
                  onClick={() => { setSelectedQuest(q); setView('action'); }}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-black leading-tight">{q.title}</h3>
                      <p className="text-[10px] font-bold opacity-80">{q.sub}</p>
                    </div>
                    {q.completed ? (
                      <CheckCircle2 size={24} className="text-black" />
                    ) : (
                      <div className="text-right text-black">
                        <span className="text-xs font-black">+{q.xp} XP</span>
                        <div className="text-[8px] font-black text-slate-800 italic uppercase">REWARD: QP</div>
                      </div>
                    )}
                  </div>
                </NeoCard>
              ))}
            </div>
          </div>
        )}

        {/* Execution View */}
        {view === 'action' && selectedQuest && (
          <div className="flex flex-col items-center justify-center space-y-10 py-8 animate-in zoom-in-95">
            <div className="text-center">
              <h2 className={`text-3xl font-black mb-2 underline decoration-8 decoration-[#FFDE59] ${isStudyTheme ? 'text-white' : ''}`}>{selectedQuest.title}</h2>
              <p className="text-sm font-bold text-slate-500 italic">"실패하기엔 너무나 작은 목표입니다."</p>
            </div>

            <div className="w-56 h-56 rounded-full border-8 border-black bg-white flex flex-col items-center justify-center shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] relative text-black">
              <Timer size={60} className="mb-2 text-[#FF5757]" />
              <span className="text-2xl font-black italic">DO IT NOW</span>
              <div className="absolute -top-4 -right-4 bg-[#CB6CE6] border-4 border-black p-3 animate-pulse">
                <Zap fill="currentColor" />
              </div>
            </div>

            <NeoButton
              full
              color="bg-[#7ED957]"
              disabled={userData.stamina <= 0}
              onClick={handleQuestComplete}
            >
              {userData.stamina > 0 ? '미션 완료 (CLICK)' : '에너지 부족 (대기 필요)'}
            </NeoButton>

            <button onClick={() => setView('home')} className={`text-xs font-black uppercase underline ${isStudyTheme ? 'text-white' : ''}`}>취소</button>
          </div>
        )}

        {/* Evolution View */}
        {view === 'profile' && (
          <div className="space-y-6 animate-in fade-in">
            <div className={`flex flex-col items-center border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] ${isStudyTheme ? 'bg-slate-800' : 'bg-white'}`}>
              <div className="relative mb-6">
                <div className="w-32 h-32 border-8 border-black flex items-center justify-center text-7xl bg-slate-50">
                  {currentStage.icon}
                </div>
                {activeAcc && <div className="absolute -top-4 -right-4 text-5xl drop-shadow-xl z-10">{activeAcc.icon}</div>}
                {activeTool && <div className="absolute -bottom-2 -left-2 text-4xl rotate-12 z-10">{activeTool.icon}</div>}
              </div>
              <h2 className={`text-3xl font-black uppercase mb-1 ${isStudyTheme ? 'text-white' : ''}`}>{currentStage.name}</h2>
              <div className="bg-black text-white px-6 py-1 font-black text-xs rounded-full tracking-widest">LEVEL {userData.level}</div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <NeoCard className="bg-[#38B6FF] text-center text-black">
                <div className="text-2xl font-black">{userData.completedTotal || 0}</div>
                <div className="text-[10px] font-black uppercase">총 성취</div>
              </NeoCard>
              <NeoCard className="bg-[#FF914D] text-center text-black">
                <div className="text-2xl font-black">{userData.streak || 0}</div>
                <div className="text-[10px] font-black uppercase">최고 스트릭</div>
              </NeoCard>
            </div>

            <NeoCard className={isStudyTheme ? 'bg-slate-800 text-white' : 'bg-white text-black'}>
              <h3 className="font-black text-xs uppercase mb-4 border-b-2 border-black pb-1">성장 마일스톤</h3>
              <div className="space-y-4">
                {EVOLUTION_STAGES.map((s, idx) => (
                  <div key={idx} className={`flex items-center gap-4 ${userData.level >= s.level ? '' : 'opacity-30'}`}>
                    <div className="w-10 h-10 border-2 border-black flex items-center justify-center text-xl bg-slate-100 text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">{s.icon}</div>
                    <div className="flex-1 font-black text-sm">{s.name}</div>
                    <div className="text-[10px] font-black italic">Lv.{s.level}</div>
                  </div>
                ))}
              </div>
            </NeoCard>
          </div>
        )}

        {/* Market View */}
        {view === 'shop' && (
          <div className="space-y-6 animate-in fade-in">
            <div className="flex justify-between items-center">
              <h2 className={`text-2xl font-black italic uppercase ${isStudyTheme ? 'text-white' : ''}`}>퀘스트 마켓</h2>
              <div className="text-xs font-black bg-[#FFDE59] border-2 border-black px-2 py-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-black">MY QP: {userData.qp}</div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {SHOP_ITEMS.map((item) => {
                const isOwned = userData.inventory?.includes(item.id);
                const isEquipped = userData.equipped?.[item.type] === item.id;
                const isPreview = previewItem?.id === item.id;

                return (
                  <div key={item.id} className="relative">
                    <NeoCard
                      className={`${isStudyTheme ? 'bg-slate-800 text-white' : 'bg-white text-black'} ${isPreview ? 'ring-4 ring-indigo-500 scale-[1.02]' : ''}`}
                      onClick={() => setPreviewItem(isPreview ? null : item)}
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-4">
                          <div className="text-4xl drop-shadow-sm">{item.icon}</div>
                          <div>
                            <h4 className="font-black text-sm">{item.name}</h4>
                            <p className="text-[10px] font-bold text-slate-500">{item.desc}</p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          {isOwned ? (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleShopAction(item); }}
                              className={`px-3 py-1 border-2 border-black font-black text-[10px] uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${isEquipped ? 'bg-[#7ED957] text-black' : 'bg-slate-200 text-black'}`}
                            >
                              {isEquipped ? 'EQUIPPED' : 'EQUIP'}
                            </button>
                          ) : (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleShopAction(item); }}
                              disabled={userData.qp < item.price}
                              className={`px-3 py-1 border-2 border-black font-black text-[10px] uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] bg-[#FFDE59] text-black ${userData.qp < item.price ? 'opacity-50' : ''}`}
                            >
                              {item.price} QP
                            </button>
                          )}
                        </div>
                      </div>
                    </NeoCard>
                    {!isOwned && isPreview && (
                      <div className="absolute -top-2 -left-2 bg-indigo-500 text-white text-[8px] px-1.5 py-0.5 font-bold border-2 border-black animate-pulse shadow-sm z-10">미리보기 (PREVIEW)</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* Level Up Pop-up */}
      {showLevelUp && (
        <div className="fixed inset-0 bg-black/80 z-[200] flex items-center justify-center p-10 backdrop-blur-md">
          <div className="bg-white border-8 border-black p-8 text-center max-w-xs shadow-[12px_12px_0px_0px_rgba(203,108,230,1)] animate-in zoom-in-50">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-4xl font-black uppercase mb-4 tracking-tighter italic text-black">LEVEL UP!</h2>
            <p className="font-bold text-slate-500 mb-8 leading-tight text-sm">축하합니다! 당신의 학습 아바타가<br />새로운 지혜의 단계에 도달했습니다.</p>
            <NeoButton full color="bg-[#CB6CE6]" onClick={() => setShowLevelUp(false)}>최고야!</NeoButton>
            <div className="absolute -top-10 -left-10 text-4xl animate-bounce"><Sparkles /></div>
            <div className="absolute -bottom-10 -right-10 text-4xl animate-bounce delay-150 text-indigo-500"><Award /></div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className={`fixed bottom-0 max-w-[444px] w-full border-t-4 border-black p-4 flex justify-around items-center z-40 ${isStudyTheme ? 'bg-slate-800' : 'bg-white'}`}>
        <button onClick={() => { setView('home'); setPreviewItem(null); }} className={`flex flex-col items-center gap-1 ${view === 'home' ? 'text-[#38B6FF]' : 'text-slate-400'}`}>
          <Gamepad2 size={24} strokeWidth={3} />
          <span className="text-[9px] font-black uppercase tracking-tighter">보드</span>
        </button>
        <button onClick={() => { setView('profile'); setPreviewItem(null); }} className={`flex flex-col items-center gap-1 ${view === 'profile' ? 'text-[#CB6CE6]' : 'text-slate-400'}`}>
          <User size={24} strokeWidth={3} />
          <span className="text-[9px] font-black uppercase tracking-tighter">진화</span>
        </button>
        <button onClick={() => { setView('shop'); setPreviewItem(null); }} className={`flex flex-col items-center gap-1 ${view === 'shop' ? 'text-[#FFDE59]' : 'text-slate-400'}`}>
          <ShoppingBag size={24} strokeWidth={3} />
          <span className="text-[9px] font-black uppercase tracking-tighter">상점</span>
        </button>
      </nav>

    </div>
  );
}
