import { TierDef, ShopItem } from '../types';

export const TIERS: TierDef[] = [
    { id: 1, name: '깨진 알', minLevel: 1, maxLevel: 4, description: '금이 간 껍질 사이로 눈만 빼꼼 내민 모습.', icon: '🐣' },
    { id: 2, name: '공부 병아리', minLevel: 5, maxLevel: 9, description: '작은 연필을 발로 쥐고 있는 귀여운 모습.', icon: '🐥' },
    { id: 3, name: '열공 닭', minLevel: 10, maxLevel: 19, description: '교복 조끼를 입고 안경을 쓴 성숙한 모습.', icon: '🐔' },
    { id: 4, name: '학문 부엉이', minLevel: 20, maxLevel: 39, description: '학사모를 쓰고 두꺼운 책 위에 앉아 있는 모습.', icon: '🦉' },
    { id: 5, name: '전설의 불사조', minLevel: 40, maxLevel: 999, description: '온몸이 지혜의 불꽃으로 타오르는 마스터.', icon: '🔥' },
];

export const SHOP_ITEMS: ShopItem[] = [
    {
        id: 'acc_darkcircle',
        name: '퀭한 다크써클',
        category: 'Accessory',
        price: 200,
        description: '"어제 좀 달렸나?" 웃음 포인트.',
        icon: '🐼'
    },
    {
        id: 'acc_headband',
        name: '필승 머리띠',
        category: 'Accessory',
        price: 500,
        description: '착용 시 캐릭터 주변에 작은 불꽃 이펙트.',
        icon: '🪢'
    },
    {
        id: 'tool_goldpencil',
        name: '황금 연필',
        category: 'Tool',
        price: 1000,
        description: '퀘스트 완료 시 XP 획득량 5% 영구 보너스.',
        effect: { type: 'XP_BOOST', value: 0.05 },
        icon: '✏️'
    },
    {
        id: 'skin_college',
        name: '과잠 (College Jacket)',
        category: 'Skin',
        price: 1500,
        description: '캐릭터에게 대학 과잠 스타일 옷 입히기.',
        icon: '🧥'
    },
    {
        id: 'bg_studyroom',
        name: '독서실 1인실 테마',
        category: 'Background',
        price: 2000,
        description: '메인 대시보드 배경을 어둡고 집중되는 톤으로 변경.',
        icon: '🌙'
    }
];

export const INITIAL_QUESTS = [
    { id: 'q1', title: '1시간 집중해서 책 읽기', isCompleted: false, baseXp: 50 },
    { id: 'q2', title: '수학 문제 5문제 풀기', isCompleted: false, baseXp: 60 },
    { id: 'q3', title: '오늘 배운 내용 복습하기', isCompleted: false, baseXp: 70 },
];
