export type TierId = 1 | 2 | 3 | 4 | 5;

export interface TierDef {
    id: TierId;
    name: string;      // 단계명칭
    minLevel: number;  // 시작 레벨
    maxLevel: number;  // 끝 레벨 (Tier 5는 무한대)
    description: string; // 디자인 핵심 요소
    imageUrl?: string; // 이미지 에셋 경로 (나중에 추가)
    icon: string;      // 간단한 이모지
}

export type ItemCategory = 'Accessory' | 'Tool' | 'Skin' | 'Background';

export interface ShopItem {
    id: string;
    name: string;
    category: ItemCategory;
    price: number; // in QP
    description: string;
    effect?: {
        type: 'XP_BOOST';
        value: number; // e.g., 0.05 for 5% boost
    };
    icon?: string;
}

export interface Quest {
    id: string;
    title: string;
    isCompleted: boolean;
    baseXp: number; // 기본 제공 경험치
}

export interface UserState {
    level: number;
    xp: number;
    qp: number; // Quest Points
    equippedItems: {
        Accessory?: string; // item id
        Tool?: string;
        Skin?: string;
        Background?: string;
    };
    unlockedItems: string[]; // array of item ids
    energy: number; // stamina (max 5)
    lastEnergyUpdate: number; // timestamp
}
