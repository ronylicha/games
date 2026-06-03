import { useEffect, useMemo, useRef, useState } from 'react';
import { Image, ImageSource } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import * as ScreenOrientation from 'expo-screen-orientation';
import { Platform, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  createStreetBrawlModel,
  emptyStreetBrawlInput,
  startStreetBrawl,
  stepStreetBrawl,
  toStreetBrawlSnapshot,
} from '@/game/street-brawl/engine';
import { getStreetBrawlLevel, STREET_BRAWL_LEVELS } from '@/game/street-brawl/levels';
import {
  initialStreetBrawlProgress,
  loadStreetBrawlProgress,
  saveCurrentStreetBrawlLevel,
  saveStreetBrawlLevelResult,
} from '@/game/street-brawl/progression';
import { EntityKind, Fighter, PowerUpKind, StreetBrawlInput, StreetBrawlProgress, StreetBrawlSnapshot } from '@/game/street-brawl/types';

const stageWidth = 960;
const stageHeight = 540;
const backgroundWidth = 2400;
const keyMap: Record<string, keyof StreetBrawlInput> = {
  ArrowLeft: 'left',
  a: 'left',
  A: 'left',
  ArrowRight: 'right',
  d: 'right',
  D: 'right',
  ArrowUp: 'up',
  w: 'up',
  W: 'up',
  ArrowDown: 'down',
  s: 'down',
  S: 'down',
  j: 'attack',
  J: 'attack',
  k: 'heavy',
  K: 'heavy',
  l: 'fury',
  L: 'fury',
  Shift: 'dash',
  ' ': 'dash',
};

const backgrounds = {
  downtown: require('@/assets/game/street-brawl/bg-downtown.png'),
  docks: require('@/assets/game/street-brawl/bg-docks.png'),
  factory: require('@/assets/game/street-brawl/bg-factory.png'),
  uptown: require('@/assets/game/street-brawl/bg-uptown.png'),
  citadel: require('@/assets/game/street-brawl/bg-citadel.png'),
} satisfies Record<string, ImageSource>;

const playerSprites = {
  idle: require('@/assets/game/street-brawl/player-idle.png'),
  walk: require('@/assets/game/street-brawl/player-walk.png'),
  attack: require('@/assets/game/street-brawl/player-attack.png'),
  heavy: require('@/assets/game/street-brawl/player-heavy.png'),
  fury: require('@/assets/game/street-brawl/player-fury.png'),
  hurt: require('@/assets/game/street-brawl/player-hurt.png'),
  down: require('@/assets/game/street-brawl/player-down.png'),
} satisfies Record<string, ImageSource>;

const enemySprites: Record<EntityKind, Record<string, ImageSource>> = {
  player: playerSprites,
  grunt: {
    idle: require('@/assets/game/street-brawl/grunt-idle.png'),
    walk: require('@/assets/game/street-brawl/grunt-walk.png'),
    attack: require('@/assets/game/street-brawl/grunt-attack.png'),
    heavy: require('@/assets/game/street-brawl/grunt-attack.png'),
    fury: require('@/assets/game/street-brawl/grunt-attack.png'),
    hurt: require('@/assets/game/street-brawl/grunt-hurt.png'),
    down: require('@/assets/game/street-brawl/grunt-down.png'),
  },
  runner: {
    idle: require('@/assets/game/street-brawl/runner-idle.png'),
    walk: require('@/assets/game/street-brawl/runner-walk.png'),
    attack: require('@/assets/game/street-brawl/runner-attack.png'),
    heavy: require('@/assets/game/street-brawl/runner-attack.png'),
    fury: require('@/assets/game/street-brawl/runner-attack.png'),
    hurt: require('@/assets/game/street-brawl/runner-hurt.png'),
    down: require('@/assets/game/street-brawl/runner-down.png'),
  },
  bruiser: {
    idle: require('@/assets/game/street-brawl/bruiser-idle.png'),
    walk: require('@/assets/game/street-brawl/bruiser-walk.png'),
    attack: require('@/assets/game/street-brawl/bruiser-attack.png'),
    heavy: require('@/assets/game/street-brawl/bruiser-attack.png'),
    fury: require('@/assets/game/street-brawl/bruiser-attack.png'),
    hurt: require('@/assets/game/street-brawl/bruiser-hurt.png'),
    down: require('@/assets/game/street-brawl/bruiser-down.png'),
  },
  blocker: {
    idle: require('@/assets/game/street-brawl/blocker-idle.png'),
    walk: require('@/assets/game/street-brawl/blocker-walk.png'),
    attack: require('@/assets/game/street-brawl/blocker-attack.png'),
    heavy: require('@/assets/game/street-brawl/blocker-attack.png'),
    fury: require('@/assets/game/street-brawl/blocker-attack.png'),
    hurt: require('@/assets/game/street-brawl/blocker-hurt.png'),
    down: require('@/assets/game/street-brawl/blocker-down.png'),
  },
  thrower: {
    idle: require('@/assets/game/street-brawl/thrower-idle.png'),
    walk: require('@/assets/game/street-brawl/thrower-walk.png'),
    attack: require('@/assets/game/street-brawl/thrower-attack.png'),
    heavy: require('@/assets/game/street-brawl/thrower-attack.png'),
    fury: require('@/assets/game/street-brawl/thrower-attack.png'),
    hurt: require('@/assets/game/street-brawl/thrower-hurt.png'),
    down: require('@/assets/game/street-brawl/thrower-down.png'),
  },
  blade: {
    idle: require('@/assets/game/street-brawl/blade-idle.png'),
    walk: require('@/assets/game/street-brawl/blade-walk.png'),
    attack: require('@/assets/game/street-brawl/blade-attack.png'),
    heavy: require('@/assets/game/street-brawl/blade-attack.png'),
    fury: require('@/assets/game/street-brawl/blade-attack.png'),
    hurt: require('@/assets/game/street-brawl/blade-hurt.png'),
    down: require('@/assets/game/street-brawl/blade-down.png'),
  },
  drone: {
    idle: require('@/assets/game/street-brawl/drone-idle.png'),
    walk: require('@/assets/game/street-brawl/drone-walk.png'),
    attack: require('@/assets/game/street-brawl/drone-attack.png'),
    heavy: require('@/assets/game/street-brawl/drone-attack.png'),
    fury: require('@/assets/game/street-brawl/drone-attack.png'),
    hurt: require('@/assets/game/street-brawl/drone-hurt.png'),
    down: require('@/assets/game/street-brawl/drone-down.png'),
  },
  boss: {
    idle: require('@/assets/game/street-brawl/boss-idle.png'),
    walk: require('@/assets/game/street-brawl/boss-walk.png'),
    attack: require('@/assets/game/street-brawl/boss-attack.png'),
    heavy: require('@/assets/game/street-brawl/boss-attack.png'),
    fury: require('@/assets/game/street-brawl/boss-attack.png'),
    hurt: require('@/assets/game/street-brawl/boss-hurt.png'),
    down: require('@/assets/game/street-brawl/boss-down.png'),
  },
};

const powerSprites: Record<PowerUpKind, ImageSource> = {
  health: require('@/assets/game/street-brawl/power-health.png'),
  fury: require('@/assets/game/street-brawl/power-fury.png'),
  strength: require('@/assets/game/street-brawl/power-strength.png'),
  speed: require('@/assets/game/street-brawl/power-speed.png'),
  shield: require('@/assets/game/street-brawl/power-shield.png'),
  score: require('@/assets/game/street-brawl/power-score.png'),
  knife: require('@/assets/game/street-brawl/power-knife.png'),
  pipe: require('@/assets/game/street-brawl/power-pipe.png'),
  bat: require('@/assets/game/street-brawl/power-bat.png'),
};

export function StreetBrawlGame() {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [progress, setProgress] = useState<StreetBrawlProgress>(initialStreetBrawlProgress);
  const [selectedLevel, setSelectedLevel] = useState(1);
  const [snapshot, setSnapshot] = useState<StreetBrawlSnapshot>(() => toStreetBrawlSnapshot(createStreetBrawlModel(getStreetBrawlLevel(1))));
  const modelRef = useRef(createStreetBrawlModel(getStreetBrawlLevel(1)));
  const inputRef = useRef<StreetBrawlInput>({ ...emptyStreetBrawlInput });
  const rafRef = useRef<number | null>(null);
  const lastTimeRef = useRef(0);
  const savedResultRef = useRef<string | null>(null);

  const isWeb = Platform.OS === 'web';
  const isPortraitMobile = !isWeb && height > width;
  const availableWidth = Math.max(320, width - insets.left - insets.right);
  const availableHeight = Math.max(240, height - insets.top - insets.bottom);
  const scale = Math.min(availableWidth / stageWidth, availableHeight / stageHeight);
  const stagePixelWidth = stageWidth * scale;
  const stagePixelHeight = stageHeight * scale;

  useEffect(() => {
    let mounted = true;
    loadStreetBrawlProgress()
      .then((stored) => {
        if (!mounted) {
          return;
        }
        setProgress(stored);
        setSelectedLevel(stored.currentLevel);
        replaceModel(stored.currentLevel);
      })
      .catch(() => undefined);

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (Platform.OS === 'web') {
      return;
    }

    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE).catch(() => undefined);
    return () => {
      ScreenOrientation.unlockAsync().catch(() => undefined);
    };
  }, []);

  useEffect(() => {
    function frame(now: number) {
      const last = lastTimeRef.current || now;
      lastTimeRef.current = now;
      stepStreetBrawl(modelRef.current, inputRef.current, (now - last) / 1000);
      setSnapshot(toStreetBrawlSnapshot(modelRef.current));
      rafRef.current = requestAnimationFrame(frame);
    }

    rafRef.current = requestAnimationFrame(frame);
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isWeb || typeof window === 'undefined') {
      return;
    }

    function onKey(event: KeyboardEvent, pressed: boolean) {
      const mapped = keyMap[event.key];
      if (!mapped) {
        return;
      }
      event.preventDefault();
      inputRef.current = { ...inputRef.current, [mapped]: pressed };
    }

    const onDown = (event: KeyboardEvent) => onKey(event, true);
    const onUp = (event: KeyboardEvent) => onKey(event, false);
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
    };
  }, [isWeb]);

  useEffect(() => {
    if (snapshot.status !== 'victory') {
      return;
    }

    const saveKey = `${snapshot.level.id}:${Math.floor(snapshot.time)}:${snapshot.score}`;
    if (savedResultRef.current === saveKey) {
      return;
    }
    savedResultRef.current = saveKey;
    saveStreetBrawlLevelResult(
      snapshot.level.id,
      {
        bestScore: snapshot.score,
        bestRank: snapshot.rank,
        bestTime: Math.max(1, Math.floor(snapshot.time)),
      },
      progress,
    )
      .then((next) => {
        setProgress(next);
        setSelectedLevel(next.currentLevel);
      })
      .catch(() => undefined);
  }, [progress, snapshot.level.id, snapshot.rank, snapshot.score, snapshot.status, snapshot.time]);

  const completedCount = useMemo(() => Object.keys(progress.completedLevels).length, [progress.completedLevels]);

  function replaceModel(level: number) {
    const nextModel = createStreetBrawlModel(getStreetBrawlLevel(level));
    modelRef.current = nextModel;
    inputRef.current = { ...emptyStreetBrawlInput };
    savedResultRef.current = null;
    setSnapshot(toStreetBrawlSnapshot(nextModel));
  }

  function selectLevel(level: number) {
    const nextLevel = Math.max(1, Math.min(progress.highestUnlockedLevel, level));
    setSelectedLevel(nextLevel);
    replaceModel(nextLevel);
  }

  function startSelectedLevel() {
    const model = createStreetBrawlModel(getStreetBrawlLevel(selectedLevel));
    startStreetBrawl(model);
    modelRef.current = model;
    inputRef.current = { ...emptyStreetBrawlInput };
    savedResultRef.current = null;
    setSnapshot(toStreetBrawlSnapshot(model));
    saveCurrentStreetBrawlLevel(selectedLevel, progress)
      .then(setProgress)
      .catch(() => undefined);
  }

  function nextLevel() {
    const level = Math.min(50, snapshot.level.id + 1);
    setSelectedLevel(level);
    replaceModel(level);
  }

  function setInput(key: keyof StreetBrawlInput, value: boolean) {
    inputRef.current = { ...inputRef.current, [key]: value };
    if (value && (key === 'attack' || key === 'heavy' || key === 'fury')) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
    }
  }

  return (
    <View style={styles.screen}>
      <SafeAreaView edges={['left', 'right', 'top', 'bottom']} style={styles.safeArea}>
        <View style={styles.topBar}>
          <Pressable style={styles.backButton} onPress={() => router.replace('/')}>
            <Text style={styles.backText}>Retour</Text>
          </Pressable>
          <View style={styles.campaignLine}>
            <Text style={styles.kicker}>Street Brawl</Text>
            <Text style={styles.campaignText}>
              Niveau {snapshot.level.id}/50 - {snapshot.level.title} - {completedCount} termines
            </Text>
          </View>
          <Text style={styles.rankBadge}>{snapshot.rank}</Text>
        </View>

        <View style={[styles.stageFrame, { width: stagePixelWidth, height: stagePixelHeight }]}>
          <View
            style={[
              styles.stage,
              {
                left: stagePixelWidth / 2 - stageWidth / 2,
                top: stagePixelHeight / 2 - stageHeight / 2,
                width: stageWidth,
                height: stageHeight,
                transform: [
                  { scale },
                  { translateX: snapshot.screenShake ? Math.sin(snapshot.time * 80) * snapshot.screenShake : 0 },
                ],
              },
            ]}>
            <Image
              source={backgrounds[snapshot.level.district]}
              style={[styles.background, { left: -snapshot.cameraX, width: backgroundWidth }]}
              contentFit="fill"
            />
            <World snapshot={snapshot} />
            <Hud snapshot={snapshot} />
            {snapshot.status !== 'running' ? (
              <MenuOverlay
                snapshot={snapshot}
                progress={progress}
                selectedLevel={selectedLevel}
                onStart={startSelectedLevel}
                onRetry={() => replaceModel(snapshot.level.id)}
                onNext={nextLevel}
                onSelectLevel={selectLevel}
              />
            ) : null}
            {isWeb ? <KeyboardHelp /> : <TouchControls onInput={setInput} />}
            {isPortraitMobile ? (
              <View style={styles.rotateOverlay}>
                <Text style={styles.rotateTitle}>Tournez le telephone</Text>
                <Text style={styles.rotateText}>Le jeu se joue en paysage.</Text>
              </View>
            ) : null}
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

function World({ snapshot }: { snapshot: StreetBrawlSnapshot }) {
  const fighters = [snapshot.player, ...snapshot.enemies].sort((a, b) => a.y - b.y);
  return (
    <View style={StyleSheet.absoluteFill}>
      {snapshot.powerUps.map((powerUp) => (
        <Image
          key={powerUp.id}
          source={powerSprites[powerUp.kind]}
          style={[styles.powerUp, { left: powerUp.x - snapshot.cameraX - 20, top: powerUp.y - 34 }]}
          contentFit="contain"
        />
      ))}
      {fighters.map((fighter) => (
        <FighterSprite key={fighter.id} fighter={fighter} cameraX={snapshot.cameraX} />
      ))}
      <View style={[styles.endMarker, { left: 1690 - snapshot.cameraX }]} />
    </View>
  );
}

function FighterSprite({ fighter, cameraX }: { fighter: Fighter; cameraX: number }) {
  const action = fighter.action === 'windup' ? 'attack' : fighter.action;
  const source = enemySprites[fighter.kind][action] ?? enemySprites[fighter.kind].idle;
  const left = fighter.x - cameraX - fighter.width / 2;
  const top = fighter.y - fighter.height;
  const tint = fighter.invulnerableTimer > 0 && fighter.hp > 0 ? 0.74 : 1;
  return (
    <View style={[styles.fighterWrap, { left, top, width: fighter.width, height: fighter.height + 18 }]}>
      <View style={[styles.shadow, { width: fighter.width * 0.88, left: fighter.width * 0.06, top: fighter.height - 7 }]} />
      <Image
        source={source}
        style={[
          styles.fighter,
          {
            width: fighter.width,
            height: fighter.height,
            opacity: tint,
            transform: [{ scaleX: fighter.facing }],
          },
        ]}
        contentFit="fill"
      />
      {fighter.kind !== 'player' && fighter.hp > 0 ? (
        <View style={styles.enemyHealth}>
          <View style={[styles.enemyHealthFill, { width: `${Math.max(0, (fighter.hp / fighter.maxHp) * 100)}%` }]} />
        </View>
      ) : null}
    </View>
  );
}

function Hud({ snapshot }: { snapshot: StreetBrawlSnapshot }) {
  return (
    <View pointerEvents="none" style={styles.hud}>
      <View style={styles.lifePanel}>
        <Text style={styles.hudLabel}>VIE</Text>
        <Meter value={snapshot.player.hp / snapshot.player.maxHp} color="#E94B5F" />
        <Text style={styles.hudLabel}>FURY</Text>
        <Meter value={snapshot.player.fury / 100} color="#8E5CFF" />
        {snapshot.player.weaponKind !== 'none' ? (
          <Text style={styles.weaponText}>
            {snapshot.player.weaponKind.toUpperCase()} {Math.ceil(snapshot.player.weaponTimer)}s
          </Text>
        ) : null}
      </View>
      <View style={styles.scorePanel}>
        <Text style={styles.scoreText}>{snapshot.score}</Text>
        <Text style={styles.smallText}>{Math.floor(snapshot.time)}s - {snapshot.defeated} K.O.</Text>
        <Text style={styles.messageText}>{snapshot.message}</Text>
      </View>
    </View>
  );
}

function Meter({ value, color }: { value: number; color: string }) {
  return (
    <View style={styles.meter}>
      <View style={[styles.meterFill, { width: `${Math.max(0, Math.min(1, value)) * 100}%`, backgroundColor: color }]} />
    </View>
  );
}

function MenuOverlay({
  snapshot,
  progress,
  selectedLevel,
  onStart,
  onRetry,
  onNext,
  onSelectLevel,
}: {
  snapshot: StreetBrawlSnapshot;
  progress: StreetBrawlProgress;
  selectedLevel: number;
  onStart: () => void;
  onRetry: () => void;
  onNext: () => void;
  onSelectLevel: (level: number) => void;
}) {
  const current = getStreetBrawlLevel(selectedLevel);
  const completed = progress.completedLevels[String(selectedLevel)];
  return (
    <View style={styles.overlay}>
      <View style={styles.menuPanel}>
        <Text style={styles.menuKicker}>Campagne auto-sauvegardee</Text>
        <Text style={styles.menuTitle}>
          {snapshot.status === 'victory' ? 'Zone securisee' : snapshot.status === 'gameover' ? 'K.O.' : current.title}
        </Text>
        <Text style={styles.menuText}>
          {snapshot.status === 'victory'
            ? `Rang ${snapshot.rank} - score ${snapshot.score}`
            : snapshot.status === 'gameover'
              ? 'Reprends depuis le niveau sauvegarde.'
              : current.beat}
        </Text>
        {completed ? (
          <Text style={styles.bestText}>
            Record local: {completed.bestScore} - Rang {completed.bestRank}
          </Text>
        ) : null}
        <View style={styles.levelStepper}>
          <Pressable style={styles.stepButton} onPress={() => onSelectLevel(selectedLevel - 1)}>
            <Text style={styles.stepText}>-</Text>
          </Pressable>
          <Text style={styles.levelText}>
            Niveau {selectedLevel}/{STREET_BRAWL_LEVELS.length}
          </Text>
          <Pressable style={styles.stepButton} onPress={() => onSelectLevel(selectedLevel + 1)}>
            <Text style={styles.stepText}>+</Text>
          </Pressable>
        </View>
        <View style={styles.menuActions}>
          {snapshot.status === 'victory' && snapshot.level.id < 50 ? (
            <Pressable style={styles.primaryButton} onPress={onNext}>
              <Text style={styles.primaryText}>Suivant</Text>
            </Pressable>
          ) : (
            <Pressable style={styles.primaryButton} onPress={onStart}>
              <Text style={styles.primaryText}>{snapshot.status === 'gameover' ? 'Recommencer' : 'Continuer'}</Text>
            </Pressable>
          )}
          {snapshot.status === 'gameover' ? (
            <Pressable style={styles.secondaryButton} onPress={onRetry}>
              <Text style={styles.secondaryText}>Menu niveau</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </View>
  );
}

function KeyboardHelp() {
  return (
    <View pointerEvents="none" style={styles.keyboardHelp}>
      <Text style={styles.keyboardText}>WASD/Fleches: bouger</Text>
      <Text style={styles.keyboardText}>J: combo  K: lourd  L: fury  Shift/Espace: dash</Text>
    </View>
  );
}

function TouchControls({ onInput }: { onInput: (key: keyof StreetBrawlInput, value: boolean) => void }) {
  return (
    <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
      <View style={styles.dpad}>
        <HoldButton label="↑" onChange={(value) => onInput('up', value)} style={styles.dpadUp} />
        <HoldButton label="←" onChange={(value) => onInput('left', value)} style={styles.dpadLeft} />
        <HoldButton label="→" onChange={(value) => onInput('right', value)} style={styles.dpadRight} />
        <HoldButton label="↓" onChange={(value) => onInput('down', value)} style={styles.dpadDown} />
      </View>
      <View style={styles.actionPad}>
        <HoldButton label="F" onChange={(value) => onInput('fury', value)} style={styles.furyButton} />
        <HoldButton label="L" onChange={(value) => onInput('heavy', value)} style={styles.heavyButton} />
        <HoldButton label="A" onChange={(value) => onInput('attack', value)} style={styles.attackButton} />
        <HoldButton label="D" onChange={(value) => onInput('dash', value)} style={styles.dashButton} />
      </View>
    </View>
  );
}

function HoldButton({ label, onChange, style }: { label: string; onChange: (value: boolean) => void; style: object }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.touchButton, style, pressed && styles.touchPressed]}
      onPressIn={() => onChange(true)}
      onPressOut={() => onChange(false)}>
      <Text style={styles.touchText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#14131C',
  },
  safeArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  topBar: {
    width: '100%',
    minHeight: 44,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  backButton: {
    height: 36,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: '#F6D74A',
    borderWidth: 2,
    borderColor: '#111118',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: {
    color: '#111118',
    fontWeight: '900',
    fontSize: 13,
  },
  campaignLine: {
    flex: 1,
    minWidth: 0,
  },
  kicker: {
    color: '#26C4A6',
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  campaignText: {
    color: '#FFF8E4',
    fontSize: 14,
    fontWeight: '900',
  },
  rankBadge: {
    width: 36,
    height: 36,
    textAlign: 'center',
    textAlignVertical: 'center',
    lineHeight: 34,
    color: '#111118',
    fontSize: 20,
    fontWeight: '900',
    backgroundColor: '#F6D74A',
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#111118',
  },
  stageFrame: {
    overflow: 'hidden',
    backgroundColor: '#000000',
    borderWidth: 3,
    borderColor: '#050509',
  },
  stage: {
    position: 'absolute',
    left: 0,
    top: 0,
    overflow: 'hidden',
    backgroundColor: '#242130',
  },
  background: {
    position: 'absolute',
    top: 0,
    height: stageHeight,
  },
  fighterWrap: {
    position: 'absolute',
  },
  fighter: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
  shadow: {
    position: 'absolute',
    height: 11,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.34)',
  },
  enemyHealth: {
    position: 'absolute',
    left: 4,
    right: 4,
    top: -8,
    height: 5,
    backgroundColor: '#201D2B',
    borderWidth: 1,
    borderColor: '#111118',
  },
  enemyHealthFill: {
    height: '100%',
    backgroundColor: '#E94B5F',
  },
  powerUp: {
    position: 'absolute',
    width: 40,
    height: 40,
  },
  endMarker: {
    position: 'absolute',
    top: 252,
    width: 10,
    height: 206,
    backgroundColor: 'rgba(246,215,74,0.6)',
  },
  hud: {
    position: 'absolute',
    left: 16,
    right: 16,
    top: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  lifePanel: {
    width: 238,
    gap: 4,
  },
  hudLabel: {
    color: '#FFF8E4',
    fontSize: 11,
    fontWeight: '900',
  },
  weaponText: {
    marginTop: 2,
    color: '#F6D74A',
    fontSize: 12,
    fontWeight: '900',
  },
  meter: {
    height: 12,
    backgroundColor: '#201D2B',
    borderWidth: 2,
    borderColor: '#111118',
  },
  meterFill: {
    height: '100%',
  },
  scorePanel: {
    alignItems: 'flex-end',
  },
  scoreText: {
    color: '#F6D74A',
    fontSize: 28,
    fontWeight: '900',
  },
  smallText: {
    color: '#FFF8E4',
    fontSize: 12,
    fontWeight: '900',
  },
  messageText: {
    marginTop: 4,
    color: '#26C4A6',
    fontSize: 13,
    fontWeight: '900',
  },
  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(14, 12, 20, 0.62)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuPanel: {
    width: 440,
    padding: 18,
    borderRadius: 6,
    borderWidth: 3,
    borderColor: '#111118',
    backgroundColor: '#FFF8E4',
    gap: 10,
  },
  menuKicker: {
    color: '#26A68E',
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  menuTitle: {
    color: '#111118',
    fontSize: 32,
    fontWeight: '900',
  },
  menuText: {
    color: '#33303D',
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '700',
  },
  bestText: {
    color: '#6D334B',
    fontSize: 13,
    fontWeight: '900',
  },
  levelStepper: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  stepButton: {
    width: 48,
    height: 38,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#111118',
    backgroundColor: '#26C4A6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepText: {
    color: '#111118',
    fontSize: 24,
    lineHeight: 26,
    fontWeight: '900',
  },
  levelText: {
    flex: 1,
    color: '#111118',
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
  },
  menuActions: {
    flexDirection: 'row',
    gap: 10,
  },
  primaryButton: {
    flex: 1,
    height: 44,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#111118',
    backgroundColor: '#F6D74A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: {
    color: '#111118',
    fontSize: 15,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  secondaryButton: {
    flex: 1,
    height: 44,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#111118',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryText: {
    color: '#111118',
    fontSize: 15,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  keyboardHelp: {
    position: 'absolute',
    left: 14,
    bottom: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: 'rgba(17,17,24,0.78)',
    gap: 2,
  },
  keyboardText: {
    color: '#FFF8E4',
    fontSize: 12,
    fontWeight: '900',
  },
  dpad: {
    position: 'absolute',
    left: 32,
    bottom: 34,
    width: 154,
    height: 128,
  },
  actionPad: {
    position: 'absolute',
    right: 34,
    bottom: 28,
    width: 190,
    height: 144,
  },
  touchButton: {
    position: 'absolute',
    width: 58,
    height: 58,
    borderRadius: 6,
    borderWidth: 3,
    borderColor: '#111118',
    backgroundColor: 'rgba(255,248,228,0.86)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  touchPressed: {
    backgroundColor: '#F6D74A',
    transform: [{ scale: 0.95 }],
  },
  touchText: {
    color: '#111118',
    fontSize: 24,
    fontWeight: '900',
  },
  dpadUp: {
    left: 48,
    top: 0,
  },
  dpadLeft: {
    left: 0,
    top: 48,
  },
  dpadRight: {
    left: 96,
    top: 48,
  },
  dpadDown: {
    left: 48,
    top: 82,
  },
  attackButton: {
    right: 0,
    bottom: 32,
    width: 72,
    height: 72,
    backgroundColor: 'rgba(246,215,74,0.88)',
  },
  heavyButton: {
    right: 78,
    bottom: 58,
  },
  furyButton: {
    right: 52,
    bottom: 0,
    backgroundColor: 'rgba(142,92,255,0.88)',
  },
  dashButton: {
    right: 118,
    bottom: 0,
    backgroundColor: 'rgba(38,196,166,0.88)',
  },
  rotateOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: '#14131C',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  rotateTitle: {
    color: '#F6D74A',
    fontSize: 28,
    fontWeight: '900',
  },
  rotateText: {
    color: '#FFF8E4',
    fontSize: 15,
    fontWeight: '900',
  },
});
