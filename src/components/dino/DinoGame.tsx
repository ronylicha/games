import { useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';

type GameStatus = 'ready' | 'running' | 'gameover';
type ObstacleType = 'cactus' | 'bird';

type Obstacle = {
  id: number;
  type: ObstacleType;
  x: number;
  y: number;
  width: number;
  height: number;
  variant: number;
};

type Cloud = {
  id: number;
  x: number;
  y: number;
  speed: number;
  scale: number;
};

type LeaderScore = {
  id: number;
  name: string;
  score: number;
};

type PendingScore = {
  id: number;
  score: number;
};

type Snapshot = {
  status: GameStatus;
  score: number;
  best: number;
  speed: number;
  jumpY: number;
  ducking: boolean;
  obstacles: Obstacle[];
  clouds: Cloud[];
  tick: number;
};

type DinoModel = Snapshot & {
  boardWidth: number;
  boardHeight: number;
  velocity: number;
  spawnTimer: number;
  cloudTimer: number;
  lastTime: number;
  nextId: number;
};

let sessionLeaderboard: LeaderScore[] = [];

const leaderboardStorageKey = 'games:dino:leaderboard';
const dinoRunOne = require('@/assets/game/dino/dino-run-1.png');
const dinoRunTwo = require('@/assets/game/dino/dino-run-2.png');
const dinoDuck = require('@/assets/game/dino/dino-duck.png');
const cactusSmall = require('@/assets/game/dino/cactus-small.png');
const cactusWide = require('@/assets/game/dino/cactus-wide.png');
const birdOne = require('@/assets/game/dino/bird-1.png');
const birdTwo = require('@/assets/game/dino/bird-2.png');
const cloudSprite = require('@/assets/game/dino/cloud.png');

const gravity = 1750;
const jumpPower = 660;
const dinoX = 44;
const dinoWidth = 34;
const dinoHeight = 44;
const duckHeight = 24;
const dayNightInterval = 250;

export function DinoGame() {
  const { width } = useWindowDimensions();
  const boardWidth = Math.max(300, Math.min(width - 32, 760));
  const boardHeight = Math.max(230, Math.min(310, boardWidth * 0.58));
  const isDesktopWeb = Platform.OS === 'web' && width >= 900;
  const groundY = boardHeight - 46;
  const [leaderboard, setLeaderboard] = useState<LeaderScore[]>(sessionLeaderboard);
  const [pendingScore, setPendingScore] = useState<PendingScore | null>(null);
  const [playerName, setPlayerName] = useState('');
  const [snapshot, setSnapshot] = useState<Snapshot>(() => createSnapshot(boardWidth, boardHeight));
  const modelRef = useRef<DinoModel>(createModel(boardWidth, boardHeight));
  const rafRef = useRef<number | null>(null);
  const boardSizeRef = useRef({ boardWidth, boardHeight });
  const bestRef = useRef(snapshot.best);
  const pendingScoreRef = useRef<PendingScore | null>(pendingScore);

  useEffect(() => {
    let mounted = true;

    async function loadLeaderboard() {
      const stored = await AsyncStorage.getItem(leaderboardStorageKey);
      if (!stored) {
        return;
      }

      const parsed = JSON.parse(stored) as LeaderScore[];
      const scores = normalizeLeaderboard(parsed);
      sessionLeaderboard = scores;
      if (mounted) {
        setLeaderboard(scores);
        modelRef.current.best = getBestScore();
        setSnapshot(toSnapshot(modelRef.current));
      }
    }

    loadLeaderboard().catch(() => undefined);

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    modelRef.current.boardWidth = boardWidth;
    modelRef.current.boardHeight = boardHeight;
    boardSizeRef.current = { boardWidth, boardHeight };
  }, [boardWidth, boardHeight]);

  useEffect(() => {
    bestRef.current = snapshot.best;
  }, [snapshot.best]);

  useEffect(() => {
    pendingScoreRef.current = pendingScore;
  }, [pendingScore]);

  useEffect(() => {
    function frame(now: number) {
      const model = modelRef.current;
      const delta = Math.min(0.032, Math.max(0, (now - model.lastTime) / 1000 || 0));
      model.lastTime = now;

      if (model.status === 'running') {
        stepModel(model, delta, (score) => {
          setPlayerName('');
          setPendingScore((current) => current ?? { id: Date.now(), score });
        });
      }

      setSnapshot(toSnapshot(model));
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
    if (!isDesktopWeb || typeof window === 'undefined') {
      return;
    }

    function startFromKeyboard() {
      const current = modelRef.current;
      const size = boardSizeRef.current;
      modelRef.current = createModel(size.boardWidth, size.boardHeight, Math.max(current.best, bestRef.current));
      modelRef.current.status = 'running';
      modelRef.current.lastTime = performance.now();
      setSnapshot(toSnapshot(modelRef.current));
    }

    function jumpFromKeyboard() {
      if (pendingScoreRef.current) {
        return;
      }

      const model = modelRef.current;
      if (model.status !== 'running') {
        startFromKeyboard();
        return;
      }

      if (model.jumpY <= 0.5) {
        model.velocity = jumpPower;
        model.jumpY = 2;
        model.ducking = false;
        setSnapshot(toSnapshot(model));
      }
    }

    function duckFromKeyboard(ducking: boolean) {
      if (pendingScoreRef.current) {
        return;
      }

      const model = modelRef.current;
      if (model.status === 'running' && model.jumpY <= 0.5) {
        model.ducking = ducking;
        setSnapshot(toSnapshot(model));
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') {
        return;
      }

      event.preventDefault();

      if (event.key === 'ArrowUp' && !event.repeat) {
        jumpFromKeyboard();
      }

      if (event.key === 'ArrowDown') {
        duckFromKeyboard(true);
      }
    }

    function onKeyUp(event: KeyboardEvent) {
      if (event.key !== 'ArrowDown') {
        return;
      }

      event.preventDefault();
      duckFromKeyboard(false);
    }

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    return () => {
      duckFromKeyboard(false);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [isDesktopWeb]);

  const dinoTop = groundY - (snapshot.ducking ? duckHeight : dinoHeight) - snapshot.jumpY;
  const speedLabel = useMemo(() => `${Math.round(snapshot.speed)} u/s`, [snapshot.speed]);
  const displayedBest = Math.max(snapshot.best, Math.floor(snapshot.score));
  const isNight = Math.floor(Math.floor(snapshot.score) / dayNightInterval) % 2 === 1;

  function start() {
    if (pendingScore) {
      return;
    }

    const model = modelRef.current;
    if (model.status === 'running') {
      jump();
      return;
    }

    modelRef.current = createModel(boardWidth, boardHeight, Math.max(model.best, snapshot.best));
    modelRef.current.status = 'running';
    modelRef.current.lastTime = performance.now();
    setSnapshot(toSnapshot(modelRef.current));
  }

  function jump() {
    if (pendingScore) {
      return;
    }

    const model = modelRef.current;
    if (model.status !== 'running') {
      start();
      return;
    }
    if (model.jumpY <= 0.5) {
      model.velocity = jumpPower;
      model.jumpY = 2;
      model.ducking = false;
      setSnapshot(toSnapshot(model));
    }
  }

  function setDuck(ducking: boolean) {
    if (pendingScore) {
      return;
    }

    const model = modelRef.current;
    if (model.status === 'running' && model.jumpY <= 0.5) {
      model.ducking = ducking;
      setSnapshot(toSnapshot(model));
    }
  }

  async function submitScore() {
    if (!pendingScore) {
      return;
    }

    const name = playerName.trim().slice(0, 12) || 'Joueur';
    sessionLeaderboard = normalizeLeaderboard([...sessionLeaderboard, { ...pendingScore, name }]);
    setLeaderboard(sessionLeaderboard);
    await AsyncStorage.setItem(leaderboardStorageKey, JSON.stringify(sessionLeaderboard));
    setPendingScore(null);
    setPlayerName('');
  }

  return (
    <View style={styles.container}>
      <View style={styles.scoreBar}>
        <ScorePill label="Score" value={String(Math.floor(snapshot.score))} />
        <ScorePill label="Record" value={String(displayedBest)} />
        <ScorePill label="Vitesse" value={speedLabel} />
      </View>

      <Pressable style={[styles.board, isNight && styles.boardNight, { width: boardWidth, height: boardHeight }]} onPressIn={jump}>
        <SkyLine width={boardWidth} night={isNight} />
        {snapshot.clouds.map((cloud) => (
          <CloudView key={cloud.id} cloud={cloud} night={isNight} />
        ))}
        {isNight ? <Moon right={boardWidth * 0.12} /> : <View style={[styles.sun, { right: boardWidth * 0.12, top: 24 }]} />}
        <View style={[styles.ground, isNight && styles.groundNight, { top: groundY }]} />
        <View style={[styles.groundShadow, isNight && styles.groundShadowNight, { top: groundY + 12 }]} />

        {snapshot.obstacles.map((obstacle) =>
          obstacle.type === 'cactus' ? (
            <Cactus key={obstacle.id} obstacle={obstacle} />
          ) : (
            <Bird key={obstacle.id} obstacle={obstacle} tick={snapshot.tick} />
          ),
        )}

        <Dino top={dinoTop} ducking={snapshot.ducking} running={snapshot.status === 'running'} tick={snapshot.tick} />

        {snapshot.status !== 'running' ? (
          <View style={[styles.overlay, isNight && styles.overlayNight]}>
            <Text style={styles.overlayTitle}>{snapshot.status === 'gameover' ? 'Crash' : 'Dino Run'}</Text>
            <Text style={styles.overlayText}>
              {snapshot.status === 'gameover' ? 'Touchez pour recommencer' : 'Touchez pour démarrer'}
            </Text>
          </View>
        ) : null}
      </Pressable>

      <View style={styles.controls}>
        <Pressable style={styles.actionButton} onPressIn={jump}>
          <Text style={styles.actionText}>Sauter</Text>
        </Pressable>
        <Pressable style={styles.duckButton} onPressIn={() => setDuck(true)} onPressOut={() => setDuck(false)}>
          <Text style={styles.actionText}>Baisser</Text>
        </Pressable>
        <Pressable style={styles.resetButton} onPressIn={start}>
          <Text style={styles.resetText}>Nouvelle</Text>
        </Pressable>
      </View>

      <View style={styles.leaderboard}>
        <Text style={styles.leaderTitle}>Leaderboard</Text>
        {leaderboard.length === 0 ? (
          <Text style={styles.emptyScore}>Aucun score pour le moment.</Text>
        ) : (
          leaderboard.map((entry, index) => (
            <View key={entry.id} style={styles.leaderRow}>
              <Text style={styles.rank}>#{index + 1}</Text>
              <Text style={styles.playerName}>{entry.name}</Text>
              <View style={styles.rankLine} />
              <Text style={styles.rankScore}>{entry.score}</Text>
            </View>
          ))
        )}
      </View>

      {pendingScore ? (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'position'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
          style={styles.nameOverlay}
          contentContainerStyle={styles.nameOverlayContent}>
          <View style={styles.namePanel}>
            <Text style={styles.nameKicker}>Top 5</Text>
            <Text style={styles.nameTitle}>Nouveau score</Text>
            <Text style={styles.nameScore}>{pendingScore.score}</Text>
            <TextInput
              autoFocus
              maxLength={12}
              value={playerName}
              onChangeText={setPlayerName}
              onSubmitEditing={submitScore}
              placeholder="Nom du joueur"
              placeholderTextColor="#6C7773"
              returnKeyType="done"
              style={styles.nameInput}
            />
            <Pressable style={styles.nameButton} onPressIn={submitScore}>
              <Text style={styles.nameButtonText}>Valider</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      ) : null}
    </View>
  );
}

function createSnapshot(boardWidth: number, boardHeight: number): Snapshot {
  return toSnapshot(createModel(boardWidth, boardHeight));
}

function createModel(boardWidth: number, boardHeight: number, best = getBestScore()): DinoModel {
  return {
    status: 'ready',
    score: 0,
    best,
    speed: 235,
    jumpY: 0,
    ducking: false,
    obstacles: [],
    clouds: [
      { id: 1, x: boardWidth * 0.18, y: 18, speed: 14, scale: 0.82 },
      { id: 2, x: boardWidth * 0.64, y: 34, speed: 19, scale: 1.04 },
    ],
    tick: 0,
    boardWidth,
    boardHeight,
    velocity: 0,
    spawnTimer: 0.9,
    cloudTimer: 2,
    lastTime: performance.now(),
    nextId: 10,
  };
}

function stepModel(model: DinoModel, delta: number, onScoreQualified: (score: number) => void) {
  const groundY = model.boardHeight - 46;
  model.tick += delta;
  model.score += delta * 10;
  model.speed = Math.min(470, 235 + model.score * 1.15);

  model.velocity -= gravity * delta;
  model.jumpY = Math.max(0, model.jumpY + model.velocity * delta);
  if (model.jumpY <= 0) {
    model.velocity = 0;
  }

  model.spawnTimer -= delta;
  if (model.spawnTimer <= 0) {
    model.obstacles.push(createObstacle(model, groundY));
    model.spawnTimer = 0.82 + Math.random() * 0.58 + Math.max(0, 90 - model.score) / 180;
  }

  model.cloudTimer -= delta;
  if (model.cloudTimer <= 0) {
    model.clouds.push({
      id: model.nextId++,
      x: model.boardWidth + 40,
      y: 12 + Math.random() * 48,
      speed: 12 + Math.random() * 20,
      scale: 0.75 + Math.random() * 0.55,
    });
    model.cloudTimer = 1.8 + Math.random() * 2.4;
  }

  model.obstacles = model.obstacles
    .map((obstacle) => ({ ...obstacle, x: obstacle.x - model.speed * delta }))
    .filter((obstacle) => obstacle.x + obstacle.width > -24);

  model.clouds = model.clouds
    .map((cloud) => ({ ...cloud, x: cloud.x - cloud.speed * delta }))
    .filter((cloud) => cloud.x > -110);

  if (model.obstacles.some((obstacle) => intersects(dinoRect(model, groundY), obstacleRect(obstacle)))) {
    const finalScore = Math.floor(model.score);
    model.status = 'gameover';
    model.best = Math.max(model.best, finalScore);
    model.ducking = false;
    if (qualifiesForLeaderboard(finalScore)) {
      onScoreQualified(finalScore);
    }
  }
}

function createObstacle(model: DinoModel, groundY: number): Obstacle {
  const bird = model.score > 12 && Math.random() > 0.62;
  if (bird) {
    const high = Math.random() > 0.45;
    return {
      id: model.nextId++,
      type: 'bird',
      x: model.boardWidth + 34,
      y: high ? groundY - 96 : groundY - 54,
      width: 38,
      height: 22,
      variant: high ? 1 : 0,
    };
  }

  const variant = Math.floor(Math.random() * 3);
  const width = variant === 0 ? 18 : variant === 1 ? 29 : 38;
  const height = variant === 0 ? 31 : variant === 1 ? 33 : 34;
  return {
    id: model.nextId++,
    type: 'cactus',
    x: model.boardWidth + 28,
    y: groundY - height,
    width,
    height,
    variant,
  };
}

function dinoRect(model: DinoModel, groundY: number) {
  const height = model.ducking ? duckHeight : dinoHeight;
  return {
    x: dinoX + 9,
    y: groundY - height - model.jumpY + 5,
    width: model.ducking ? 32 : dinoWidth - 9,
    height: height - 8,
  };
}

function obstacleRect(obstacle: Obstacle) {
  return {
    x: obstacle.x + 5,
    y: obstacle.y + 4,
    width: obstacle.width - 10,
    height: obstacle.height - 8,
  };
}

function intersects(a: { x: number; y: number; width: number; height: number }, b: { x: number; y: number; width: number; height: number }) {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

function toSnapshot(model: DinoModel): Snapshot {
  return {
    status: model.status,
    score: model.score,
    best: model.best,
    speed: model.speed,
    jumpY: model.jumpY,
    ducking: model.ducking,
    obstacles: model.obstacles,
    clouds: model.clouds,
    tick: model.tick,
  };
}

function getBestScore() {
  return sessionLeaderboard[0]?.score ?? 0;
}

function qualifiesForLeaderboard(score: number) {
  if (sessionLeaderboard.length < 5) {
    return true;
  }
  return score > Math.min(...sessionLeaderboard.map((entry) => entry.score));
}

function normalizeLeaderboard(scores: LeaderScore[]) {
  return scores
    .filter((entry) => Number.isFinite(entry.score))
    .map((entry) => ({
      id: Number.isFinite(entry.id) ? entry.id : Date.now(),
      name: String(entry.name || 'Joueur').slice(0, 12),
      score: Math.max(0, Math.floor(entry.score)),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
}

function ScorePill({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.scorePill}>
      <Text style={styles.scoreLabel}>{label}</Text>
      <Text style={styles.scoreValue}>{value}</Text>
    </View>
  );
}

function SkyLine({ width, night }: { width: number; night: boolean }) {
  return (
    <View style={styles.skyline}>
      {Array.from({ length: 7 }, (_, index) => (
        <View
          key={index}
          style={[
            styles.skylineBar,
            night && styles.skylineBarNight,
            {
              left: index * (width / 6) - 12,
              height: 7 + ((index * 19) % 22),
            },
          ]}
        />
      ))}
    </View>
  );
}

function Moon({ right }: { right: number }) {
  return (
    <View style={[styles.moon, { right, top: 22 }]}>
      <View style={styles.moonCutout} />
      <View style={[styles.star, { left: -74, top: 4 }]} />
      <View style={[styles.star, { left: -36, top: 28, transform: [{ scale: 0.75 }] }]} />
      <View style={[styles.star, { right: -28, top: 12, transform: [{ scale: 0.65 }] }]} />
    </View>
  );
}

function Dino({ top, ducking, running, tick }: { top: number; ducking: boolean; running: boolean; tick: number }) {
  const step = running ? Math.floor(tick * 12) % 2 : 0;
  if (ducking) {
    return (
      <Image source={dinoDuck} style={[styles.dinoDuckSprite, { top }]} contentFit="contain" />
    );
  }

  return (
    <Image source={step ? dinoRunTwo : dinoRunOne} style={[styles.dinoSprite, { top }]} contentFit="contain" />
  );
}

function Cactus({ obstacle }: { obstacle: Obstacle }) {
  return (
    <Image
      source={obstacle.variant >= 1 ? cactusWide : cactusSmall}
      style={[styles.obstacleSprite, { left: obstacle.x, top: obstacle.y, width: obstacle.width, height: obstacle.height }]}
      contentFit="fill"
    />
  );
}

function Bird({ obstacle, tick }: { obstacle: Obstacle; tick: number }) {
  const flap = Math.floor(tick * 10) % 2;
  return (
    <Image
      source={flap ? birdTwo : birdOne}
      style={[styles.obstacleSprite, { left: obstacle.x, top: obstacle.y, width: obstacle.width, height: obstacle.height }]}
      contentFit="fill"
    />
  );
}

function CloudView({ cloud, night }: { cloud: Cloud; night: boolean }) {
  return (
    <Image
      source={cloudSprite}
      style={[styles.cloudSprite, night && styles.cloudSpriteNight, { left: cloud.x, top: cloud.y, transform: [{ scale: cloud.scale }] }]}
      contentFit="contain"
    />
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    gap: 12,
    position: 'relative',
  },
  scoreBar: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  scorePill: {
    flexGrow: 1,
    minWidth: 94,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#101820',
    backgroundColor: '#FFF8E4',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  scoreLabel: {
    color: '#66706D',
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  scoreValue: {
    color: '#101820',
    fontSize: 20,
    fontWeight: '900',
  },
  board: {
    borderRadius: 8,
    borderWidth: 3,
    borderColor: '#101820',
    backgroundColor: '#DDF8EE',
    overflow: 'hidden',
    position: 'relative',
  },
  boardNight: {
    backgroundColor: '#151A2E',
  },
  skyline: {
    ...StyleSheet.absoluteFill,
    opacity: 0.18,
  },
  skylineBar: {
    position: 'absolute',
    bottom: 45,
    width: 18,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    backgroundColor: '#18A999',
  },
  skylineBarNight: {
    backgroundColor: '#6F789B',
  },
  sun: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F6D74A',
    borderWidth: 2,
    borderColor: '#101820',
  },
  moon: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FFF8E4',
    borderWidth: 2,
    borderColor: '#101820',
  },
  moonCutout: {
    position: 'absolute',
    right: -3,
    top: 2,
    width: 23,
    height: 23,
    borderRadius: 12,
    backgroundColor: '#151A2E',
  },
  star: {
    position: 'absolute',
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#F6D74A',
    borderWidth: 1,
    borderColor: '#101820',
  },
  ground: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 5,
    backgroundColor: '#101820',
  },
  groundNight: {
    backgroundColor: '#FFF8E4',
  },
  groundShadow: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 24,
    backgroundColor: '#B6E7D8',
  },
  groundShadowNight: {
    backgroundColor: '#29304B',
  },
  overlay: {
    position: 'absolute',
    left: 24,
    right: 24,
    top: 72,
    borderRadius: 8,
    borderWidth: 3,
    borderColor: '#101820',
    backgroundColor: '#FFF8E4',
    padding: 14,
    alignItems: 'center',
  },
  overlayNight: {
    backgroundColor: '#F6D74A',
  },
  overlayTitle: {
    color: '#101820',
    fontSize: 30,
    fontWeight: '900',
  },
  overlayText: {
    color: '#44504C',
    fontSize: 14,
    fontWeight: '800',
  },
  dinoSprite: {
    position: 'absolute',
    left: dinoX,
    width: 34,
    height: 44,
  },
  dinoDuckSprite: {
    position: 'absolute',
    left: dinoX,
    width: 48,
    height: 24,
  },
  obstacleSprite: {
    position: 'absolute',
  },
  cloudSprite: {
    position: 'absolute',
    width: 54,
    height: 25,
  },
  cloudSpriteNight: {
    opacity: 0.62,
  },
  controls: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionButton: {
    flexGrow: 1,
    minHeight: 46,
    borderRadius: 8,
    backgroundColor: '#F6D74A',
    borderWidth: 3,
    borderColor: '#101820',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  duckButton: {
    flexGrow: 1,
    minHeight: 46,
    borderRadius: 8,
    backgroundColor: '#18A999',
    borderWidth: 3,
    borderColor: '#101820',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  resetButton: {
    minHeight: 46,
    borderRadius: 8,
    backgroundColor: '#101820',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  actionText: {
    color: '#101820',
    fontSize: 15,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  resetText: {
    color: '#FFF8E4',
    fontSize: 15,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  leaderboard: {
    width: '100%',
    borderRadius: 8,
    borderWidth: 3,
    borderColor: '#101820',
    backgroundColor: '#FFF8E4',
    padding: 12,
    gap: 8,
  },
  leaderTitle: {
    color: '#101820',
    fontSize: 20,
    fontWeight: '900',
  },
  emptyScore: {
    color: '#66706D',
    fontSize: 14,
    fontWeight: '800',
  },
  leaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  rank: {
    color: '#F05A4A',
    fontSize: 15,
    fontWeight: '900',
    minWidth: 34,
  },
  playerName: {
    minWidth: 74,
    maxWidth: 120,
    color: '#101820',
    fontSize: 15,
    fontWeight: '900',
  },
  rankLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#D8D0BB',
  },
  rankScore: {
    color: '#101820',
    fontSize: 16,
    fontWeight: '900',
  },
  nameOverlay: {
    position: 'absolute',
    zIndex: 20,
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    minHeight: 580,
    backgroundColor: 'rgba(16, 24, 32, 0.68)',
  },
  nameOverlayContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    padding: 18,
    paddingTop: 96,
  },
  namePanel: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 8,
    borderWidth: 3,
    borderColor: '#101820',
    backgroundColor: '#FFF8E4',
    padding: 14,
    gap: 8,
    alignItems: 'stretch',
  },
  nameKicker: {
    color: '#F05A4A',
    fontSize: 13,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  nameTitle: {
    color: '#101820',
    fontSize: 24,
    fontWeight: '900',
  },
  nameScore: {
    color: '#18A999',
    fontSize: 34,
    fontWeight: '900',
  },
  nameInput: {
    minHeight: 44,
    borderRadius: 8,
    borderWidth: 3,
    borderColor: '#101820',
    backgroundColor: '#FFFFFF',
    color: '#101820',
    fontSize: 17,
    fontWeight: '900',
    paddingHorizontal: 12,
  },
  nameButton: {
    minHeight: 44,
    borderRadius: 8,
    borderWidth: 3,
    borderColor: '#101820',
    backgroundColor: '#F6D74A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameButtonText: {
    color: '#101820',
    fontSize: 16,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
});
