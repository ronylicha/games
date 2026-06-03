import {
  Direction,
  EntityKind,
  Fighter,
  LevelDefinition,
  PowerUp,
  PowerUpKind,
  StreetBrawlInput,
  StreetBrawlModel,
  StreetBrawlSnapshot,
} from './types';

const stageWidth = 960;
const laneTop = 258;
const laneBottom = 456;
const levelEndX = 1690;

const enemyStats: Record<EntityKind, { hp: number; speed: number; width: number; height: number; damage: number; range: number }> = {
  player: { hp: 120, speed: 230, width: 54, height: 82, damage: 12, range: 68 },
  grunt: { hp: 34, speed: 96, width: 48, height: 74, damage: 8, range: 44 },
  runner: { hp: 26, speed: 142, width: 44, height: 70, damage: 7, range: 42 },
  bruiser: { hp: 74, speed: 74, width: 60, height: 88, damage: 14, range: 48 },
  blocker: { hp: 52, speed: 82, width: 54, height: 78, damage: 10, range: 42 },
  thrower: { hp: 36, speed: 78, width: 46, height: 72, damage: 9, range: 168 },
  blade: { hp: 44, speed: 112, width: 48, height: 76, damage: 12, range: 58 },
  drone: { hp: 32, speed: 132, width: 48, height: 50, damage: 10, range: 94 },
  boss: { hp: 180, speed: 96, width: 72, height: 100, damage: 18, range: 78 },
};

const weaponStats = {
  none: { damage: 1, range: 0, label: '' },
  knife: { damage: 1.24, range: 16, label: 'Couteau' },
  pipe: { damage: 1.34, range: 26, label: 'Tuyau' },
  bat: { damage: 1.48, range: 34, label: 'Batte' },
};

export const emptyStreetBrawlInput: StreetBrawlInput = {
  left: false,
  right: false,
  up: false,
  down: false,
  attack: false,
  heavy: false,
  dash: false,
  fury: false,
};

export function createStreetBrawlModel(level: LevelDefinition): StreetBrawlModel {
  return {
    status: 'ready',
    level,
    player: createFighter('player', 'player', 120, 360),
    enemies: [],
    powerUps: [],
    cameraX: 0,
    lockX: null,
    nextId: 1,
    score: 0,
    time: 0,
    defeated: 0,
    rank: 'C',
    message: level.beat,
    waveIndex: 0,
    hitStop: 0,
    screenShake: 0,
    lastInput: emptyStreetBrawlInput,
  };
}

export function startStreetBrawl(model: StreetBrawlModel) {
  model.status = 'running';
  model.message = model.level.beat;
}

export function stepStreetBrawl(model: StreetBrawlModel, input: StreetBrawlInput, delta: number) {
  if (model.status !== 'running') {
    model.lastInput = input;
    return;
  }

  const dt = model.hitStop > 0 ? Math.min(delta, 0.008) : Math.min(delta, 0.032);
  model.hitStop = Math.max(0, model.hitStop - delta);
  model.screenShake = Math.max(0, model.screenShake - delta * 34);
  model.time += dt;

  tickFighter(model.player, dt);
  model.enemies.forEach((enemy) => tickFighter(enemy, dt));
  handlePlayerInput(model, input, dt);
  triggerWaves(model);
  stepEnemies(model, dt);
  collectPowerUps(model, dt);
  removeDefeated(model);
  updateCamera(model);
  updateRank(model);
  checkEndState(model);
  model.lastInput = { ...input };
}

export function toStreetBrawlSnapshot(model: StreetBrawlModel): StreetBrawlSnapshot {
  return {
    status: model.status,
    level: model.level,
    player: { ...model.player },
    enemies: model.enemies.map((enemy) => ({ ...enemy })),
    powerUps: model.powerUps.map((powerUp) => ({ ...powerUp })),
    cameraX: model.cameraX,
    score: model.score,
    time: model.time,
    defeated: model.defeated,
    rank: model.rank,
    message: model.message,
    screenShake: model.screenShake,
  };
}

function createFighter(id: string, kind: EntityKind, x: number, y: number): Fighter {
  const stats = enemyStats[kind];
  return {
    id,
    kind,
    x,
    y,
    width: stats.width,
    height: stats.height,
    hp: stats.hp,
    maxHp: stats.hp,
    fury: kind === 'player' ? 42 : 0,
    facing: 1,
    action: 'idle',
    actionTimer: 0,
    attackCooldown: 0,
    invulnerableTimer: 0,
    stunTimer: 0,
    speedBoostTimer: 0,
    strengthTimer: 0,
    shieldTimer: 0,
    weaponTimer: 0,
    weaponKind: 'none',
    combo: 0,
    scoreMultiplierTimer: 0,
    aiTimer: 0,
  };
}

function tickFighter(fighter: Fighter, delta: number) {
  fighter.actionTimer = Math.max(0, fighter.actionTimer - delta);
  fighter.attackCooldown = Math.max(0, fighter.attackCooldown - delta);
  fighter.invulnerableTimer = Math.max(0, fighter.invulnerableTimer - delta);
  fighter.stunTimer = Math.max(0, fighter.stunTimer - delta);
  fighter.speedBoostTimer = Math.max(0, fighter.speedBoostTimer - delta);
  fighter.strengthTimer = Math.max(0, fighter.strengthTimer - delta);
  fighter.shieldTimer = Math.max(0, fighter.shieldTimer - delta);
  fighter.weaponTimer = Math.max(0, fighter.weaponTimer - delta);
  if (fighter.weaponTimer <= 0) {
    fighter.weaponKind = 'none';
  }
  fighter.scoreMultiplierTimer = Math.max(0, fighter.scoreMultiplierTimer - delta);
  fighter.aiTimer = Math.max(0, fighter.aiTimer - delta);
  if (fighter.actionTimer <= 0 && fighter.hp > 0) {
    fighter.action = fighter.stunTimer > 0 ? 'hurt' : 'idle';
  }
}

function handlePlayerInput(model: StreetBrawlModel, input: StreetBrawlInput, delta: number) {
  const player = model.player;
  if (player.hp <= 0 || player.stunTimer > 0) {
    return;
  }

  if (pressed(input.fury, model.lastInput.fury) && player.fury >= 100) {
    player.fury = 0;
    player.action = 'fury';
    player.actionTimer = 0.42;
    model.hitStop = 0.08;
    model.screenShake = 10;
    hitEnemies(model, 92, 34, 1.4);
    return;
  }

  if (pressed(input.heavy, model.lastInput.heavy) && player.attackCooldown <= 0) {
    player.action = 'heavy';
    player.actionTimer = 0.26;
    player.attackCooldown = 0.42;
    hitEnemies(model, 86, 24, 1.15);
    return;
  }

  if (pressed(input.attack, model.lastInput.attack) && player.attackCooldown <= 0) {
    player.combo = player.combo >= 3 ? 1 : player.combo + 1;
    player.action = 'attack';
    player.actionTimer = 0.18;
    player.attackCooldown = player.combo === 3 ? 0.28 : 0.18;
    hitEnemies(model, 66 + player.combo * 8, 12 + player.combo * 3, 1);
    return;
  }

  const dx = Number(input.right) - Number(input.left);
  const dy = Number(input.down) - Number(input.up);
  const dash = input.dash ? 1.45 : 1;
  const boost = player.speedBoostTimer > 0 ? 1.35 : 1;
  const speed = enemyStats.player.speed * dash * boost;
  if (dx !== 0 || dy !== 0) {
    const length = Math.max(1, Math.hypot(dx, dy));
    const arenaMin = model.lockX === null ? 50 : model.lockX + 44;
    const arenaMax = model.lockX === null ? levelEndX + 60 : model.lockX + stageWidth - 76;
    player.x = clamp(player.x + (dx / length) * speed * delta, arenaMin, arenaMax);
    player.y = clamp(player.y + (dy / length) * speed * delta, laneTop, laneBottom);
    player.facing = dx < 0 ? -1 : dx > 0 ? 1 : player.facing;
    player.action = 'walk';
  }
}

function hitEnemies(model: StreetBrawlModel, range: number, baseDamage: number, force: number) {
  const player = model.player;
  const weapon = weaponStats[player.weaponKind];
  let hit = false;
  for (const enemy of model.enemies) {
    if (enemy.hp <= 0 || enemy.invulnerableTimer > 0) {
      continue;
    }
    const inFront = player.facing === 1 ? enemy.x >= player.x - 12 : enemy.x <= player.x + 12;
    const xDistance = Math.abs(enemy.x - player.x);
    const yDistance = Math.abs(enemy.y - player.y);
    if (inFront && xDistance <= range + weapon.range && yDistance <= 42) {
      const damage = Math.round(baseDamage * weapon.damage * (player.strengthTimer > 0 ? 1.45 : 1));
      damageFighter(enemy, damage, player.facing, force);
      player.fury = Math.min(100, player.fury + 8);
      model.score += Math.round(damage * (player.scoreMultiplierTimer > 0 ? 2 : 1));
      model.hitStop = 0.045;
      model.screenShake = Math.max(model.screenShake, 4 * force);
      hit = true;
    }
  }
  if (!hit) {
    player.combo = 0;
  }
}

function damageFighter(fighter: Fighter, amount: number, direction: Direction, force: number) {
  fighter.hp = Math.max(0, fighter.hp - amount);
  fighter.x += direction * 18 * force;
  fighter.stunTimer = fighter.hp <= 0 ? 0.45 : 0.18 * force;
  fighter.invulnerableTimer = 0.08;
  fighter.action = fighter.hp <= 0 ? 'down' : 'hurt';
  fighter.actionTimer = fighter.hp <= 0 ? 0.45 : 0.18;
}

function triggerWaves(model: StreetBrawlModel) {
  const wave = model.level.waves[model.waveIndex];
  if (!wave || model.player.x < wave.at) {
    return;
  }

  if (model.enemies.some((enemy) => enemy.hp > 0)) {
    return;
  }

  model.lockX = wave.lockCamera ? Math.max(0, wave.at - 260) : null;
  model.message = model.level.bossName && wave === model.level.waves[model.level.waves.length - 1] ? model.level.bossName : 'Nettoie la zone';
  for (const spawn of wave.enemies) {
    for (let index = 0; index < spawn.count; index += 1) {
      const x = wave.at + 210 + index * 34 + (spawn.kind === 'boss' ? 88 : 0);
      const y = laneTop + 28 + ((index * 47 + model.level.id * 13) % Math.floor(laneBottom - laneTop - 20));
      const enemy = createFighter(`e${model.nextId++}`, spawn.kind, clamp(x, wave.at + 90, wave.at + stageWidth - 96), y);
      scaleEnemy(enemy, model.level.id);
      model.enemies.push(enemy);
    }
  }
  model.waveIndex += 1;
}

function stepEnemies(model: StreetBrawlModel, delta: number) {
  for (const enemy of model.enemies) {
    if (enemy.hp <= 0 || enemy.stunTimer > 0) {
      continue;
    }

    const player = model.player;
    const stats = enemyStats[enemy.kind];
    enemy.facing = enemy.x > player.x ? -1 : 1;

    if (enemy.action === 'windup' && enemy.actionTimer <= 0.08 && enemy.attackCooldown <= 0.08) {
      enemy.action = 'attack';
      enemy.actionTimer = 0.18;
      enemy.attackCooldown = 0.72 + Math.random() * 0.45;
      if (Math.abs(enemy.x - player.x) < stats.range && Math.abs(enemy.y - player.y) < 38) {
        const shielded = player.shieldTimer > 0;
        damageFighter(player, shielded ? Math.ceil(stats.damage * 0.35) : stats.damage, enemy.facing, 0.9);
        model.screenShake = Math.max(model.screenShake, 6);
      }
      continue;
    }

    if (enemy.attackCooldown <= 0 && Math.abs(enemy.x - player.x) < stats.range && Math.abs(enemy.y - player.y) < 34) {
      enemy.action = 'windup';
      enemy.actionTimer = enemy.kind === 'boss' ? 0.34 : 0.22;
      enemy.attackCooldown = enemy.actionTimer;
      continue;
    }

    const desiredY = player.y + (Number(enemy.id.replace(/\D/g, '') || 0) % 3 - 1) * 24;
    const dx = player.x - enemy.x - enemy.facing * 34;
    const dy = desiredY - enemy.y;
    const distance = Math.max(1, Math.hypot(dx, dy));
    const speed = stats.speed * difficultySpeed(model.level.id) * (enemy.kind === 'boss' && enemy.hp < enemy.maxHp * 0.45 ? 1.24 : 1);
    enemy.x += (dx / distance) * speed * delta;
    enemy.y = clamp(enemy.y + (dy / distance) * speed * delta, laneTop, laneBottom);
    enemy.action = 'walk';
  }
}

function collectPowerUps(model: StreetBrawlModel, delta: number) {
  model.powerUps = model.powerUps
    .map((powerUp) => ({ ...powerUp, ttl: powerUp.ttl - delta }))
    .filter((powerUp) => powerUp.ttl > 0);

  for (const powerUp of model.powerUps) {
    if (Math.abs(powerUp.x - model.player.x) <= 34 && Math.abs(powerUp.y - model.player.y) <= 34) {
      applyPowerUp(model, powerUp.kind);
      powerUp.ttl = 0;
    }
  }
}

function applyPowerUp(model: StreetBrawlModel, kind: PowerUpKind) {
  const player = model.player;
  if (kind === 'health') {
    player.hp = Math.min(player.maxHp, player.hp + 34);
  }
  if (kind === 'fury') {
    player.fury = Math.min(100, player.fury + 45);
  }
  if (kind === 'strength') {
    player.strengthTimer = 9;
  }
  if (kind === 'speed') {
    player.speedBoostTimer = 9;
  }
  if (kind === 'shield') {
    player.shieldTimer = 11;
  }
  if (kind === 'score') {
    player.scoreMultiplierTimer = 12;
  }
  if (kind === 'knife' || kind === 'pipe' || kind === 'bat') {
    player.weaponKind = kind;
    player.weaponTimer = kind === 'bat' ? 14 : kind === 'pipe' ? 13 : 11;
  }
  model.score += 80;
  model.message = powerUpLabel(kind);
}

function removeDefeated(model: StreetBrawlModel) {
  const defeated = model.enemies.filter((enemy) => enemy.hp <= 0 && enemy.actionTimer <= 0);
  if (defeated.length === 0) {
    return;
  }

  for (const enemy of defeated) {
    model.defeated += 1;
    model.score += enemy.kind === 'boss' ? 1200 : 120;
    if (Math.random() < (enemy.kind === 'boss' ? 1 : 0.22)) {
      model.powerUps.push(createPowerUp(model, enemy.x, enemy.y));
    }
  }
  model.enemies = model.enemies.filter((enemy) => enemy.hp > 0 || enemy.actionTimer > 0);

  if (model.lockX !== null && model.enemies.every((enemy) => enemy.hp <= 0)) {
    model.lockX = null;
    model.message = 'Avance vers la prochaine rue';
  }
}

function createPowerUp(model: StreetBrawlModel, x: number, y: number): PowerUp {
  const kinds: PowerUpKind[] = ['health', 'fury', 'strength', 'speed', 'shield', 'score', 'knife', 'pipe', 'bat'];
  return {
    id: `p${model.nextId++}`,
    kind: kinds[(model.level.id + model.nextId) % kinds.length],
    x,
    y,
    ttl: 12,
  };
}

function updateCamera(model: StreetBrawlModel) {
  const target = model.lockX ?? clamp(model.player.x - 280, 0, levelEndX - stageWidth + 180);
  model.cameraX += (target - model.cameraX) * 0.14;
}

function updateRank(model: StreetBrawlModel) {
  const score = model.score + model.defeated * 30 - Math.floor(model.time * 2) + Math.max(0, model.player.hp) * 5;
  model.rank = score > 8600 ? 'S' : score > 5600 ? 'A' : score > 3000 ? 'B' : 'C';
}

function scaleEnemy(enemy: Fighter, levelId: number) {
  const hpScale = 1 + (levelId - 1) * 0.035;
  const bossBonus = enemy.kind === 'boss' ? 1 + Math.floor(levelId / 10) * 0.18 : 1;
  enemy.maxHp = Math.round(enemy.maxHp * hpScale * bossBonus);
  enemy.hp = enemy.maxHp;
  enemy.attackCooldown = Math.max(0, 0.35 - levelId * 0.004);
}

function difficultySpeed(levelId: number) {
  return 1 + Math.min(0.42, (levelId - 1) * 0.009);
}

function checkEndState(model: StreetBrawlModel) {
  if (model.player.hp <= 0) {
    model.status = 'gameover';
    model.message = 'K.O.';
    return;
  }

  if (model.waveIndex >= model.level.waves.length && model.enemies.every((enemy) => enemy.hp <= 0) && model.player.x >= levelEndX) {
    model.status = 'victory';
    model.message = model.level.id >= 50 ? 'Vesper City respire enfin.' : 'Niveau termine';
  }
}

function powerUpLabel(kind: PowerUpKind) {
  switch (kind) {
    case 'health':
      return 'Soin';
    case 'fury':
      return 'Fury +';
    case 'strength':
      return 'Force +';
    case 'speed':
      return 'Vitesse +';
    case 'shield':
      return 'Bouclier';
    case 'score':
      return 'Score x2';
    case 'knife':
      return weaponStats.knife.label;
    case 'pipe':
      return weaponStats.pipe.label;
    case 'bat':
      return weaponStats.bat.label;
  }
}

function pressed(current: boolean, previous: boolean) {
  return current && !previous;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}
