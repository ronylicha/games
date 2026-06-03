import { DistrictId, EntityKind, LevelDefinition, LevelWave } from './types';

const districts: { id: DistrictId; label: string; palette: string; beats: string[]; boss: string }[] = [
  {
    id: 'downtown',
    label: 'Downtown',
    palette: 'neon',
    boss: 'Razor Vic',
    beats: ['Les vitrines tombent une a une.', 'Un informateur parle du reseau sous la ville.', 'La police abandonne le quartier.'],
  },
  {
    id: 'docks',
    label: 'Docks',
    palette: 'harbor',
    boss: 'Mara Tide',
    beats: ['Les containers cachent les armes.', 'Les cargos de nuit ravitaillent le gang.', 'La pluie couvre les sirenes.'],
  },
  {
    id: 'factory',
    label: 'Iron Yard',
    palette: 'rust',
    boss: 'Brass Knuckle',
    beats: ['Les chaines d assemblage tournent encore.', 'Les drones protegent les lignes de production.', 'La casse avale les preuves.'],
  },
  {
    id: 'uptown',
    label: 'Uptown',
    palette: 'gold',
    boss: 'Velvet Mae',
    beats: ['Les tours brillent au-dessus du chaos.', 'Les gardes prives bloquent les passages.', 'Le maire apparait dans les cameras.'],
  },
  {
    id: 'citadel',
    label: 'Citadel',
    palette: 'violet',
    boss: 'Director Null',
    beats: ['Le signal pirate couvre Vesper City.', 'Les lieutenants se replient vers le sommet.', 'La tour diffuse la peur en direct.'],
  },
];

const commonKinds: EntityKind[] = ['grunt', 'runner', 'blocker', 'thrower', 'blade', 'bruiser'];

export const STREET_BRAWL_LEVELS: LevelDefinition[] = Array.from({ length: 50 }, (_, index) => {
  const id = index + 1;
  const districtIndex = Math.floor(index / 10);
  const district = districts[districtIndex];
  const local = (index % 10) + 1;
  const bossLevel = local === 10;
  const miniBossLevel = local === 5;
  const difficulty = 1 + Math.floor(index / 5);
  const waveCount = bossLevel ? 4 : miniBossLevel ? 4 : 3;
  const waves: LevelWave[] = Array.from({ length: waveCount }, (_, waveIndex) => {
    const at = 340 + waveIndex * 330;
    const enemyPool = commonKinds.slice(0, Math.min(commonKinds.length, 2 + districtIndex + waveIndex));
    const first = enemyPool[(id + waveIndex) % enemyPool.length];
    const second = enemyPool[(id + waveIndex + 2) % enemyPool.length];
    const enemies = [
      { kind: first, count: Math.min(4, 2 + Math.floor((difficulty + waveIndex) / 3)) },
      { kind: second, count: Math.min(3, 1 + Math.floor((difficulty + waveIndex) / 4)) },
    ];

    if (districtIndex >= 2 && waveIndex === waveCount - 2) {
      enemies.push({ kind: 'drone', count: 1 });
    }

    if ((bossLevel || miniBossLevel) && waveIndex === waveCount - 1) {
      enemies.push({ kind: 'boss', count: 1 });
    }

    return { at, enemies, lockCamera: true };
  });

  return {
    id,
    title: `${district.label} ${local}`,
    district: district.id,
    palette: district.palette,
    beat: district.beats[index % district.beats.length],
    bossName: bossLevel ? district.boss : miniBossLevel ? `${district.boss} lieutenant` : undefined,
    waves,
  };
});

export function getStreetBrawlLevel(level: number) {
  return STREET_BRAWL_LEVELS[Math.max(0, Math.min(STREET_BRAWL_LEVELS.length - 1, level - 1))];
}
