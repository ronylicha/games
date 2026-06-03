export type StreetBrawlStatus = 'loading' | 'ready' | 'running' | 'paused' | 'victory' | 'gameover';

export type Direction = -1 | 1;

export type EntityKind = 'player' | 'grunt' | 'runner' | 'bruiser' | 'blocker' | 'thrower' | 'blade' | 'drone' | 'boss';

export type EntityAction = 'idle' | 'walk' | 'attack' | 'heavy' | 'fury' | 'hurt' | 'down' | 'windup';

export type PowerUpKind = 'health' | 'fury' | 'strength' | 'speed' | 'shield' | 'score' | 'knife' | 'pipe' | 'bat';

export type DistrictId = 'downtown' | 'docks' | 'factory' | 'uptown' | 'citadel';

export type StreetBrawlInput = {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
  attack: boolean;
  heavy: boolean;
  dash: boolean;
  fury: boolean;
};

export type Fighter = {
  id: string;
  kind: EntityKind;
  x: number;
  y: number;
  width: number;
  height: number;
  hp: number;
  maxHp: number;
  fury: number;
  facing: Direction;
  action: EntityAction;
  actionTimer: number;
  attackCooldown: number;
  invulnerableTimer: number;
  stunTimer: number;
  speedBoostTimer: number;
  strengthTimer: number;
  shieldTimer: number;
  weaponTimer: number;
  weaponKind: 'none' | 'knife' | 'pipe' | 'bat';
  combo: number;
  scoreMultiplierTimer: number;
  aiTimer: number;
};

export type PowerUp = {
  id: string;
  kind: PowerUpKind;
  x: number;
  y: number;
  ttl: number;
};

export type SpawnSpec = {
  kind: EntityKind;
  count: number;
};

export type LevelWave = {
  at: number;
  enemies: SpawnSpec[];
  lockCamera: boolean;
};

export type LevelDefinition = {
  id: number;
  title: string;
  district: DistrictId;
  beat: string;
  palette: string;
  waves: LevelWave[];
  bossName?: string;
};

export type StreetBrawlModel = {
  status: StreetBrawlStatus;
  level: LevelDefinition;
  player: Fighter;
  enemies: Fighter[];
  powerUps: PowerUp[];
  cameraX: number;
  lockX: number | null;
  nextId: number;
  score: number;
  time: number;
  defeated: number;
  rank: 'C' | 'B' | 'A' | 'S';
  message: string;
  waveIndex: number;
  hitStop: number;
  screenShake: number;
  lastInput: StreetBrawlInput;
};

export type StreetBrawlSnapshot = Pick<
  StreetBrawlModel,
  | 'status'
  | 'level'
  | 'player'
  | 'enemies'
  | 'powerUps'
  | 'cameraX'
  | 'score'
  | 'time'
  | 'defeated'
  | 'rank'
  | 'message'
  | 'screenShake'
>;

export type LevelResult = {
  bestScore: number;
  bestRank: 'C' | 'B' | 'A' | 'S';
  bestTime: number;
};

export type StreetBrawlProgress = {
  currentLevel: number;
  highestUnlockedLevel: number;
  completedLevels: Record<string, LevelResult>;
};
