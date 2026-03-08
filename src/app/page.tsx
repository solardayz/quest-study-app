'use client';

import { useEffect, useState } from 'react';
import { useAppStore } from '../lib/store';
import { getTierForLevel, getXpProgressForCurrentLevel } from '../lib/engine';
import { SHOP_ITEMS } from '../lib/data';

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'quest' | 'shop'>('quest');
  const [previewItem, setPreviewItem] = useState<string | null>(null);
  const [coinsList, setCoinsList] = useState<{ id: number; x: number; y: number }[]>([]);
  const [showLevelUp, setShowLevelUp] = useState(false);

  const {
    xp, qp, level, energy, quests, unlockedItems, equippedItems,
    lastLevelUp, lastQpEarned, completeQuest, buyItem, equipItem, unequipItem, tickEnergy
  } = useAppStore();

  useEffect(() => {
    setMounted(true);
    const interval = setInterval(() => tickEnergy(), 60000); // Check energy every minute
    return () => clearInterval(interval);
  }, [tickEnergy]);

  // Handle Level Up Animation
  useEffect(() => {
    if (lastLevelUp > 0 && mounted) {
      setShowLevelUp(true);
      setTimeout(() => setShowLevelUp(false), 2000);
    }
  }, [lastLevelUp, mounted]);

  // Handle QP Earned Animation
  useEffect(() => {
    if (lastQpEarned > 0 && mounted) {
      const newCoin = { id: Date.now(), x: Math.random() * 50 + 20, y: Math.random() * 20 + 80 };
      setCoinsList(prev => [...prev, newCoin]);
      setTimeout(() => {
        setCoinsList(prev => prev.filter(c => c.id !== newCoin.id));
      }, 1500);
    }
  }, [lastQpEarned, mounted]);

  // Apply Background Theme
  useEffect(() => {
    if (equippedItems.Background === 'bg_studyroom') {
      document.body.classList.add('theme-studyroom');
    } else {
      document.body.classList.remove('theme-studyroom');
    }
  }, [equippedItems.Background]);

  if (!mounted) return null;

  const currentTier = getTierForLevel(level);
  const xpProgress = getXpProgressForCurrentLevel(xp);

  // Derive display equipment (includes preview)
  const displayEquipment = { ...equippedItems };
  if (previewItem) {
    const item = SHOP_ITEMS.find(i => i.id === previewItem);
    if (item) {
      displayEquipment[item.category] = item.id;
    }
  }

  const getEmojiForItemId = (id?: string) => {
    if (!id) return null;
    return SHOP_ITEMS.find(i => i.id === id)?.icon;
  };

  const handleQuestComplete = (e: React.MouseEvent, questId: string) => {
    if (energy <= 0) {
      alert('에너지가 부족합니다! 잠시 휴식하세요.');
      return;
    }
    completeQuest(questId);
  };

  return (
    <div className="dashboard-grid">
      {/* Notifications */}
      {showLevelUp && (
        <div className="levelup-overlay">
          <div className="levelup-text">Level Up!</div>
        </div>
      )}

      {coinsList.map(coin => (
        <div
          key={coin.id}
          className="anim-coin"
          style={{ left: `${coin.x}%`, bottom: `${coin.y}%` }}
        >
          +QP
        </div>
      ))}

      {/* Left Panel: Avatar & Stats */}
      <div className="panel">
        <div className="panel-title">내 아바타</div>

        <div className="avatar-container">
          <div className="tier-name">{currentTier.name}</div>

          <div className="avatar-emoji">{currentTier.icon}</div>

          {displayEquipment.Accessory && (
            <div className="avatar-accessory">{getEmojiForItemId(displayEquipment.Accessory)}</div>
          )}
          {displayEquipment.Tool && (
            <div className="avatar-tool">{getEmojiForItemId(displayEquipment.Tool)}</div>
          )}
          {displayEquipment.Skin && (
            <div className="avatar-skin">{getEmojiForItemId(displayEquipment.Skin)}</div>
          )}
        </div>

        <div className="stats-row">
          <div>Lv. {level}</div>
          <div className="qp-text"><span>🪙</span> {qp} QP</div>
        </div>

        <div className="xp-container">
          <div className="xp-labels">
            <span>XP ({Math.floor(xpProgress.currentLevelXp)} / {xpProgress.xpRequiredForNextLevel})</span>
            <span>{Math.floor(xpProgress.percentage)}%</span>
          </div>
          <div className="xp-bar-bg">
            <div className="xp-bar-fill" style={{ width: `${xpProgress.percentage}%` }}></div>
          </div>
        </div>

        <div className="stats-row" style={{ marginTop: '24px' }}>
          <div>에너지 ⚡</div>
          <div className="energy-text">{energy} / 5</div>
        </div>
      </div>

      {/* Right Panel: Content */}
      <div className="panel">
        <div className="tabs">
          <button
            className={`tab ${activeTab === 'quest' ? 'active' : ''}`}
            onClick={() => setActiveTab('quest')}
          >
            퀘스트
          </button>
          <button
            className={`tab ${activeTab === 'shop' ? 'active' : ''}`}
            onClick={() => setActiveTab('shop')}
          >
            상점
          </button>
        </div>

        {activeTab === 'quest' && (
          <div>
            <div className="panel-title">오늘의 퀘스트</div>
            <p style={{ color: 'var(--text-muted)', marginBottom: '16px', fontSize: '0.9rem' }}>
              퀘스트를 완료하고 XP와 무작위 QP를 획득하세요!
            </p>
            <div className="quest-list">
              {quests.map(quest => (
                <div
                  key={quest.id}
                  className={`quest-item ${quest.isCompleted ? 'completed' : ''}`}
                  onClick={(e) => !quest.isCompleted && handleQuestComplete(e, quest.id)}
                >
                  <div className="quest-title">{quest.title}</div>
                  <div className="quest-reward">+{quest.baseXp} XP</div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: '24px', fontSize: '0.8rem', color: '#666', textAlign: 'center' }}>
              (테스트용: 새로고침하면 퀘스트가 초기화되지 않습니다. Zustand가 로컬스토리지 유지)
            </div>
          </div>
        )}

        {activeTab === 'shop' && (
          <div>
            <div className="panel-title">아이템 상점</div>
            <p style={{ color: 'var(--text-muted)', marginBottom: '16px', fontSize: '0.9rem' }}>
              아이템을 클릭하여 미리보기를 확인하세요. QP를 모아 구매할 수 있습니다.
            </p>
            <div className="shop-grid">
              {SHOP_ITEMS.map(item => {
                const isUnlocked = unlockedItems.includes(item.id);
                const isEquipped = equippedItems[item.category] === item.id;
                const canAfford = qp >= item.price;
                const isPreview = previewItem === item.id;

                return (
                  <div
                    key={item.id}
                    className={`shop-item ${isPreview ? 'preview-mode' : ''}`}
                    onClick={() => setPreviewItem(isPreview ? null : item.id)}
                  >
                    <div className="shop-item-icon">{item.icon}</div>
                    <div className="shop-item-name">{item.name}</div>
                    <div className="shop-item-desc">{item.description}</div>
                    {!isUnlocked && <div className="shop-item-price">🪙 {item.price}</div>}

                    <div style={{ marginTop: 'auto' }}>
                      {isUnlocked ? (
                        <button
                          className={`btn ${isEquipped ? 'equipped' : ''}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            isEquipped ? unequipItem(item.category) : equipItem(item);
                            setPreviewItem(null);
                          }}
                        >
                          {isEquipped ? '해제하기' : '장착하기'}
                        </button>
                      ) : (
                        <button
                          className="btn"
                          disabled={!canAfford}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (buyItem(item)) {
                              setPreviewItem(null);
                            }
                          }}
                        >
                          {canAfford ? '구매하기' : 'QP 부족'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
