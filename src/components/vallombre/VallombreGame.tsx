import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import * as ScreenOrientation from 'expo-screen-orientation';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View, type ImageSourcePropType } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  vallombreCharacters,
  vallombreClues,
  vallombreLinks,
  type VallombreCharacterId,
  type VallombreClueId,
  type VallombreLinkId,
} from '@/game/vallombre';

const STORAGE_KEY = 'games:vallombre:renpy-state:v1';

type Phase =
  | 'title'
  | 'initial-bureau'
  | 'hub'
  | 'locations'
  | 'suspects'
  | 'location'
  | 'interrogation'
  | 'notebook'
  | 'corkboard'
  | 'recon1'
  | 'recon2'
  | 'recon3-q1'
  | 'recon3-q2'
  | 'recon3-q3'
  | 'accuse-who'
  | 'accuse-how'
  | 'accuse-why'
  | 'ending';

type LocationId = 'bureau' | 'biblio' | 'salle' | 'salon' | 'cuisine' | 'serre' | 'helene-room' | 'victor-room' | 'grenier' | 'cave';
type Expression = 'neutre' | 'inquiet' | 'colere' | 'ment' | 'effondre';
type BgKey =
  | 'bg-01'
  | 'bg-02'
  | 'bg-03'
  | 'bg-04'
  | 'bg-05'
  | 'bg-06'
  | 'bg-07'
  | 'bg-08'
  | 'bg-09'
  | 'bg-10'
  | 'bg-11'
  | 'bg-12'
  | 'bg-13'
  | 'bg-14'
  | 'bg-15'
  | 'bg-16'
  | 'bg-17'
  | 'bg-hall';

type Line = {
  bg?: BgKey;
  speaker?: string;
  text: string;
  character?: VallombreCharacterId;
  expression?: Expression;
  align?: 'left' | 'center' | 'right';
};

type Queue = {
  lines: Line[];
  index: number;
  returnPhase: Phase;
  returnLocation?: LocationId;
  returnSuspect?: VallombreCharacterId;
};

type VallombreRenpyState = {
  phase: Phase;
  bg: BgKey;
  currentLocation: LocationId;
  currentSuspect: VallombreCharacterId;
  clues: VallombreClueId[];
  links: VallombreLinkId[];
  linkCount: number;
  suspicion: Record<VallombreCharacterId, number>;
  presented: string[];
  chronoDiner: boolean;
  chronoVerre: boolean;
  chronoMeurtre: boolean;
  qui: VallombreCharacterId | 'none';
  commentCorrect: boolean;
  pourquoiCorrect: boolean;
  endingId: 'end-a' | 'end-b' | 'end-c' | 'end-d' | 'end-e' | null;
  queue: Queue | null;
  lastLine: Line;
};

type VallombreGameProps = {
  startMode?: 'new' | 'resume';
};

type Choice = {
  label: string;
  hint?: string;
  disabled?: boolean;
  onPress: () => void;
};

const backgrounds: Record<BgKey, ImageSourcePropType> = {
  'bg-01': require('@/assets/game/vallombre/bg-01.png'),
  'bg-02': require('@/assets/game/vallombre/bg-02.png'),
  'bg-03': require('@/assets/game/vallombre/bg-03.png'),
  'bg-04': require('@/assets/game/vallombre/bg-04.png'),
  'bg-05': require('@/assets/game/vallombre/bg-05.png'),
  'bg-06': require('@/assets/game/vallombre/bg-06.png'),
  'bg-07': require('@/assets/game/vallombre/bg-07.png'),
  'bg-08': require('@/assets/game/vallombre/bg-08.png'),
  'bg-09': require('@/assets/game/vallombre/bg-09.png'),
  'bg-10': require('@/assets/game/vallombre/bg-10.png'),
  'bg-11': require('@/assets/game/vallombre/bg-11.png'),
  'bg-12': require('@/assets/game/vallombre/bg-12.png'),
  'bg-13': require('@/assets/game/vallombre/bg-13.png'),
  'bg-14': require('@/assets/game/vallombre/bg-14.png'),
  'bg-15': require('@/assets/game/vallombre/bg-15.png'),
  'bg-16': require('@/assets/game/vallombre/bg-16.png'),
  'bg-17': require('@/assets/game/vallombre/bg-17.png'),
  'bg-hall': require('@/assets/game/vallombre/bg-hall.png'),
};

const characterAssets: Record<VallombreCharacterId, Record<Expression, ImageSourcePropType>> = {
  helene: {
    neutre: require('@/assets/game/vallombre/char-helene-neutre.png'),
    inquiet: require('@/assets/game/vallombre/char-helene-inquiet.png'),
    colere: require('@/assets/game/vallombre/char-helene-colere.png'),
    ment: require('@/assets/game/vallombre/char-helene-ment.png'),
    effondre: require('@/assets/game/vallombre/char-helene-effondre.png'),
  },
  theodore: {
    neutre: require('@/assets/game/vallombre/char-theodore-neutre.png'),
    inquiet: require('@/assets/game/vallombre/char-theodore-inquiet.png'),
    colere: require('@/assets/game/vallombre/char-theodore-colere.png'),
    ment: require('@/assets/game/vallombre/char-theodore-ment.png'),
    effondre: require('@/assets/game/vallombre/char-theodore-effondre.png'),
  },
  garance: {
    neutre: require('@/assets/game/vallombre/char-garance-neutre.png'),
    inquiet: require('@/assets/game/vallombre/char-garance-inquiet.png'),
    colere: require('@/assets/game/vallombre/char-garance-colere.png'),
    ment: require('@/assets/game/vallombre/char-garance-ment.png'),
    effondre: require('@/assets/game/vallombre/char-garance-effondre.png'),
  },
  foucher: {
    neutre: require('@/assets/game/vallombre/char-foucher-neutre.png'),
    inquiet: require('@/assets/game/vallombre/char-foucher-inquiet.png'),
    colere: require('@/assets/game/vallombre/char-foucher-colere.png'),
    ment: require('@/assets/game/vallombre/char-foucher-ment.png'),
    effondre: require('@/assets/game/vallombre/char-foucher-effondre.png'),
  },
  victor: {
    neutre: require('@/assets/game/vallombre/char-victor-neutre.png'),
    inquiet: require('@/assets/game/vallombre/char-victor-inquiet.png'),
    colere: require('@/assets/game/vallombre/char-victor-colere.png'),
    ment: require('@/assets/game/vallombre/char-victor-ment.png'),
    effondre: require('@/assets/game/vallombre/char-victor-effondre.png'),
  },
  camille: {
    neutre: require('@/assets/game/vallombre/char-camille-neutre.png'),
    inquiet: require('@/assets/game/vallombre/char-camille-inquiet.png'),
    colere: require('@/assets/game/vallombre/char-camille-colere.png'),
    ment: require('@/assets/game/vallombre/char-camille-ment.png'),
    effondre: require('@/assets/game/vallombre/char-camille-effondre.png'),
  },
};

const propAssets: Record<VallombreClueId, ImageSourcePropType> = {
  'clu-01': require('@/assets/game/vallombre/prop-01.png'),
  'clu-02': require('@/assets/game/vallombre/prop-02.png'),
  'clu-03': require('@/assets/game/vallombre/prop-03.png'),
  'clu-04': require('@/assets/game/vallombre/prop-04.png'),
  'clu-05': require('@/assets/game/vallombre/prop-05.png'),
  'clu-06': require('@/assets/game/vallombre/prop-06.png'),
  'clu-07': require('@/assets/game/vallombre/prop-07.png'),
  'clu-08': require('@/assets/game/vallombre/prop-08.png'),
  'clu-09': require('@/assets/game/vallombre/prop-09.png'),
  'clu-10': require('@/assets/game/vallombre/prop-10.png'),
  'clu-11': require('@/assets/game/vallombre/prop-11.png'),
  'clu-12': require('@/assets/game/vallombre/prop-12.png'),
  'clu-13': require('@/assets/game/vallombre/prop-13.png'),
  'clu-14': require('@/assets/game/vallombre/prop-14.png'),
  'clu-15': require('@/assets/game/vallombre/prop-15.png'),
  'clu-16': require('@/assets/game/vallombre/prop-16.png'),
  'clu-17': require('@/assets/game/vallombre/prop-17.png'),
  'clu-18': require('@/assets/game/vallombre/prop-18.png'),
  'clu-19': require('@/assets/game/vallombre/prop-19.png'),
  'clu-20': require('@/assets/game/vallombre/prop-20.png'),
};

const characterNames: Record<VallombreCharacterId, string> = {
  helene: 'Hélène Vallombre',
  theodore: 'Théodore Vallombre',
  garance: 'Sœur Garance',
  foucher: 'Dr Lazare Foucher',
  victor: 'Victor Nguyen',
  camille: 'Camille Roux',
};

const locationMeta: Record<LocationId, { title: string; bg: BgKey; intro: string }> = {
  bureau: { title: "Bureau d'Aldéric", bg: 'bg-04', intro: 'La scène de crime. Cherchons ce que la première fouille a manqué.' },
  biblio: { title: 'Bibliothèque', bg: 'bg-10', intro: 'Des murs entiers de livres. Et cette étagère, légèrement de travers.' },
  salle: { title: 'Salle à manger', bg: 'bg-06', intro: "La grande table du dîner d'hier soir." },
  salon: { title: 'Salon', bg: 'bg-07', intro: 'Le salon. On y a joué, bu, menti.' },
  cuisine: { title: 'Cuisine', bg: 'bg-12', intro: 'La cuisine de Sœur Garance. Le porte-couteaux a une fente vide.' },
  serre: { title: "Serre / jardin d'hiver", bg: 'bg-13', intro: 'La serre. La seule terre verte du domaine en plein hiver.' },
  'helene-room': { title: "Chambre d'Hélène", bg: 'bg-14', intro: "La chambre d'Hélène. Tout y est rangé, sauf elle." },
  'victor-room': { title: 'Chambre de Victor', bg: 'bg-15', intro: "La chambre du secrétaire. Spartiate. Tout dit la place qu'on lui a faite." },
  grenier: { title: 'Grenier', bg: 'bg-16', intro: 'Le grenier. Le coffre familial dort sous la poussière.' },
  cave: { title: 'Cave', bg: 'bg-17', intro: 'La cave. Humide, froide, et cette odeur.' },
};

const clueLabels: Record<VallombreClueId, string> = Object.fromEntries(vallombreClues.map((clue) => [clue.id, clue.title])) as Record<VallombreClueId, string>;

const prologueLines: Line[] = [
  { bg: 'bg-01', speaker: 'Inspectrice Morane', text: "On m'avait promis une enquête de routine." },
  { bg: 'bg-01', speaker: 'Inspectrice Morane', text: "On ne m'avait pas dit qu'elle commencerait par dix kilomètres dans la poudreuse." },
  { bg: 'bg-01', speaker: 'Inspectrice Morane', text: "Ni qu'elle finirait par un mort dans une pièce fermée à clé." },
  { bg: 'bg-02', speaker: 'Sœur Garance', character: 'garance', expression: 'inquiet', align: 'right', text: 'Inspectrice ? Dieu soit loué.' },
  { bg: 'bg-02', speaker: 'Sœur Garance', character: 'garance', expression: 'inquiet', align: 'right', text: "Monsieur Aldéric ne se réveille pas. La porte de son bureau est verrouillée. De l'intérieur." },
  { bg: 'bg-02', speaker: 'Inspectrice Morane', character: 'garance', expression: 'effondre', align: 'right', text: "Verrouillée de l'intérieur. Évidemment." },
  { bg: 'bg-02', speaker: 'Inspectrice Morane', text: "(Pourquoi est-ce toujours « de l'intérieur » ?)" },
  { bg: 'bg-03', speaker: 'Inspectrice Morane', text: "La serrure n'a pas joué. Forçons." },
  { bg: 'bg-04', speaker: 'Inspectrice Morane', text: "Aldéric Vallombre. Soixante-trois ans. Une plaie nette à la tempe." },
  { bg: 'bg-04', speaker: 'Inspectrice Morane', text: "Et un foyer où l'on a brûlé… beaucoup de papier." },
  { bg: 'bg-04', speaker: 'Inspectrice Morane', text: "Examinons la pièce avant qu'elle ne refroidisse." },
];

const firstSuspectLines: Line[] = [
  { bg: 'bg-05', speaker: 'Inspectrice Morane', text: "Ils sont six, coincés ici par la tempête. Écoutons leurs premiers mensonges." },
  { bg: 'bg-05', speaker: 'Hélène Vallombre', character: 'helene', expression: 'neutre', text: 'Mon mari et moi nous aimions.' },
  { bg: 'bg-05', speaker: 'Inspectrice Morane', text: "(Le passé du verbe « aimer » est toujours suspect.)" },
  { bg: 'bg-05', speaker: 'Théodore Vallombre', character: 'theodore', expression: 'neutre', text: 'Père dormait quand je suis monté. Vers onze heures.' },
  { bg: 'bg-05', speaker: 'Dr Lazare Foucher', character: 'foucher', expression: 'neutre', text: "Je n'ai pas remis les pieds dans ce bureau depuis hier midi." },
  { bg: 'bg-05', speaker: 'Camille Roux', character: 'camille', expression: 'ment', text: 'Je ne suis ici que pour chanter, inspectrice. Rien d’autre.' },
  { bg: 'bg-05', speaker: 'Victor Nguyen', character: 'victor', expression: 'inquiet', text: 'Monsieur Vallombre était… un bon employeur.' },
  { bg: 'bg-05', speaker: 'Sœur Garance', character: 'garance', expression: 'neutre', text: "J'étais à la cuisine toute la nuit. Demandez à qui vous voulez." },
  { bg: 'bg-05', speaker: 'Inspectrice Morane', text: "Six alibis. Au moins cinq de trop. La tempête nous garde tous jusqu'à l'aube. Au travail." },
];

type LinkDef = { id: VallombreLinkId; first: VallombreClueId; second: VallombreClueId; label: string; line: string };

const linkDefs: LinkDef[] = [
  { id: 'l1', first: 'clu-05', second: 'clu-06', label: "Courant d'air (05) + Étagère (06) → le passage", line: "Le bureau n'était pas clos. Le passage secret devient une voie d'entrée et de fuite." },
  { id: 'l2', first: 'clu-19', second: 'clu-20', label: "Horloge 23h47 (19) + Verre à deux empreintes (20) → l'heure du crime", line: 'Aldéric a bu avec quelqu’un avant 23h47. Le dernier visiteur devient central.' },
  { id: 'l3', first: 'clu-13', second: 'clu-18', label: "Coupe-papier lavé (13) + Flacon d'éther (18) → Foucher maquille", line: "Le docteur a nettoyé et arrangé. Ce n'est pas encore le meurtre, mais c'est un second crime." },
  { id: 'l4', first: 'clu-10', second: 'clu-16', label: 'Empreinte (10) + Boue de la serre (16) → le tueur vient du jardin', line: 'La trace de la bibliothèque et la boue de la serre racontent le même trajet.' },
  { id: 'l5', first: 'clu-11', second: 'clu-17', label: 'Acte de naissance (11) + Médaillon (17) → Victor & Garance', line: "Victor n'est pas seulement le secrétaire. Garance protège l’enfant caché." },
  { id: 'l6', first: 'clu-09', second: 'clu-15', label: "Lettre de chantage (09) + Partition (15) → l'emprise d'Aldéric", line: 'Aldéric tenait Camille et les autres par leurs secrets.' },
  { id: 'l7', first: 'clu-07', second: 'clu-12', label: 'Dettes (07) + Télégramme (12) → Théo, mobile sans occasion', line: 'Théodore avait un mobile visible, mais sa panique ne donne pas encore l’occasion.' },
];

function freshTitleState(): VallombreRenpyState {
  return {
    phase: 'title',
    bg: 'bg-01',
    currentLocation: 'bureau',
    currentSuspect: 'garance',
    clues: [],
    links: [],
    linkCount: 0,
    suspicion: {
      helene: 0,
      theodore: 0,
      garance: 0,
      foucher: 0,
      victor: 0,
      camille: 0,
    },
    presented: [],
    chronoDiner: false,
    chronoVerre: false,
    chronoMeurtre: false,
    qui: 'none',
    commentCorrect: false,
    pourquoiCorrect: false,
    endingId: null,
    queue: null,
    lastLine: { bg: 'bg-01', speaker: 'Les Cendres de Vallombre', text: 'Six suspects, une pièce verrouillée, une vérité brûlée dans le foyer.' },
  };
}

function startedState(): VallombreRenpyState {
  return {
    ...freshTitleState(),
    phase: 'initial-bureau',
    queue: { lines: prologueLines, index: 0, returnPhase: 'initial-bureau', returnLocation: 'bureau' },
    lastLine: prologueLines[0],
  };
}

function normalizeState(raw: VallombreRenpyState): VallombreRenpyState {
  const base = freshTitleState();
  return {
    ...base,
    ...raw,
    suspicion: { ...base.suspicion, ...(raw.suspicion ?? {}) },
    clues: Array.isArray(raw.clues) ? raw.clues : [],
    links: Array.isArray(raw.links) ? raw.links : [],
    presented: Array.isArray(raw.presented) ? raw.presented : [],
    queue: raw.queue?.lines ? raw.queue : null,
  };
}

function hasClue(state: VallombreRenpyState, id: VallombreClueId) {
  return state.clues.includes(id);
}

function hasLink(state: VallombreRenpyState, id: VallombreLinkId) {
  return state.links.includes(id);
}

function canAct3(state: VallombreRenpyState) {
  return hasClue(state, 'clu-06') && hasClue(state, 'clu-13') && hasClue(state, 'clu-11') && state.chronoDiner && state.chronoVerre;
}

function displayLineForPhase(state: VallombreRenpyState): Line {
  if (state.queue) {
    return state.queue.lines[state.queue.index] ?? state.lastLine;
  }

  if (state.phase === 'initial-bureau') {
    return { bg: 'bg-04', speaker: 'Inspectrice Morane', text: 'Le bureau est la première énigme. Tant que foyer, fenêtre, horloge et corps ne parlent pas, personne ne sort.' };
  }

  if (state.phase === 'hub') {
    return { bg: 'bg-hall', speaker: 'Inspectrice Morane', text: "Grand Hall. Choisissez votre prochaine action : lieu, suspect, carnet, tableau, puis confrontation quand l'enquête tient debout." };
  }

  if (state.phase === 'locations') {
    return { bg: 'bg-hall', speaker: 'Inspectrice Morane', text: 'Où fouiller maintenant ? Chaque pièce fonctionne comme un menu Ren’Py : les choix déjà faits disparaissent.' };
  }

  if (state.phase === 'suspects') {
    return { bg: 'bg-05', speaker: 'Inspectrice Morane', text: 'Qui interroger ? Présentez seulement les preuves que vous possédez.' };
  }

  if (state.phase === 'location') {
    const location = locationMeta[state.currentLocation];
    return { bg: location.bg, speaker: 'Inspectrice Morane', text: location.intro };
  }

  if (state.phase === 'interrogation') {
    return {
      bg: 'bg-05',
      speaker: characterNames[state.currentSuspect],
      character: state.currentSuspect,
      expression: state.currentSuspect === 'camille' ? 'ment' : state.currentSuspect === 'victor' ? 'inquiet' : 'neutre',
      text: interrogationIntro[state.currentSuspect],
    };
  }

  if (state.phase === 'notebook') {
    return { bg: 'bg-hall', speaker: 'Carnet d’indices', text: `${state.clues.length}/20 indices trouvés. Le carnet sert à vérifier ce que vous savez, pas à deviner au hasard.` };
  }

  if (state.phase === 'corkboard') {
    return { bg: 'bg-hall', speaker: 'Tableau de liège', text: `${state.linkCount}/7 fils rouges établis. Les liens apparaissent seulement quand les deux indices nécessaires sont dans le carnet.` };
  }

  if (state.phase.startsWith('recon')) {
    return { bg: state.phase === 'recon2' ? 'bg-07' : 'bg-09', speaker: 'Reconstitution', text: 'Remettez les faits dans le bon ordre. Aucun échec définitif : une erreur vous renvoie au début de la séquence.' };
  }

  if (state.phase.startsWith('accuse')) {
    return { bg: 'bg-09', speaker: 'Accusation', text: 'Nommez la main, l’arme et le mobile. La fin dépend de la précision du raisonnement.' };
  }

  return state.lastLine;
}

const interrogationIntro: Record<VallombreCharacterId, string> = {
  helene: "Posez vos questions. Je n'ai rien à cacher.",
  theodore: 'Inspectrice. Je vous le redis : je dormais.',
  garance: "J'étais à la cuisine. Toute la nuit.",
  foucher: "Je n'ai pas remis les pieds dans ce bureau depuis hier midi.",
  victor: 'Vous vouliez me voir, inspectrice ?',
  camille: "Je chante, inspectrice. Je n'enquête pas, et je ne tue pas.",
};

export function VallombreGame({ startMode }: VallombreGameProps) {
  const { width, height } = useWindowDimensions();
  const [hydrated, setHydrated] = useState(false);
  const [state, setState] = useState<VallombreRenpyState>(() => (startMode === 'new' ? startedState() : freshTitleState()));

  useEffect(() => {
    if (Platform.OS !== 'web') {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE).catch(() => undefined);
      return () => {
        ScreenOrientation.unlockAsync().catch(() => undefined);
      };
    }

    return undefined;
  }, []);

  useEffect(() => {
    let mounted = true;
    if (startMode === 'new') {
      AsyncStorage.removeItem(STORAGE_KEY)
        .catch(() => undefined)
        .finally(() => {
          if (mounted) setHydrated(true);
        });
      return () => {
        mounted = false;
      };
    }

    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (!mounted || !raw) return;
        const parsed = JSON.parse(raw) as VallombreRenpyState;
        if (parsed?.phase) {
          setState(normalizeState(parsed));
        }
      })
      .catch(() => undefined)
      .finally(() => {
        if (mounted) setHydrated(true);
      });
    return () => {
      mounted = false;
    };
  }, [startMode]);

  useEffect(() => {
    if (hydrated) {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => undefined);
    }
  }, [hydrated, state]);

  const update = useCallback((updater: (current: VallombreRenpyState) => VallombreRenpyState) => {
    setState((current) => normalizeState(updater(current)));
  }, []);

  const queueLines = useCallback(
    (lines: Line[], returnPhase: Phase, patch: Partial<VallombreRenpyState> = {}) => {
      update((current) => {
        const nextLines = lines.length > 0 ? lines : [current.lastLine];
        return {
          ...current,
          ...patch,
          bg: nextLines[0].bg ?? current.bg,
          phase: returnPhase,
          queue: {
            lines: nextLines,
            index: 0,
            returnPhase,
            returnLocation: patch.currentLocation ?? current.currentLocation,
            returnSuspect: patch.currentSuspect ?? current.currentSuspect,
          },
          lastLine: nextLines[0],
        };
      });
    },
    [update],
  );

  const addClue = useCallback(
    (id: VallombreClueId, lines: Line[], returnPhase: Phase, patch: Partial<VallombreRenpyState> = {}) => {
      queueLines(lines, returnPhase, {
        ...patch,
        clues: state.clues.includes(id) ? state.clues : [...state.clues, id],
      });
    },
    [queueLines, state.clues],
  );

  const continueQueue = useCallback(() => {
    update((current) => {
      if (!current.queue) return current;
      const nextIndex = current.queue.index + 1;
      if (nextIndex < current.queue.lines.length) {
        const line = current.queue.lines[nextIndex];
        return {
          ...current,
          bg: line.bg ?? current.bg,
          queue: { ...current.queue, index: nextIndex },
          lastLine: line,
        };
      }

      const lastLine = current.queue.lines[current.queue.lines.length - 1] ?? current.lastLine;
      return {
        ...current,
        bg: lastLine.bg ?? current.bg,
        phase: current.queue.returnPhase,
        currentLocation: current.queue.returnLocation ?? current.currentLocation,
        currentSuspect: current.queue.returnSuspect ?? current.currentSuspect,
        queue: null,
        lastLine,
      };
    });
  }, [update]);

  const startNewGame = useCallback(() => {
    setState(startedState());
  }, []);

  const currentLine = displayLineForPhase(state);
  const choices = useMemo<Choice[]>(() => {
    if (state.queue) {
      return [{ label: 'Continuer', onPress: continueQueue }];
    }

    if (state.phase === 'title') {
      return [
        { label: 'Nouvelle enquête', hint: 'Démarre au trajet dans la neige, comme le script source.', onPress: startNewGame },
        { label: 'Reprendre', hint: hydrated ? 'Charge la sauvegarde automatique.' : 'Chargement de la sauvegarde...', disabled: !hydrated, onPress: () => undefined },
        { label: 'Retour accueil', onPress: () => router.back() },
      ];
    }

    if (state.phase === 'initial-bureau') return initialBureauChoices(state, addClue, queueLines);
    if (state.phase === 'hub') return hubChoices(state, update, queueLines);
    if (state.phase === 'locations') return locationListChoices(update);
    if (state.phase === 'suspects') return suspectListChoices(update);
    if (state.phase === 'location') return locationChoices(state, addClue, queueLines, update);
    if (state.phase === 'interrogation') return interrogationChoices(state, queueLines, update);
    if (state.phase === 'notebook') return [{ label: '↩ Retour au hall', onPress: () => update((current) => ({ ...current, phase: 'hub', bg: 'bg-hall' })) }];
    if (state.phase === 'corkboard') return corkboardChoices(state, queueLines, update);
    if (state.phase === 'recon1') return recon1Choices(queueLines);
    if (state.phase === 'recon2') return recon2Choices(queueLines);
    if (state.phase === 'recon3-q1') return recon3Q1Choices(queueLines, update);
    if (state.phase === 'recon3-q2') return recon3Q2Choices(queueLines);
    if (state.phase === 'recon3-q3') return recon3Q3Choices(queueLines);
    if (state.phase === 'accuse-who') return accuseWhoChoices(update);
    if (state.phase === 'accuse-how') return accuseHowChoices(state, update);
    if (state.phase === 'accuse-why') return accuseWhyChoices(state, update);
    if (state.phase === 'ending') return [{ label: 'Nouvelle enquête', onPress: startNewGame }, { label: 'Retour accueil', onPress: () => router.back() }];
    return [];
  }, [addClue, continueQueue, hydrated, queueLines, startNewGame, state, update]);

  const isPortrait = height > width;

  return (
    <View style={styles.screen}>
      <StatusBar hidden />
      <Image source={backgrounds[currentLine.bg ?? state.bg]} style={styles.appBackdrop} contentFit="cover" />
      <View style={styles.appShade} />
      <SafeAreaView style={styles.safe}>
        {isPortrait ? <RotateGate /> : null}
        <View style={styles.stageShell}>
          <View style={styles.leftStage}>
            <Image source={backgrounds[currentLine.bg ?? state.bg]} style={styles.sceneImage} contentFit="cover" />
            <View style={styles.sceneShade} />
            <TopBar state={state} onBack={() => router.back()} onNew={startNewGame} />
            {currentLine.character ? <CharacterSprite id={currentLine.character} expression={currentLine.expression ?? 'neutre'} align={currentLine.align ?? 'center'} /> : null}
            {state.phase === 'notebook' ? <NotebookOverlay state={state} /> : null}
            {state.phase === 'corkboard' ? <CorkboardOverlay state={state} /> : null}
            <DialogueBox line={currentLine} />
          </View>
          <ChoicePanel title={choiceTitle(state)} choices={choices} />
        </View>
      </SafeAreaView>
    </View>
  );
}

function initialBureauChoices(state: VallombreRenpyState, addClue: (id: VallombreClueId, lines: Line[], returnPhase: Phase) => void, queueLines: (lines: Line[], returnPhase: Phase, patch?: Partial<VallombreRenpyState>) => void): Choice[] {
  const choices: Choice[] = [];
  if (!hasClue(state, 'clu-01')) {
    choices.push({ label: 'Examiner le foyer', onPress: () => addClue('clu-01', [{ bg: 'bg-04', speaker: 'Inspectrice Morane', text: 'Des cendres de papier, encore tièdes. On a brûlé des documents ici. Après le coup, peut-être.' }], 'initial-bureau') });
  }
  if (!hasClue(state, 'clu-04')) {
    choices.push({ label: 'Examiner la fenêtre', onPress: () => addClue('clu-04', [{ bg: 'bg-04', speaker: 'Inspectrice Morane', text: "Fenêtre verrouillée, gel intact, pas une éraflure. Personne n'est entré par là." }], 'initial-bureau') });
  }
  if (!hasClue(state, 'clu-19')) {
    choices.push({ label: "Examiner l'horloge", onPress: () => addClue('clu-19', [{ bg: 'bg-04', speaker: 'Inspectrice Morane', text: "L'horloge de cheminée s'est arrêtée. 23h47. Le choc a dû la renverser." }], 'initial-bureau') });
  }
  if (!hasClue(state, 'clu-03')) {
    choices.push({
      label: 'Fouiller le corps',
      onPress: () =>
        addClue(
          'clu-03',
          [
            { bg: 'bg-04', speaker: 'Inspectrice Morane', text: 'La clé du bureau. Dans sa propre poche. La porte était donc verrouillée de l’intérieur.' },
            { bg: 'bg-04', speaker: 'Inspectrice Morane', text: "Fenêtre scellée, clé sur lui… soit il s'est frappé seul, soit cette pièce a un secret." },
          ],
          'initial-bureau',
        ),
    });
  }

  const ready = ['clu-01', 'clu-03', 'clu-04', 'clu-19'].every((id) => hasClue(state, id as VallombreClueId));
  choices.push({ label: 'Sortir et réunir les pensionnaires', disabled: !ready, hint: ready ? undefined : 'Le foyer, la fenêtre, l’horloge et le corps doivent être examinés.', onPress: () => queueLines(firstSuspectLines, 'hub', { bg: 'bg-hall' }) });
  return choices;
}

function hubChoices(state: VallombreRenpyState, update: (updater: (current: VallombreRenpyState) => VallombreRenpyState) => void, queueLines: (lines: Line[], returnPhase: Phase, patch?: Partial<VallombreRenpyState>) => void): Choice[] {
  return [
    { label: '🔍 Explorer un lieu', onPress: () => update((current) => ({ ...current, phase: 'locations', bg: 'bg-hall' })) },
    { label: '💬 Interroger un suspect', onPress: () => update((current) => ({ ...current, phase: 'suspects', bg: 'bg-05' })) },
    { label: "📓 Ouvrir le carnet d'indices", hint: `${state.clues.length}/20 indices`, onPress: () => update((current) => ({ ...current, phase: 'notebook', bg: 'bg-hall' })) },
    { label: '🧵 Tableau de liège', hint: `${state.linkCount}/7 liens`, onPress: () => update((current) => ({ ...current, phase: 'corkboard', bg: 'bg-hall' })) },
    {
      label: '⚖ Réunir les suspects — Acte III',
      disabled: !canAct3(state),
      hint: canAct3(state) ? 'Confrontation finale disponible.' : 'Il faut passage, arme, acte de naissance, dîner et dernier verre.',
      onPress: () => queueLines(act3Lines(state), 'recon3-q1', { bg: 'bg-09' }),
    },
  ];
}

function locationListChoices(update: (updater: (current: VallombreRenpyState) => VallombreRenpyState) => void): Choice[] {
  return [
    ['bureau', "Bureau d'Aldéric"],
    ['biblio', 'Bibliothèque'],
    ['salle', 'Salle à manger'],
    ['salon', 'Salon'],
    ['cuisine', 'Cuisine'],
    ['serre', "Serre / jardin d'hiver"],
    ['helene-room', "Chambre d'Hélène"],
    ['victor-room', 'Chambre de Victor'],
    ['grenier', 'Grenier'],
    ['cave', 'Cave'],
  ].map(([id, label]) => ({
    label,
    onPress: () => update((current) => ({ ...current, phase: 'location', currentLocation: id as LocationId, bg: locationMeta[id as LocationId].bg })),
  })).concat([{ label: '↩ Retour', onPress: () => update((current) => ({ ...current, phase: 'hub', bg: 'bg-hall' })) }]);
}

function suspectListChoices(update: (updater: (current: VallombreRenpyState) => VallombreRenpyState) => void): Choice[] {
  const choices: Choice[] = vallombreCharacters.map((character) => ({
    label: characterNames[character.id],
    hint: character.role,
    onPress: () => update((current) => ({ ...current, phase: 'interrogation', currentSuspect: character.id, bg: 'bg-05' })),
  }));
  choices.push({ label: '↩ Retour', onPress: () => update((current) => ({ ...current, phase: 'hub', bg: 'bg-hall' })) });
  return choices;
}

function locationChoices(
  state: VallombreRenpyState,
  addClue: (id: VallombreClueId, lines: Line[], returnPhase: Phase, patch?: Partial<VallombreRenpyState>) => void,
  queueLines: (lines: Line[], returnPhase: Phase, patch?: Partial<VallombreRenpyState>) => void,
  update: (updater: (current: VallombreRenpyState) => VallombreRenpyState) => void,
): Choice[] {
  const current = state.currentLocation;
  const clue = (id: VallombreClueId, label: string, text: string, bg: BgKey = locationMeta[current].bg): Choice => ({
    label,
    onPress: () => addClue(id, [{ bg, speaker: 'Inspectrice Morane', text }], 'location'),
  });
  const choices: Choice[] = [];

  if (current === 'bureau') {
    if (!hasClue(state, 'clu-02')) choices.push(clue('clu-02', 'Le tisonnier', "Le tisonnier est propre. Trop propre — essuyé avec soin. Ce n'est pas l'arme ; on veut me le faire croire."));
    if (!hasClue(state, 'clu-05')) choices.push(clue('clu-05', "Les murs (un courant d'air ?)", "Un filet d'air froid longe la bibliothèque mitoyenne. La pièce n'est pas aussi close qu'on le prétend."));
    if (!hasClue(state, 'clu-09')) choices.push(clue('clu-09', 'Le foyer (papiers à demi brûlés)', "Une lettre à demi consumée. « …si vous ne payez pas, je révèlerai… ». Aldéric faisait chanter quelqu'un."));
    if (!hasClue(state, 'clu-18')) choices.push(clue('clu-18', 'Sous le secrétaire', "Un flacon d'éther, roulé sous le meuble. Médical. Quelqu'un a nettoyé ici — après la mort."));
  }

  if (current === 'biblio') {
    if (!hasClue(state, 'clu-06')) choices.push(clue('clu-06', "Pousser l'étagère décalée", "L'étagère pivote. Un passage. Il débouche droit dans le bureau d'Aldéric. Voilà ton « mystère de la chambre close ».", 'bg-11'));
    if (!hasClue(state, 'clu-10')) choices.push(clue('clu-10', 'Examiner le sol poussiéreux', "Une empreinte de talon, nette, dans la poussière du passage. Quelqu'un est venu par ici cette nuit."));
  }

  if (current === 'salle') {
    if (!hasClue(state, 'clu-08')) choices.push(clue('clu-08', "Compter les couverts d'argent", "Le service est complet… sauf le coupe-papier en argent. Disparu de la table. Voilà sans doute mon arme."));
    if (!state.chronoDiner) choices.push({ label: 'Reconstituer le dîner', onPress: () => update((currentState) => ({ ...currentState, phase: 'recon1', bg: 'bg-06' })) });
  }

  if (current === 'salon') {
    if (!hasClue(state, 'clu-15')) choices.push(clue('clu-15', 'La partition oubliée sur le piano', 'La partition de Camille. Dans la marge, au crayon, trois mots : « il sait ». Tremblés.'));
    if (!hasClue(state, 'clu-20')) choices.push(clue('clu-20', 'Les deux verres de cognac', "Deux verres. Deux jeux d'empreintes. Aldéric a bu avec quelqu'un, peu avant de mourir."));
    if (!state.chronoVerre) choices.push({ label: "Reconstituer le dernier verre d'Aldéric", onPress: () => update((currentState) => ({ ...currentState, phase: 'recon2', bg: 'bg-07' })) });
  }

  if (current === 'cuisine' && !hasClue(state, 'clu-13')) choices.push(clue('clu-13', 'Fouiller le bac à éther et chiffons', "Le coupe-papier manquant. Lavé à l'éther, mais le sang s'est logé dans la gravure. La vraie arme. Cachée par une main méthodique."));
  if (current === 'serre' && !hasClue(state, 'clu-16')) choices.push(clue('clu-16', 'Relever la boue près de la porte', "Cette boue verte, caractéristique. La même que sur l'empreinte du passage. Le tueur est passé par le jardin d'hiver."));
  if (current === 'helene-room' && !hasClue(state, 'clu-07')) choices.push(clue('clu-07', 'Ouvrir le tiroir à double-fond', 'Des reconnaissances de dette au nom de Théodore. Une fortune. Hélène les cachait — ou les gardait comme une arme.'));
  if (current === 'victor-room') {
    if (!hasClue(state, 'clu-12')) choices.push(clue('clu-12', 'Le télégramme glissé dans un livre', 'Un télégramme d’un créancier : « M. Vallombre nous a tout dit. » Aldéric allait livrer Théo à ses dettes.'));
    if (!hasClue(state, 'clu-17')) choices.push(clue('clu-17', "Le médaillon sous l'oreiller", "Un médaillon. La photo d'un enfant. Et au dos, l'écriture appliquée de Sœur Garance."));
  }
  if (current === 'grenier' && !hasClue(state, 'clu-11')) choices.push(clue('clu-11', 'Forcer le coffre', "Un acte de naissance dissimulé. « Père : A. Vallombre. Mère : —— ». L'enfant caché de la maison. Et ce nom d'enfant… c'est celui de Victor."));
  if (current === 'cave' && !hasClue(state, 'clu-14')) choices.push(clue('clu-14', 'Inspecter les bidons', "Un bidon de pétrole entamé, récemment. L'incendie n'était pas une improvisation. Il était préparé. Un acte à part."));

  if (choices.length === 0) choices.push({ label: 'Pièce déjà épuisée', disabled: true, onPress: () => undefined });
  choices.push({ label: '↩ Quitter la pièce', onPress: () => update((currentState) => ({ ...currentState, phase: 'hub', bg: 'bg-hall' })) });
  return choices;
}

function interrogationChoices(state: VallombreRenpyState, queueLines: (lines: Line[], returnPhase: Phase, patch?: Partial<VallombreRenpyState>) => void, update: (updater: (current: VallombreRenpyState) => VallombreRenpyState) => void): Choice[] {
  const id = state.currentSuspect;
  const present = (key: string, needed: VallombreClueId, label: string, lines: Line[], suspicion: number): Choice => ({
    label,
    disabled: !hasClue(state, needed) || state.presented.includes(key),
    hint: !hasClue(state, needed) ? `Indice requis : ${clueLabels[needed]}` : state.presented.includes(key) ? 'Déjà présenté' : undefined,
    onPress: () =>
      queueLines(lines, 'interrogation', {
        presented: [...state.presented, key],
        suspicion: { ...state.suspicion, [id]: state.suspicion[id] + suspicion },
      }),
  });

  const c: Choice[] = [];
  if (id === 'theodore') {
    c.push(present('theo:telegram', 'clu-12', 'Présenter : Télégramme du créancier', [{ bg: 'bg-05', speaker: 'Théodore Vallombre', character: 'theodore', expression: 'effondre', text: 'Où… où avez-vous eu ça ?' }, { bg: 'bg-05', speaker: 'Inspectrice Morane', text: 'Votre père allait vous couper les vivres ET vous livrer à vos créanciers. Voilà un mobile splendide.' }, { bg: 'bg-05', speaker: 'Théodore Vallombre', character: 'theodore', expression: 'inquiet', text: 'Un mobile, oui ! Mais pas le cran. Je tremble en signant un chèque, regardez-moi.' }], 40));
    c.push(present('theo:debt', 'clu-07', 'Présenter : Reconnaissances de dette', [{ bg: 'bg-05', speaker: 'Théodore Vallombre', character: 'theodore', expression: 'inquiet', text: 'Ces dettes… oui. Mais ma mère les gardait. Pour me tenir, pas pour me sauver.' }], 10));
    c.push({ label: 'Le presser sur son emploi du temps', onPress: () => queueLines([{ bg: 'bg-05', speaker: 'Théodore Vallombre', character: 'theodore', expression: 'colere', text: "J'étais à la table de jeu jusqu'à minuit. Demandez à Camille, elle perdait avec moi." }], 'interrogation') });
  }
  if (id === 'foucher') {
    c.push(present('foucher:ether', 'clu-18', "Présenter : Flacon d'éther", [{ bg: 'bg-05', speaker: 'Dr Lazare Foucher', character: 'foucher', expression: 'inquiet', text: '…' }, { bg: 'bg-05', speaker: 'Dr Lazare Foucher', character: 'foucher', expression: 'effondre', text: "Très bien. J'ai nettoyé. J'ai déplacé l'arme. J'ai arrangé la pièce. Mais je n'ai PAS tué Aldéric." }, { bg: 'bg-05', speaker: 'Inspectrice Morane', text: 'Vous maquillez une scène de crime et vous voudriez que je vous croie ?' }], 30));
    c.push(present('foucher:knife', 'clu-13', "Présenter : Coupe-papier lavé à l'éther", [{ bg: 'bg-05', speaker: 'Dr Lazare Foucher', character: 'foucher', expression: 'inquiet', text: "Oui, c'est moi qui l'ai cachée. On me l'a… mise entre les mains après coup. Je n'ai fait que la faire disparaître." }], 10));
    c.push(present('foucher:clock', 'clu-19', 'Présenter : Horloge à 23h47', [{ bg: 'bg-05', speaker: 'Dr Lazare Foucher', character: 'foucher', expression: 'neutre', text: "23h47 ? Je n'ai trouvé le corps qu'après minuit. Il était froid. Froid prend du temps." }, { bg: 'bg-05', speaker: 'Inspectrice Morane', text: "(S'il dit vrai, il est entré APRÈS le meurtre. L'incendiaire n'est pas le meurtrier.)" }], 10));
  }
  if (id === 'victor') {
    c.push(present('victor:birth', 'clu-11', 'Présenter : Acte de naissance', [{ bg: 'bg-05', speaker: 'Victor Nguyen', character: 'victor', expression: 'effondre', text: '…Vous savez donc.' }, { bg: 'bg-05', speaker: 'Victor Nguyen', character: 'victor', expression: 'effondre', text: "Oui. Je suis son fils. Le fils qu'on cache dans la marge des registres. Il m'a engagé comme secrétaire." }], 40));
    c.push(present('victor:medallion', 'clu-17', 'Présenter : Médaillon', [{ bg: 'bg-05', speaker: 'Victor Nguyen', character: 'victor', expression: 'inquiet', text: "C'est Sœur Garance qui m'a élevé. Loin d'ici. La seule à m'avoir traité comme un enfant et non comme une faute." }], 10));
    c.push(present('victor:mud', 'clu-16', 'Présenter : Boue verte de la serre', [{ bg: 'bg-05', speaker: 'Victor Nguyen', character: 'victor', expression: 'colere', text: "La serre ? J'y vais souvent. C'est le seul endroit vivant de cette maison morte." }, { bg: 'bg-05', speaker: 'Inspectrice Morane', text: '(Il s’avance trop pour se justifier. La boue, le passage, le mobile… tout converge.)' }], 20));
  }
  if (id === 'helene') {
    c.push(present('helene:debt', 'clu-07', 'Présenter : Reconnaissances de dette', [{ bg: 'bg-05', speaker: 'Hélène Vallombre', character: 'helene', expression: 'ment', text: 'Théo est faible. Je gardais ces papiers pour le protéger de lui-même.' }], 15));
    c.push(present('helene:blackmail', 'clu-09', 'Présenter : Lettre de chantage', [{ bg: 'bg-05', speaker: 'Hélène Vallombre', character: 'helene', expression: 'effondre', text: "Mon mari faisait chanter la moitié de cette maison. Moi comprise. J'ai appris à vivre avec une araignée. Je n'ai pas appris à la tuer." }], 10));
  }
  if (id === 'camille') {
    c.push(present('camille:score', 'clu-15', 'Présenter : Partition « il sait »', [{ bg: 'bg-05', speaker: 'Camille Roux', character: 'camille', expression: 'effondre', text: '« Il sait. » Oui. Aldéric savait, pour mon passé. Il me tenait par la gorge à chaque dîner.' }], 20));
    c.push(present('camille:blackmail', 'clu-09', 'Présenter : Lettre de chantage', [{ bg: 'bg-05', speaker: 'Camille Roux', character: 'camille', expression: 'inquiet', text: "Une de plus à payer. Nous étions tous ses débiteurs. Aucun de nous n'était assez courageux. Sauf un, visiblement." }], 5));
  }
  if (id === 'garance') {
    c.push(present('garance:knife', 'clu-13', 'Présenter : Coupe-papier trouvé dans SA cuisine', [{ bg: 'bg-05', speaker: 'Sœur Garance', character: 'garance', expression: 'inquiet', text: "…On l'a déposée chez moi. Je l'ai trouvée. Et Dieu me pardonne, je l'ai lavée. Pour protéger… quelqu'un." }, { bg: 'bg-05', speaker: 'Inspectrice Morane', text: "Vous protégez l'enfant que vous avez élevé. Victor." }, { bg: 'bg-05', speaker: 'Sœur Garance', character: 'garance', expression: 'effondre', text: "Je n'ai pas tenu la lame, inspectrice. Mais je n'ai pas voulu qu'on la retrouve dans sa main." }], 25));
    c.push(present('garance:medallion', 'clu-17', 'Présenter : Médaillon', [{ bg: 'bg-05', speaker: 'Sœur Garance', character: 'garance', expression: 'effondre', text: "Oui. Je l'ai élevé. Pendant qu'Aldéric le rayait de sa vie. Cet enfant n'a connu de cette famille que sa cruauté." }], 10));
  }

  c.push({ label: '↩ Le laisser', onPress: () => update((current) => ({ ...current, phase: 'hub', bg: 'bg-hall' })) });
  return c;
}

function corkboardChoices(state: VallombreRenpyState, queueLines: (lines: Line[], returnPhase: Phase, patch?: Partial<VallombreRenpyState>) => void, update: (updater: (current: VallombreRenpyState) => VallombreRenpyState) => void): Choice[] {
  const choices: Choice[] = linkDefs.map((link) => {
    const available = hasClue(state, link.first) && hasClue(state, link.second);
    const done = hasLink(state, link.id);
    return {
      label: done ? `✓ ${link.label}` : link.label,
      disabled: !available || done,
      hint: !available ? `${clueLabels[link.first]} + ${clueLabels[link.second]}` : done ? 'Déjà relié' : undefined,
      onPress: () =>
        queueLines([{ bg: 'bg-hall', speaker: 'Tableau de liège', text: link.line }], 'corkboard', {
          links: [...state.links, link.id],
          linkCount: state.linkCount + 1,
        }),
    };
  });
  choices.push({ label: '↩ Retour au hall', onPress: () => update((current) => ({ ...current, phase: 'hub', bg: 'bg-hall' })) });
  return choices;
}

function recon1Choices(queueLines: (lines: Line[], returnPhase: Phase, patch?: Partial<VallombreRenpyState>) => void): Choice[] {
  return [
    { label: 'Aldéric porte un toast', onPress: () => queueLines([{ bg: 'bg-06', speaker: 'Inspectrice Morane', text: "D'abord le toast. Puis Aldéric tend une lettre à Camille. Et alors seulement Victor se lève, livide." }, { bg: 'bg-06', speaker: 'Chronologie', text: 'Chronologie complétée : 20h–21h.' }], 'location', { chronoDiner: true, currentLocation: 'salle' }) },
    { label: 'Victor quitte la table', onPress: () => queueLines([{ bg: 'bg-06', speaker: 'Inspectrice Morane', text: 'Non. Cet ordre contredit les témoignages. Reprenons.' }], 'recon1') },
    { label: 'Camille reçoit une lettre', onPress: () => queueLines([{ bg: 'bg-06', speaker: 'Inspectrice Morane', text: 'Non. Cet ordre contredit les témoignages. Reprenons.' }], 'recon1') },
  ];
}

function recon2Choices(queueLines: (lines: Line[], returnPhase: Phase, patch?: Partial<VallombreRenpyState>) => void): Choice[] {
  return [
    { label: 'Quelqu’un venu par la bibliothèque', onPress: () => queueLines([{ bg: 'bg-07', speaker: 'Inspectrice Morane', text: "Le second verre vient du passage. L'invité d'Aldéric est entré par la bibliothèque, sans frapper. Un familier." }, { bg: 'bg-07', speaker: 'Chronologie', text: 'Chronologie complétée : 23h00.' }], 'location', { chronoVerre: true, currentLocation: 'salon' }) },
    { label: 'Personne, il buvait seul', onPress: () => queueLines([{ bg: 'bg-07', speaker: 'Inspectrice Morane', text: "Non. Les empreintes ne mentent pas, et l'éther du docteur date d'après minuit." }], 'recon2') },
    { label: 'Le docteur Foucher', onPress: () => queueLines([{ bg: 'bg-07', speaker: 'Inspectrice Morane', text: "Non. Les empreintes ne mentent pas, et l'éther du docteur date d'après minuit." }], 'recon2') },
  ];
}

function recon3Q1Choices(queueLines: (lines: Line[], returnPhase: Phase) => void, update: (updater: (current: VallombreRenpyState) => VallombreRenpyState) => void): Choice[] {
  return [
    { label: 'Entrée par le passage de la bibliothèque', onPress: () => update((current) => ({ ...current, phase: 'recon3-q2', bg: 'bg-09' })) },
    { label: 'Fuite par la fenêtre', onPress: () => queueLines([{ bg: 'bg-09', speaker: 'Inspectrice Morane', text: 'Non. La fenêtre est scellée, le tisonnier est un leurre. Reprenons depuis l’entrée.' }], 'recon3-q1') },
    { label: 'Le tisonnier frappe', onPress: () => queueLines([{ bg: 'bg-09', speaker: 'Inspectrice Morane', text: 'Non. La fenêtre est scellée, le tisonnier est un leurre. Reprenons depuis l’entrée.' }], 'recon3-q1') },
  ];
}

function recon3Q2Choices(queueLines: (lines: Line[], returnPhase: Phase) => void): Choice[] {
  return [
    { label: 'Une confrontation, des mots durs', onPress: () => queueLines([{ bg: 'bg-09', speaker: 'Inspectrice Morane', text: 'Entrée par le passage. Puis la confrontation.' }], 'recon3-q3') },
    { label: 'Un vol silencieux', onPress: () => queueLines([{ bg: 'bg-09', speaker: 'Inspectrice Morane', text: 'Non. Ça ne colle pas. Reprenons.' }], 'recon3-q1') },
  ];
}

function recon3Q3Choices(queueLines: (lines: Line[], returnPhase: Phase, patch?: Partial<VallombreRenpyState>) => void): Choice[] {
  return [
    { label: 'Fuite par le passage, boue verte au talon', onPress: () => queueLines([{ bg: 'bg-09', speaker: 'Inspectrice Morane', text: 'Entré par le passage, parti par le passage. Sans jamais toucher la porte ni la fenêtre.' }, { bg: 'bg-09', speaker: 'Chronologie', text: 'Chronologie complète. Reste un nom.' }], 'accuse-who', { chronoMeurtre: true }) },
    { label: 'Sortie par la porte, verrouillée derrière', onPress: () => queueLines([{ bg: 'bg-09', speaker: 'Inspectrice Morane', text: 'Non. La clé était dans sa poche. Reprenons.' }], 'recon3-q1') },
  ];
}

function accuseWhoChoices(update: (updater: (current: VallombreRenpyState) => VallombreRenpyState) => void): Choice[] {
  return vallombreCharacters.map((character) => ({
    label: characterNames[character.id],
    onPress: () => update((current) => ({ ...current, qui: character.id, phase: 'accuse-how' })),
  }));
}

function accuseHowChoices(state: VallombreRenpyState, update: (updater: (current: VallombreRenpyState) => VallombreRenpyState) => void): Choice[] {
  return [
    { label: "Le coupe-papier lavé à l'éther, et le passage (boue verte)", disabled: !(hasClue(state, 'clu-13') && hasClue(state, 'clu-16')), onPress: () => update((current) => ({ ...current, commentCorrect: true, phase: 'accuse-why' })) },
    { label: 'Le tisonnier du foyer', onPress: () => update((current) => ({ ...current, commentCorrect: false, phase: 'accuse-why' })) },
    { label: 'Le bidon de pétrole', onPress: () => update((current) => ({ ...current, commentCorrect: false, phase: 'accuse-why' })) },
  ];
}

function accuseWhyChoices(state: VallombreRenpyState, update: (updater: (current: VallombreRenpyState) => VallombreRenpyState) => void): Choice[] {
  return [
    { label: "Pour l'héritage et l'argent", onPress: () => update((current) => resolveEnding({ ...current, pourquoiCorrect: false })) },
    { label: 'Pour empêcher une humiliation publique — le secret de naissance', disabled: !hasClue(state, 'clu-11'), onPress: () => update((current) => resolveEnding({ ...current, pourquoiCorrect: true })) },
    { label: 'Par jalousie amoureuse', onPress: () => update((current) => resolveEnding({ ...current, pourquoiCorrect: false })) },
  ];
}

function act3Lines(state: VallombreRenpyState): Line[] {
  const lines: Line[] = [
    { bg: 'bg-08', speaker: 'Inspectrice Morane', text: 'Cette nuit, deux crimes ont été commis dans cette pièce.' },
    { bg: 'bg-08', speaker: 'Inspectrice Morane', text: 'Et pendant des heures, vous avez tous espéré que je les confonde.' },
  ];
  if (hasClue(state, 'clu-14') && hasClue(state, 'clu-18')) lines.push({ bg: 'bg-08', speaker: 'Inspectrice Morane', text: "Crime numéro deux : l'incendie. Foucher a trouvé le corps, paniqué, brûlé ses lettres et maquillé un suicide." });
  if (hasClue(state, 'clu-08') && hasClue(state, 'clu-19')) lines.push({ bg: 'bg-08', speaker: 'Inspectrice Morane', text: "Crime numéro un : à 23h47, quelqu'un a frappé Aldéric à la tempe avec le coupe-papier en argent." });
  if (hasClue(state, 'clu-06') && hasClue(state, 'clu-16')) lines.push({ bg: 'bg-08', speaker: 'Inspectrice Morane', text: 'Puis il est reparti par le passage de la bibliothèque, laissant de la boue verte sur son talon.' });
  if (hasClue(state, 'clu-11')) lines.push({ bg: 'bg-08', speaker: 'Inspectrice Morane', text: "Le mobile n'était pas l'argent. C'était un secret de famille exhibé pour humilier." });
  lines.push({ bg: 'bg-09', speaker: 'Inspectrice Morane', text: 'Reconstituons les sept dernières minutes. Ensuite, je nommerai la main.' });
  return lines;
}

function resolveEnding(state: VallombreRenpyState): VallombreRenpyState {
  let endingId: VallombreRenpyState['endingId'];
  if (state.qui === 'foucher' && !hasLink(state, 'l5') && !hasLink(state, 'l6')) endingId = 'end-e';
  else if (state.qui !== 'victor') endingId = 'end-c';
  else if (!state.commentCorrect) endingId = 'end-d';
  else if (state.commentCorrect && state.pourquoiCorrect && state.linkCount >= 7) endingId = 'end-a';
  else endingId = 'end-b';

  return {
    ...state,
    endingId,
    phase: 'ending',
    bg: endingId === 'end-e' ? 'bg-08' : 'bg-09',
    lastLine: endingLine(endingId),
  };
}

function endingLine(id: NonNullable<VallombreRenpyState['endingId']>): Line {
  const lines: Record<NonNullable<VallombreRenpyState['endingId']>, Line> = {
    'end-a': { bg: 'bg-09', speaker: 'FIN A — Les Cendres Froides', character: 'victor', expression: 'effondre', text: 'Victor avoue. Garance se dénonce pour le passage. Deux mains, un seul crime de cœur. La vérité, entière et glacée.' },
    'end-b': { bg: 'bg-09', speaker: 'FIN B — Justice Aveugle', character: 'victor', expression: 'effondre', text: 'Le bon coupable. La mauvaise vérité. Justice est faite — à demi.' },
    'end-c': { bg: 'bg-09', speaker: 'FIN C — Erreur Judiciaire', text: 'On emmène un innocent dans la neige. Et quelque part dans le manoir, la vraie main se referme, soulagée.' },
    'end-d': { bg: 'bg-09', speaker: 'FIN D — La Vérité Mutilée', character: 'victor', expression: 'inquiet', text: 'Le bon homme, condamné sur une preuve bancale. La vérité ne tiendra pas.' },
    'end-e': { bg: 'bg-08', speaker: 'FIN E — Le Silence des Notables', character: 'foucher', expression: 'effondre', text: 'Foucher porte le feu et le meurtre. Le nom de Vallombre est sauf. Le passage restera secret. L’enfant aussi.' },
  };
  return lines[id];
}

function choiceTitle(state: VallombreRenpyState) {
  if (state.queue) return 'Dialogue';
  if (state.phase === 'title') return 'Menu principal';
  if (state.phase === 'initial-bureau') return 'Bureau verrouillé';
  if (state.phase === 'hub') return 'Grand Hall';
  if (state.phase === 'locations') return 'Explorer';
  if (state.phase === 'suspects') return 'Interroger';
  if (state.phase === 'location') return locationMeta[state.currentLocation].title;
  if (state.phase === 'interrogation') return characterNames[state.currentSuspect];
  if (state.phase === 'notebook') return 'Carnet';
  if (state.phase === 'corkboard') return 'Tableau de liège';
  if (state.phase.startsWith('recon')) return 'Reconstitution';
  if (state.phase.startsWith('accuse')) return 'Accusation';
  return 'Fin';
}

function CharacterSprite({ id, expression, align }: { id: VallombreCharacterId; expression: Expression; align: 'left' | 'center' | 'right' }) {
  return <Image source={characterAssets[id][expression]} style={[styles.character, align === 'left' && styles.characterLeft, align === 'right' && styles.characterRight]} contentFit="contain" />;
}

function TopBar({ state, onBack, onNew }: { state: VallombreRenpyState; onBack: () => void; onNew: () => void }) {
  return (
    <View style={styles.topBar}>
      <Pressable onPress={onBack} style={({ pressed }) => [styles.topButton, pressed && styles.pressed]}>
        <Text style={styles.topButtonText}>Retour</Text>
      </Pressable>
      <View style={styles.titleBlock}>
        <Text style={styles.kicker}>Les Cendres de Vallombre</Text>
        <Text style={styles.subKicker}>Sauvegarde automatique • Paysage forcé • {state.clues.length}/20 indices • {state.linkCount}/7 liens</Text>
      </View>
      <Pressable onPress={onNew} style={({ pressed }) => [styles.topButton, pressed && styles.pressed]}>
        <Text style={styles.topButtonText}>Nouvelle enquête</Text>
      </Pressable>
    </View>
  );
}

function DialogueBox({ line }: { line: Line }) {
  return (
    <View style={styles.dialogue}>
      {line.speaker ? (
        <View style={styles.namebox}>
          <Text style={styles.nameText}>{line.speaker}</Text>
        </View>
      ) : null}
      <Text style={styles.dialogueText}>{line.text}</Text>
    </View>
  );
}

function ChoicePanel({ title, choices }: { title: string; choices: Choice[] }) {
  return (
    <View style={styles.choicePanel}>
      <Text style={styles.choiceTitle}>{title}</Text>
      <ScrollView contentContainerStyle={styles.choiceList}>
        {choices.map((choice, index) => (
          <Pressable key={`${choice.label}-${index}`} disabled={choice.disabled} onPress={choice.onPress} style={({ pressed }) => [styles.choiceButton, choice.disabled && styles.choiceDisabled, pressed && styles.pressed]}>
            <Text style={[styles.choiceText, choice.disabled && styles.choiceTextDisabled]}>{choice.label}</Text>
            {choice.hint ? <Text style={styles.choiceHint}>{choice.hint}</Text> : null}
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

function NotebookOverlay({ state }: { state: VallombreRenpyState }) {
  return (
    <View style={styles.overlayPanel}>
      <Text style={styles.overlayTitle}>— Carnet d’indices —</Text>
      <ScrollView contentContainerStyle={styles.clueGrid}>
        {vallombreClues.map((clue) => {
          const owned = hasClue(state, clue.id);
          return (
            <View key={clue.id} style={[styles.clueCard, !owned && styles.clueCardLocked]}>
              {owned ? <Image source={propAssets[clue.id]} style={styles.clueImage} contentFit="cover" /> : <View style={styles.cluePlaceholder} />}
              <Text style={styles.clueText}>{owned ? `${clue.id.replace('clu-', '')}. ${clue.title}` : '???'}</Text>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

function CorkboardOverlay({ state }: { state: VallombreRenpyState }) {
  return (
    <View style={styles.overlayPanel}>
      <Text style={styles.overlayTitle}>— Tableau de liège —</Text>
      <ScrollView contentContainerStyle={styles.linkList}>
        {vallombreLinks.map((link) => {
          const done = hasLink(state, link.id);
          const available = link.clueIds.every((id) => hasClue(state, id));
          return (
            <View key={link.id} style={[styles.linkCard, done && styles.linkDone, !available && styles.linkLocked]}>
              <Text style={styles.linkTitle}>{done ? '✓ ' : ''}{link.title}</Text>
              <Text style={styles.linkText}>{link.clueIds.map((id) => clueLabels[id]).join(' + ')}</Text>
              <Text style={styles.linkText}>{available ? link.unlocks : 'Indices manquants'}</Text>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

function RotateGate() {
  return (
    <View style={styles.rotateGate}>
      <Text style={styles.rotateTitle}>Tourne le téléphone</Text>
      <Text style={styles.rotateText}>Les Cendres de Vallombre se joue uniquement en paysage.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#090A0E' },
  appBackdrop: { ...StyleSheet.absoluteFill },
  appShade: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(6, 8, 12, 0.78)' },
  safe: { flex: 1, padding: 10 },
  stageShell: { flex: 1, flexDirection: 'row', gap: 10 },
  leftStage: { flex: 1, borderRadius: 8, overflow: 'hidden', borderWidth: 1, borderColor: '#B48A58', backgroundColor: '#111319' },
  sceneImage: { ...StyleSheet.absoluteFill },
  sceneShade: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(3, 5, 8, 0.18)' },
  topBar: { position: 'absolute', top: 10, left: 10, right: 10, zIndex: 5, flexDirection: 'row', alignItems: 'center', gap: 10 },
  topButton: { minHeight: 38, borderRadius: 8, borderWidth: 1, borderColor: '#D7B178', backgroundColor: 'rgba(14, 17, 23, 0.82)', paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center' },
  topButtonText: { color: '#F5E4BE', fontSize: 13, fontWeight: '900' },
  titleBlock: { flex: 1, minWidth: 0, borderRadius: 8, backgroundColor: 'rgba(7, 9, 13, 0.68)', paddingHorizontal: 12, paddingVertical: 7 },
  kicker: { color: '#F5D99F', fontSize: 18, fontWeight: '900' },
  subKicker: { color: '#BFD0D4', fontSize: 11, fontWeight: '800', marginTop: 2 },
  character: { position: 'absolute', zIndex: 2, bottom: 18, alignSelf: 'center', width: '62%', height: '88%' },
  characterLeft: { left: '5%', alignSelf: 'auto' },
  characterRight: { right: '5%', alignSelf: 'auto' },
  dialogue: { position: 'absolute', left: 18, right: 18, bottom: 18, zIndex: 6, minHeight: 120, borderRadius: 8, borderWidth: 1, borderColor: '#D7B178', backgroundColor: 'rgba(8, 10, 15, 0.9)', padding: 16, justifyContent: 'center' },
  namebox: { position: 'absolute', left: 18, top: -22, minHeight: 34, borderRadius: 7, borderWidth: 1, borderColor: '#D7B178', backgroundColor: '#151820', paddingHorizontal: 14, justifyContent: 'center' },
  nameText: { color: '#E8C98A', fontSize: 14, fontWeight: '900' },
  dialogueText: { color: '#F3E6CC', fontSize: 20, lineHeight: 28, fontWeight: '800' },
  choicePanel: { width: 330, borderRadius: 8, borderWidth: 1, borderColor: '#B48A58', backgroundColor: 'rgba(10, 12, 17, 0.94)', padding: 12 },
  choiceTitle: { color: '#E8C98A', fontSize: 19, fontWeight: '900', marginBottom: 10 },
  choiceList: { gap: 8, paddingBottom: 8 },
  choiceButton: { minHeight: 48, borderRadius: 8, borderWidth: 1, borderColor: '#6F563B', backgroundColor: 'rgba(32, 35, 43, 0.94)', paddingHorizontal: 11, paddingVertical: 9, justifyContent: 'center' },
  choiceDisabled: { opacity: 0.42 },
  choiceText: { color: '#F0DEC0', fontSize: 14, lineHeight: 18, fontWeight: '900' },
  choiceTextDisabled: { color: '#9BA3A8' },
  choiceHint: { color: '#95A9B0', fontSize: 11, lineHeight: 15, fontWeight: '800', marginTop: 4 },
  pressed: { opacity: 0.72, transform: [{ scale: 0.99 }] },
  overlayPanel: { position: 'absolute', left: 18, right: 18, top: 70, bottom: 160, zIndex: 4, borderRadius: 8, borderWidth: 1, borderColor: '#B48A58', backgroundColor: 'rgba(12, 14, 19, 0.88)', padding: 14 },
  overlayTitle: { color: '#E8C98A', fontSize: 21, fontWeight: '900', marginBottom: 10 },
  clueGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  clueCard: { width: 138, minHeight: 118, borderRadius: 8, borderWidth: 1, borderColor: '#5F4936', backgroundColor: 'rgba(32, 33, 39, 0.92)', padding: 7, gap: 6 },
  clueCardLocked: { opacity: 0.42 },
  clueImage: { width: '100%', height: 66, borderRadius: 6 },
  cluePlaceholder: { width: '100%', height: 66, borderRadius: 6, backgroundColor: '#1A2028' },
  clueText: { color: '#F0DEC0', fontSize: 11, lineHeight: 14, fontWeight: '900' },
  linkList: { gap: 8 },
  linkCard: { borderRadius: 8, borderWidth: 1, borderColor: '#5F4936', backgroundColor: 'rgba(32, 33, 39, 0.92)', padding: 10, gap: 4 },
  linkDone: { borderColor: '#D7B178', backgroundColor: 'rgba(80, 58, 36, 0.94)' },
  linkLocked: { opacity: 0.5 },
  linkTitle: { color: '#F3D99D', fontSize: 14, fontWeight: '900' },
  linkText: { color: '#C7D3D7', fontSize: 12, lineHeight: 16, fontWeight: '700' },
  rotateGate: { ...StyleSheet.absoluteFill, zIndex: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(8, 10, 14, 0.94)', padding: 24 },
  rotateTitle: { color: '#F5D99F', fontSize: 28, fontWeight: '900', textAlign: 'center' },
  rotateText: { color: '#DCE5E6', fontSize: 16, lineHeight: 23, fontWeight: '800', textAlign: 'center', marginTop: 8 },
});
