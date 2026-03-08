import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Quest, ShopItem } from '../types';
import { INITIAL_QUESTS, SHOP_ITEMS } from './data';
import { getLevelFromTotalXp } from './engine';

interface AppState {
    xp: number;
    qp: number;
    level: number;
    energy: number;
    lastEnergyUpdate: number;
    quests: Quest[];
    unlockedItems: string[];
    equippedItems: {
        Accessory?: string;
        Tool?: string;
        Skin?: string;
        Background?: string;
    };
    lastLevelUp: number; // for animations
    lastQpEarned: number; // for animations

    // Actions
    completeQuest: (questId: string) => void;
    buyItem: (item: ShopItem) => boolean;
    equipItem: (item: ShopItem) => void;
    unequipItem: (category: ShopItem['category']) => void;
    tickEnergy: () => void;
}

const MAX_ENERGY = 5;
const ENERGY_REGEN_MS = 60 * 60 * 1000; // 1 hour

export const useAppStore = create<AppState>()(
    persist(
        (set, get) => ({
            xp: 0,
            qp: 0,
            level: 1,
            energy: MAX_ENERGY,
            lastEnergyUpdate: Date.now(),
            quests: INITIAL_QUESTS,
            unlockedItems: [],
            equippedItems: {},
            lastLevelUp: 0,
            lastQpEarned: 0,

            completeQuest: (questId: string) => {
                const state = get();
                if (state.energy <= 0) return; // Prevent if no energy

                const quest = state.quests.find(q => q.id === questId);
                if (!quest || quest.isCompleted) return;

                // Calculate XP: Add 5% if gold pencil is equipped
                let xpGained = quest.baseXp;
                if (state.equippedItems.Tool === 'tool_goldpencil') {
                    xpGained = Math.floor(xpGained * 1.05);
                }

                const qpEarned = Math.floor(Math.random() * 21) + 10; // 10 ~ 30

                const newXp = state.xp + xpGained;
                const newLevel = getLevelFromTotalXp(newXp);
                const didLevelUp = newLevel > state.level;

                set((prev) => ({
                    xp: newXp,
                    level: newLevel,
                    qp: prev.qp + qpEarned,
                    energy: prev.energy - 1,
                    lastLevelUp: didLevelUp ? Date.now() : prev.lastLevelUp,
                    lastQpEarned: Date.now(), // Trigger animation
                    quests: prev.quests.map(q => q.id === questId ? { ...q, isCompleted: true } : q)
                }));
            },

            buyItem: (item: ShopItem) => {
                const state = get();
                if (state.qp >= item.price && !state.unlockedItems.includes(item.id)) {
                    set({
                        qp: state.qp - item.price,
                        unlockedItems: [...state.unlockedItems, item.id]
                    });
                    return true; // Success
                }
                return false; // Failed
            },

            equipItem: (item: ShopItem) => {
                const state = get();
                if (state.unlockedItems.includes(item.id)) {
                    set({
                        equippedItems: {
                            ...state.equippedItems,
                            [item.category]: item.id
                        }
                    });
                }
            },

            unequipItem: (category: ShopItem['category']) => {
                set((state) => {
                    const updated = { ...state.equippedItems };
                    delete updated[category];
                    return { equippedItems: updated };
                });
            },

            tickEnergy: () => {
                const state = get();
                if (state.energy < MAX_ENERGY) {
                    const now = Date.now();
                    const elapsed = now - state.lastEnergyUpdate;
                    if (elapsed >= ENERGY_REGEN_MS) {
                        const energyToAdd = Math.floor(elapsed / ENERGY_REGEN_MS);
                        set({
                            energy: Math.min(MAX_ENERGY, state.energy + energyToAdd),
                            lastEnergyUpdate: now - (elapsed % ENERGY_REGEN_MS)
                        });
                    }
                } else {
                    set({ lastEnergyUpdate: Date.now() });
                }
            }
        }),
        {
            name: 'quest-study-storage'
        }
    )
);
