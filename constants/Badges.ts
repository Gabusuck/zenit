// Badge Definitions
export const BADGE_DEFINITIONS = [
    {
        id: 'games_played',
        category: 'Participation',
        tiers: [
            { level: 1, name: 'Estreante', description: 'Completaste o teu 1º jogo.', icon: 'baby', color: '#8BC34A', target: 1 },
            { level: 2, name: 'Habitué', description: 'Jogaste 10 jogos.', icon: 'running', color: '#FF9800', target: 10 },
            { level: 3, name: 'Viciado', description: 'Jogaste 50 jogos!', icon: 'fire-alt', color: '#F44336', target: 50 },
            { level: 4, name: 'Lenda do Relvado', description: 'Jogaste 100 jogos!', icon: 'trophy', color: '#FFD700', target: 100 },
        ]
    },
    {
        id: 'games_organized',
        category: 'Organization',
        tiers: [
            { level: 1, name: 'Organizador', description: 'Organizaste o teu 1º jogo.', icon: 'clipboard-list', color: '#4CAF50', target: 1 },
            { level: 2, name: 'Capitão', description: 'Organizaste 10 jogos.', icon: 'crown', color: '#2196F3', target: 10 },
            { level: 3, name: 'Presidente', description: 'Organizaste 50 jogos!', icon: 'dragon', color: '#9C27B0', target: 50 },
        ]
    },
    {
        id: 'attendance',
        category: 'Reliability',
        tiers: [
            { level: 1, name: 'Comprometido', description: 'Mantiveste 100% de assiduidade em 5 jogos.', icon: 'check-circle', color: '#009688', target: 5 }, // Special logic needed
        ]
    },
    {
        id: 'streak',
        category: 'Streak',
        tiers: [
            { level: 1, name: 'Aquecimento', description: 'Jogaste 2 semanas seguidas.', icon: 'burn', color: '#FF5722', target: 2 },
            { level: 2, name: 'Maratonista', description: 'Jogaste 4 semanas seguidas!', icon: 'bolt', color: '#FFC107', target: 4 },
        ]
    },
    {
        id: 'loyalty',
        category: 'Loyalty',
        tiers: [
            { level: 1, name: 'Membro', description: 'Conta criada há 1 mês.', icon: 'id-card', color: '#795548', target: 1 },
            { level: 2, name: 'Veterano', description: 'Conta criada há 6 meses.', icon: 'medal', color: '#607D8B', target: 6 },
            { level: 3, name: 'Fundador', description: 'Conta criada há 1 ano!', icon: 'chess-king', color: '#FFD700', target: 12 },
        ]
    },
    {
        id: 'profile_completion',
        category: 'Identity',
        tiers: [
            { level: 1, name: 'Identidade', description: 'Perfil completo (Foto, Posição, Pé, Idade).', icon: 'fingerprint', color: '#9C27B0', target: 100 },
        ]
    }
];

// Helper to get flat list for display if needed, but logic should handle tiers
export const BADGES: any[] = []; // Deprecated, use definitions
