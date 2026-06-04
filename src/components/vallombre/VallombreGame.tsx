import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, Platform, Pressable, StyleSheet, Text, useWindowDimensions, View, type ImageSourcePropType } from 'react-native';

import {
  attemptVallombreLink,
  createVallombreState,
  findCharacter,
  findClue,
  findEnding,
  findLocation,
  inspectHotspot,
  isLocationUnlocked,
  presentContradiction,
  requiredLinksComplete,
  resolveVallombreEnding,
  setVerdictChoice,
  vallombreCharacters,
  vallombreDialogues,
  vallombreIntroScenes,
  vallombreLinks,
  vallombreLocations,
  type VallombreCharacterId,
  type VallombreClueId,
  type VallombreScreen,
  type VallombreState,
} from '@/game/vallombre';

const STORAGE_KEY = 'games:vallombre:state:v1';

const backgrounds: Record<string, ImageSourcePropType> = {
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
  'intro-01': require('@/assets/game/vallombre/intro-01.png'),
  'intro-02': require('@/assets/game/vallombre/intro-02.png'),
  'intro-03': require('@/assets/game/vallombre/intro-03.png'),
  'intro-04': require('@/assets/game/vallombre/intro-04.png'),
};

const props: Record<VallombreClueId, ImageSourcePropType> = {
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

const characterAssets: Record<VallombreCharacterId, Record<'neutre' | 'inquiet' | 'colere' | 'ment' | 'effondre' | 'sourire' | 'demasque', ImageSourcePropType>> = {
  helene: {
    neutre: require('@/assets/game/vallombre/char-helene-neutre.png'),
    inquiet: require('@/assets/game/vallombre/char-helene-inquiet.png'),
    colere: require('@/assets/game/vallombre/char-helene-colere.png'),
    ment: require('@/assets/game/vallombre/char-helene-ment.png'),
    effondre: require('@/assets/game/vallombre/char-helene-effondre.png'),
    sourire: require('@/assets/game/vallombre/char-helene-sourire.png'),
    demasque: require('@/assets/game/vallombre/char-helene-demasque.png'),
  },
  theodore: {
    neutre: require('@/assets/game/vallombre/char-theodore-neutre.png'),
    inquiet: require('@/assets/game/vallombre/char-theodore-inquiet.png'),
    colere: require('@/assets/game/vallombre/char-theodore-colere.png'),
    ment: require('@/assets/game/vallombre/char-theodore-ment.png'),
    effondre: require('@/assets/game/vallombre/char-theodore-effondre.png'),
    sourire: require('@/assets/game/vallombre/char-theodore-sourire.png'),
    demasque: require('@/assets/game/vallombre/char-theodore-demasque.png'),
  },
  garance: {
    neutre: require('@/assets/game/vallombre/char-garance-neutre.png'),
    inquiet: require('@/assets/game/vallombre/char-garance-inquiet.png'),
    colere: require('@/assets/game/vallombre/char-garance-colere.png'),
    ment: require('@/assets/game/vallombre/char-garance-ment.png'),
    effondre: require('@/assets/game/vallombre/char-garance-effondre.png'),
    sourire: require('@/assets/game/vallombre/char-garance-sourire.png'),
    demasque: require('@/assets/game/vallombre/char-garance-demasque.png'),
  },
  foucher: {
    neutre: require('@/assets/game/vallombre/char-foucher-neutre.png'),
    inquiet: require('@/assets/game/vallombre/char-foucher-inquiet.png'),
    colere: require('@/assets/game/vallombre/char-foucher-colere.png'),
    ment: require('@/assets/game/vallombre/char-foucher-ment.png'),
    effondre: require('@/assets/game/vallombre/char-foucher-effondre.png'),
    sourire: require('@/assets/game/vallombre/char-foucher-sourire.png'),
    demasque: require('@/assets/game/vallombre/char-foucher-demasque.png'),
  },
  victor: {
    neutre: require('@/assets/game/vallombre/char-victor-neutre.png'),
    inquiet: require('@/assets/game/vallombre/char-victor-inquiet.png'),
    colere: require('@/assets/game/vallombre/char-victor-colere.png'),
    ment: require('@/assets/game/vallombre/char-victor-ment.png'),
    effondre: require('@/assets/game/vallombre/char-victor-effondre.png'),
    sourire: require('@/assets/game/vallombre/char-victor-sourire.png'),
    demasque: require('@/assets/game/vallombre/char-victor-demasque.png'),
  },
  camille: {
    neutre: require('@/assets/game/vallombre/char-camille-neutre.png'),
    inquiet: require('@/assets/game/vallombre/char-camille-inquiet.png'),
    colere: require('@/assets/game/vallombre/char-camille-colere.png'),
    ment: require('@/assets/game/vallombre/char-camille-ment.png'),
    effondre: require('@/assets/game/vallombre/char-camille-effondre.png'),
    sourire: require('@/assets/game/vallombre/char-camille-sourire.png'),
    demasque: require('@/assets/game/vallombre/char-camille-demasque.png'),
  },
};

const phaseLabels: Record<VallombreState['phase'], string> = {
  matin: 'Matin',
  'apres-midi': 'Après-midi',
  soir: 'Soir',
  nuit: 'Nuit blanche',
};

type GuidanceAction =
  | { kind: 'location'; id: VallombreState['currentLocationId']; label: string }
  | { kind: 'screen'; screen: VallombreScreen; label: string }
  | { kind: 'character'; id: VallombreCharacterId; label: string };

type VallombreGuidance = {
  title: string;
  text: string;
  reward: string;
  action?: GuidanceAction;
  checklist: string[];
};

const officePrimerClues: VallombreClueId[] = ['clu-01', 'clu-03', 'clu-04', 'clu-19'];
const requiredLinkIds = ['l1', 'l2', 'l3', 'l4'] as const;

type VallombreGameProps = {
  startMode?: 'new' | 'resume';
};

export function VallombreGame({ startMode }: VallombreGameProps) {
  const { width } = useWindowDimensions();
  const sceneWidth = Math.min(width - 48, 860);
  const sceneHeight = sceneWidth * 0.5625;
  const [hydrated, setHydrated] = useState(false);
  const [state, setState] = useState<VallombreState>(() => createVallombreState());
  const [selectedClues, setSelectedClues] = useState<VallombreClueId[]>([]);
  const [notebookTab, setNotebookTab] = useState<'indices' | 'profils' | 'chrono' | 'plan'>('indices');
  const stateRef = useRef(state);
  const hydratedRef = useRef(false);
  const startModeHandledRef = useRef(false);

  const saveState = useCallback(async (nextState: VallombreState) => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
  }, []);

  const commitState = useCallback(
    (nextStateOrUpdater: VallombreState | ((current: VallombreState) => VallombreState)) => {
      setState((current) => {
        const nextState = typeof nextStateOrUpdater === 'function' ? nextStateOrUpdater(current) : nextStateOrUpdater;
        stateRef.current = nextState;

        if (hydratedRef.current) {
          saveState(nextState).catch(() => undefined);
        }

        return nextState;
      });
    },
    [saveState],
  );

  useEffect(() => {
    let mounted = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (!raw || !mounted) return;
        const parsed = JSON.parse(raw) as VallombreState;
        if (parsed?.screen && Array.isArray(parsed.discoveredClues)) {
          const restored = {
            ...createVallombreState(),
            ...parsed,
            introStep: Number.isInteger(parsed.introStep) ? parsed.introStep : 0,
          };
          stateRef.current = restored;
          setState(restored);
        }
      })
      .catch(() => undefined)
      .finally(() => {
        if (mounted) {
          hydratedRef.current = true;
          setHydrated(true);
          saveState(stateRef.current).catch(() => undefined);
        }
      });
    return () => {
      mounted = false;
    };
  }, [saveState]);

  useEffect(() => {
    if (!hydrated) return;
    stateRef.current = state;
    saveState(state).catch(() => undefined);
  }, [hydrated, saveState, state]);

  useEffect(() => {
    if (!hydrated || startModeHandledRef.current) {
      return;
    }

    startModeHandledRef.current = true;
    if (startMode === 'new') {
      const fresh = createVallombreState();
      commitState({ ...fresh, screen: 'intro', introStep: 0 });
    }
  }, [commitState, hydrated, startMode]);

  useEffect(() => {
    const flush = () => {
      if (hydratedRef.current) {
        saveState(stateRef.current).catch(() => undefined);
      }
    };

    const subscription = AppState.addEventListener('change', (status) => {
      if (status !== 'active') {
        flush();
      }
    });
    const interval = setInterval(flush, 5000);

    if (Platform.OS === 'web') {
      globalThis.addEventListener?.('beforeunload', flush);
      globalThis.addEventListener?.('pagehide', flush);
      document?.addEventListener?.('visibilitychange', flush);
    }

    return () => {
      subscription.remove();
      clearInterval(interval);
      if (Platform.OS === 'web') {
        globalThis.removeEventListener?.('beforeunload', flush);
        globalThis.removeEventListener?.('pagehide', flush);
        document?.removeEventListener?.('visibilitychange', flush);
      }
    };
  }, [saveState]);

  const discovered = useMemo(() => state.discoveredClues.map(findClue), [state.discoveredClues]);
  const canAccuse = requiredLinksComplete(state);
  const guidance = useMemo(() => getVallombreGuidance(state), [state]);

  const patchState = useCallback((patch: Partial<VallombreState>) => {
    commitState((current) => ({ ...current, ...patch }));
  }, [commitState]);

  function newGame() {
    const fresh = createVallombreState();
    setSelectedClues([]);
    commitState({ ...fresh, screen: 'intro', introStep: 0 });
  }

  function go(screen: VallombreScreen) {
    patchState({ screen });
  }

  function openLocation(id: VallombreState['currentLocationId']) {
    if (!isLocationUnlocked(state, id)) return;
    patchState({ currentLocationId: id, screen: 'location', lastMessage: findLocation(id).summary });
  }

  function openCharacter(id: VallombreCharacterId) {
    patchState({ currentCharacterId: id, screen: 'dialogue', lastMessage: findCharacter(id).intro });
  }

  function runGuidanceAction() {
    if (!guidance?.action) {
      return;
    }

    if (guidance.action.kind === 'location') {
      openLocation(guidance.action.id);
      return;
    }

    if (guidance.action.kind === 'character') {
      openCharacter(guidance.action.id);
      return;
    }

    go(guidance.action.screen);
  }

  function inspect(id: string) {
    commitState((current) => inspectHotspot(current, id));
  }

  function advanceIntro() {
    const nextStep = state.introStep + 1;
    if (nextStep >= vallombreIntroScenes.length) {
      patchState({
        screen: 'hub',
        introStep: vallombreIntroScenes.length - 1,
        lastMessage: 'Le hall devient ton point de départ. Fouille le bureau, interroge les suspects, puis relie les indices.',
      });
      return;
    }

    patchState({
      introStep: nextStep,
      lastMessage: vallombreIntroScenes[nextStep].title,
    });
  }

  function skipIntro() {
    patchState({
      screen: 'hub',
      introStep: vallombreIntroScenes.length - 1,
      lastMessage: 'Morane entre dans le hall. La maison est close, les suspects aussi.',
    });
  }

  function chooseClueForLink(id: VallombreClueId) {
    setSelectedClues((current) => {
      if (current.includes(id)) return current.filter((clueId) => clueId !== id);
      const next = [...current, id].slice(-2);
      if (next.length === 2) {
        commitState((currentState) => attemptVallombreLink(currentState, next[0], next[1]));
        return [];
      }
      return next;
    });
  }

  if (state.screen === 'title') {
    return <TitleScreen hydrated={hydrated} onNewGame={newGame} onContinue={() => go('hub')} />;
  }

  return (
    <View style={styles.root}>
      <Image source={backgrounds['bg-01']} style={styles.backdrop} contentFit="cover" />
      <View style={styles.tint} />
      <View style={styles.topBar}>
        <View style={styles.brand}>
          <Text style={styles.kicker}>Vallombre</Text>
          <Text numberOfLines={2} style={styles.title}>
            Les Cendres de Vallombre
          </Text>
        </View>
        <View style={styles.clock}>
          <Text style={styles.clockLabel}>Phase</Text>
          <Text style={styles.clockValue}>{phaseLabels[state.phase]}</Text>
        </View>
      </View>

      {state.screen !== 'ending' && state.screen !== 'intro' ? (
        <View style={styles.nav}>
          <NavButton label="Hall" active={state.screen === 'hub'} onPress={() => go('hub')} />
          <NavButton label="Carnet" active={state.screen === 'notebook'} onPress={() => go('notebook')} />
          <NavButton label="Tableau" active={state.screen === 'corkboard'} onPress={() => go('corkboard')} />
          <NavButton label="Accuser" active={state.screen === 'verdict'} disabled={!canAccuse} onPress={() => go('verdict')} />
        </View>
      ) : null}

      {state.screen !== 'intro' ? (
        <View style={styles.messagePanel}>
          <Text style={styles.messageText}>{state.lastMessage}</Text>
          <Text style={styles.saveText}>Sauvegarde automatique</Text>
        </View>
      ) : null}

      {guidance && state.screen !== 'intro' && state.screen !== 'ending' ? (
        <GuidancePanel state={state} guidance={guidance} onAction={runGuidanceAction} />
      ) : null}

      {state.screen === 'intro' && <IntroScreen step={state.introStep} onNext={advanceIntro} onSkip={skipIntro} />}
      {state.screen === 'hub' && <HubScreen state={state} onLocation={openLocation} onCharacter={openCharacter} />}
      {state.screen === 'location' && <LocationScreen state={state} sceneWidth={sceneWidth} sceneHeight={sceneHeight} onInspect={inspect} onBack={() => go('hub')} />}
      {state.screen === 'dialogue' && <DialogueScreen state={state} onPresent={(characterId, topicId, clueId, suspicion, response) => commitState((current) => presentContradiction(current, characterId, topicId, clueId, suspicion, response))} onBack={() => go('hub')} />}
      {state.screen === 'notebook' && <NotebookScreen state={state} discovered={discovered} tab={notebookTab} onTab={setNotebookTab} />}
      {state.screen === 'corkboard' && <CorkboardScreen state={state} selectedClues={selectedClues} onSelect={chooseClueForLink} />}
      {state.screen === 'verdict' && <VerdictScreen state={state} onChoice={(key, value) => commitState((current) => setVerdictChoice(current, key, value))} onResolve={() => commitState(resolveVallombreEnding)} />}
      {state.screen === 'ending' && <EndingScreen state={state} onRestart={newGame} />}
    </View>
  );
}

function getVallombreGuidance(state: VallombreState): VallombreGuidance | null {
  if (state.screen === 'title' || state.screen === 'intro' || state.screen === 'ending') {
    return null;
  }

  const has = (id: VallombreClueId) => state.discoveredClues.includes(id);
  const linked = (id: (typeof requiredLinkIds)[number] | 'l5' | 'l6' | 'l7') => state.correctLinks.includes(id);
  const missingOfficePrimer = officePrimerClues.filter((id) => !has(id));

  if (missingOfficePrimer.length > 0) {
    return {
      title: 'Lire la scène de crime',
      text: 'Commence par les preuves qui rendent le bureau impossible: feu, clé, fenêtre et heure du décès.',
      reward: 'Tu comprendras pourquoi la pièce verrouillée ne peut pas être un simple suicide.',
      action: { kind: 'location', id: 'loc-03', label: 'Fouiller le bureau' },
      checklist: missingOfficePrimer.map((id) => findClue(id).title),
    };
  }

  if (!has('clu-05')) {
    return {
      title: 'Chercher ce qui contredit le huis clos',
      text: 'La fenêtre et la clé ferment deux pistes. Il reste à trouver ce qui trahit une autre entrée.',
      reward: 'Un nouvel accès logique apparaîtra vers la bibliothèque.',
      action: { kind: 'location', id: 'loc-03', label: 'Inspecter le bureau' },
      checklist: ['Trouver le courant d’air anormal'],
    };
  }

  if (!has('clu-06')) {
    return {
      title: 'Suivre le courant d’air',
      text: 'Le bureau indique une autre entrée. La bibliothèque est la pièce qui peut cacher un passage.',
      reward: 'Avec deux indices compatibles, tu pourras établir ton premier fil rouge.',
      action: { kind: 'location', id: 'loc-04', label: 'Aller à la bibliothèque' },
      checklist: ['Inspecter l’étagère décalée'],
    };
  }

  if (!linked('l1')) {
    return {
      title: 'Établir le premier lien',
      text: 'Deux indices parlent du même phénomène. Relie-les sur le Tableau de Liège.',
      reward: 'Le grenier et la cave se débloqueront, et l’enquête passera à la phase suivante.',
      action: { kind: 'screen', screen: 'corkboard', label: 'Relier les indices' },
      checklist: ['Courant d’air anormal', 'Étagère pivotante'],
    };
  }

  if (!has('clu-20')) {
    return {
      title: 'Reconstituer la dernière heure',
      text: 'L’horloge donne une heure. Il faut maintenant savoir si Aldéric était seul juste avant.',
      reward: 'La chronologie de 23h commencera à tenir.',
      action: { kind: 'location', id: 'loc-06', label: 'Fouiller le salon' },
      checklist: ['Trouver le verre de cognac'],
    };
  }

  if (!linked('l2')) {
    return {
      title: 'Fixer la chronologie',
      text: 'L’heure arrêtée et le dernier verre doivent être recoupés.',
      reward: 'La soirée cessera d’être vague: le meurtre aura une fenêtre précise.',
      action: { kind: 'screen', screen: 'corkboard', label: 'Relier la chronologie' },
      checklist: ['Horloge 23h47', 'Verre de cognac'],
    };
  }

  if (!has('clu-13')) {
    return {
      title: 'Trouver la vraie arme',
      text: 'Le tisonnier est trop propre. Cherche l’objet qui manque puis celui qui a été lavé.',
      reward: 'Tu sépareras le meurtre de la mise en scène.',
      action: { kind: 'location', id: 'loc-07', label: 'Fouiller la cuisine' },
      checklist: ['Coupe-papier lavé'],
    };
  }

  if (!linked('l3')) {
    return {
      title: 'Identifier la scène maquillée',
      text: 'L’éther et l’arme lavée ne disent pas forcément qui a tué. Ils disent qui a manipulé la scène.',
      reward: 'Tu éviteras de confondre incendiaire, maquilleur et assassin.',
      action: { kind: 'screen', screen: 'corkboard', label: 'Relier éther et arme' },
      checklist: ['Coupe-papier lavé', 'Flacon d’éther'],
    };
  }

  if (!has('clu-10')) {
    return {
      title: 'Chercher la trace du passage',
      text: 'Le passage existe. Il faut maintenant prouver que quelqu’un l’a utilisé cette nuit.',
      reward: 'La fuite du tueur commencera à se dessiner.',
      action: { kind: 'location', id: 'loc-04', label: 'Retour bibliothèque' },
      checklist: ['Talon dans la poussière'],
    };
  }

  if (!has('clu-16')) {
    return {
      title: 'Suivre la boue',
      text: 'Une trace seule ne suffit pas. Il faut l’origine de cette matière.',
      reward: 'Tu pourras prouver par où le tueur est reparti.',
      action: { kind: 'location', id: 'loc-08', label: 'Aller à la serre' },
      checklist: ['Boue verte'],
    };
  }

  if (!linked('l4')) {
    return {
      title: 'Fermer le trajet du tueur',
      text: 'Relie la trace de bibliothèque à la terre de serre.',
      reward: 'Les quatre déductions obligatoires seront établies: l’accusation devient défendable.',
      action: { kind: 'screen', screen: 'corkboard', label: 'Relier la fuite' },
      checklist: ['Talon dans la poussière', 'Boue verte'],
    };
  }

  const contradiction = findAvailableContradiction(state);
  if (contradiction) {
    return {
      title: 'Faire craquer un suspect',
      text: 'Tu as une preuve qui contredit une déclaration. Présente-la pour transformer un indice en pression.',
      reward: 'La jauge de suspicion montera et un mensonge deviendra exploitable.',
      action: { kind: 'character', id: contradiction.characterId, label: `Interroger ${findCharacter(contradiction.characterId).name}` },
      checklist: [contradiction.topicLabel, findClue(contradiction.clueId).title],
    };
  }

  if (!has('clu-11')) {
    return {
      title: 'Chercher le mobile profond',
      text: 'Tu peux accuser, mais la meilleure vérité demande le secret de naissance.',
      reward: 'Le mobile de Victor deviendra compréhensible, pas seulement plausible.',
      action: { kind: 'location', id: 'loc-11', label: 'Fouiller le grenier' },
      checklist: ['Acte de naissance'],
    };
  }

  if (!has('clu-17')) {
    return {
      title: 'Compléter le secret de famille',
      text: 'L’acte de naissance donne un nom. Il faut encore comprendre qui a protégé l’enfant.',
      reward: 'Garance cessera d’être une simple gouvernante dans l’histoire.',
      action: { kind: 'location', id: 'loc-10', label: 'Fouiller la chambre de Victor' },
      checklist: ['Médaillon'],
    };
  }

  if (!linked('l5')) {
    return {
      title: 'Relier filiation et protection',
      text: 'Ces deux preuves racontent le même secret vu de deux côtés.',
      reward: 'Tu débloqueras une lecture plus complète du mobile.',
      action: { kind: 'screen', screen: 'corkboard', label: 'Relier le secret familial' },
      checklist: ['Acte de naissance', 'Médaillon'],
    };
  }

  return {
    title: 'Préparer l’accusation',
    text: 'Les déductions nécessaires sont établies. Choisis qui a tué, comment, et pourquoi.',
    reward: state.correctLinks.length >= 7 ? 'Tous les fils sont prêts pour la meilleure vérité.' : 'Tu peux finir maintenant ou chercher les liens optionnels restants.',
    action: { kind: 'screen', screen: 'verdict', label: 'Rendre le verdict' },
    checklist: ['Qui ?', 'Comment ?', 'Pourquoi ?'],
  };
}

function findAvailableContradiction(state: VallombreState) {
  for (const dialogue of vallombreDialogues) {
    for (const topic of dialogue.topics) {
      if (!topic.contradiction) {
        continue;
      }

      const key = `${dialogue.characterId}:${topic.id}`;
      if (state.discoveredClues.includes(topic.contradiction.clueId) && !state.presentedContradictions.includes(key)) {
        return {
          characterId: dialogue.characterId,
          topicLabel: topic.label,
          clueId: topic.contradiction.clueId,
        };
      }
    }
  }

  return null;
}

function TitleScreen({ hydrated, onNewGame, onContinue }: { hydrated: boolean; onNewGame: () => void; onContinue: () => void }) {
  return (
    <View style={styles.titleRoot}>
      <Image source={backgrounds['bg-01']} style={styles.titleImage} contentFit="cover" />
      <View style={styles.titleShade} />
      <View style={styles.titleCopy}>
        <Text style={styles.titleKicker}>Hiver 1924</Text>
        <Text numberOfLines={2} style={styles.titleLogo}>
          Les Cendres de Vallombre
        </Text>
        <Text style={styles.titleLead}>Six suspects, une pièce verrouillée, une vérité brûlée dans le foyer.</Text>
        <View style={styles.titleActions}>
          <PrimaryButton label="Nouvelle enquête" onPress={onNewGame} />
          <SecondaryButton label="Reprendre" disabled={!hydrated} onPress={onContinue} />
        </View>
      </View>
    </View>
  );
}

function IntroScreen({ step, onNext, onSkip }: { step: number; onNext: () => void; onSkip: () => void }) {
  const safeStep = Math.max(0, Math.min(vallombreIntroScenes.length - 1, step));
  const scene = vallombreIntroScenes[safeStep];
  const isLast = safeStep === vallombreIntroScenes.length - 1;

  return (
    <View style={styles.introRoot}>
      <Image source={backgrounds[scene.image]} style={styles.introImage} contentFit="cover" />
      <View style={styles.introShade} />
      <View style={styles.introProgress}>
        {vallombreIntroScenes.map((item, index) => (
          <View key={item.id} style={[styles.introDot, index <= safeStep && styles.introDotActive]} />
        ))}
      </View>
      <View style={styles.introPanel}>
        <Text style={styles.introKicker}>Prologue</Text>
        <Text style={styles.introTitle}>{scene.title}</Text>
        <Text style={styles.introText}>{scene.text}</Text>
        <View style={styles.introActions}>
          <SecondaryButton label="Passer" onPress={onSkip} />
          <PrimaryButton label={isLast ? 'Entrer dans le hall' : 'Continuer'} onPress={onNext} />
        </View>
      </View>
    </View>
  );
}

function GuidancePanel({ state, guidance, onAction }: { state: VallombreState; guidance: VallombreGuidance; onAction: () => void }) {
  const requiredDone = requiredLinkIds.filter((id) => state.correctLinks.includes(id)).length;
  const contradictionsDone = state.presentedContradictions.length;

  return (
    <View style={styles.guidancePanel}>
      <View style={styles.guidanceHeader}>
        <View style={styles.guidanceCopy}>
          <Text style={styles.guidanceKicker}>Objectif actuel</Text>
          <Text style={styles.guidanceTitle}>{guidance.title}</Text>
        </View>
      </View>
      <Text style={styles.guidanceText}>{guidance.text}</Text>
      <View style={styles.rewardBox}>
        <Text style={styles.rewardLabel}>Pourquoi maintenant</Text>
        <Text style={styles.rewardText}>{guidance.reward}</Text>
      </View>
      <View style={styles.checklistRow}>
        {guidance.checklist.map((item) => (
          <View key={item} style={styles.checkItem}>
            <Text style={styles.checkText}>{item}</Text>
          </View>
        ))}
      </View>
      <View style={styles.progressGrid}>
        <ProgressStat label="Indices" value={state.discoveredClues.length} total={20} />
        <ProgressStat label="Liens clés" value={requiredDone} total={4} />
        <ProgressStat label="Pressions" value={contradictionsDone} total={8} />
      </View>
      {guidance.action ? (
        <View style={styles.guidanceActionRow}>
          <PrimaryButton label={guidance.action.label} onPress={onAction} />
        </View>
      ) : null}
    </View>
  );
}

function ProgressStat({ label, value, total }: { label: string; value: number; total: number }) {
  const pct = Math.min(100, (value / total) * 100);

  return (
    <View style={styles.progressStat}>
      <View style={styles.progressStatHeader}>
        <Text style={styles.progressLabel}>{label}</Text>
        <Text style={styles.progressValue}>{value}/{total}</Text>
      </View>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${pct}%` }]} />
      </View>
    </View>
  );
}

function HubScreen({ state, onLocation, onCharacter }: { state: VallombreState; onLocation: (id: VallombreState['currentLocationId']) => void; onCharacter: (id: VallombreCharacterId) => void }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Grand Hall</Text>
      <Text style={styles.sectionText}>Choisis une pièce à fouiller ou un suspect à interroger. Les zones verrouillées s’ouvrent par déduction.</Text>
      <DiscoveryManual />
      <View style={styles.locationGrid}>
        {vallombreLocations.map((location) => {
          const unlocked = isLocationUnlocked(state, location.id);
          const foundHere = state.discoveredClues.filter((clueId) => findClue(clueId).locationId === location.id).length;
          return (
            <Pressable key={location.id} disabled={!unlocked} onPress={() => onLocation(location.id)} style={({ pressed }) => [styles.locationCard, !unlocked && styles.lockedCard, pressed && styles.pressed]}>
              <Image source={backgrounds[location.bg]} style={styles.locationThumb} contentFit="cover" />
              <View style={styles.locationOverlay} />
              <Text style={styles.cardTitle}>{location.title}</Text>
              <Text style={styles.cardMeta}>{unlocked ? `${foundHere}/${location.hotspots.filter((hotspot) => hotspot.clueId).length} indices` : 'Verrouillé par le tableau'}</Text>
            </Pressable>
          );
        })}
      </View>
      <Text style={styles.sectionTitle}>Suspects</Text>
      <View style={styles.suspectGrid}>
        {vallombreCharacters.map((character) => (
          <Pressable key={character.id} onPress={() => onCharacter(character.id)} style={({ pressed }) => [styles.suspectCard, pressed && styles.pressed]}>
            <Image source={characterAssets[character.id].neutre} style={styles.suspectBust} contentFit="contain" />
            <View style={styles.suspectCopy}>
              <Text style={styles.cardTitle}>{character.name}</Text>
              <Text style={styles.cardMeta}>{character.role}</Text>
              <SuspicionMeter value={state.suspicion[character.id]} />
            </View>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function DiscoveryManual() {
  const concepts = [
    {
      title: 'Hall',
      text: 'Point central. Reviens ici pour choisir une pièce, un suspect ou relancer ton enquête depuis la boussole.',
    },
    {
      title: 'Carnet',
      text: 'Inventaire vivant. Chaque indice trouvé y garde sa provenance, ce qu’il prouve et les profils concernés.',
    },
    {
      title: 'Tableau',
      text: 'Espace de déduction. Sélectionne deux indices liés pour créer un fil rouge et débloquer la suite.',
    },
    {
      title: 'Interrogatoire',
      text: 'Les suspects mentent sur un détail. Présente la bonne preuve quand le bouton apparaît.',
    },
  ];

  return (
    <View style={styles.manualPanel}>
      <View style={styles.manualHeader}>
        <Text style={styles.manualTitle}>Comment avancer</Text>
        <Text style={styles.manualMeta}>Boucle courte</Text>
      </View>
      <Text style={styles.manualLead}>Observe une pièce, prends un indice, lis le carnet, puis relie ou présente cette preuve. Le jeu indique toujours le prochain fil utile sans donner directement la solution finale.</Text>
      <View style={styles.manualGrid}>
        {concepts.map((concept) => (
          <View key={concept.title} style={styles.manualCard}>
            <Text style={styles.manualCardTitle}>{concept.title}</Text>
            <Text style={styles.manualCardText}>{concept.text}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function LocationScreen({ state, sceneWidth, sceneHeight, onInspect, onBack }: { state: VallombreState; sceneWidth: number; sceneHeight: number; onInspect: (id: string) => void; onBack: () => void }) {
  const location = findLocation(state.currentLocationId);
  const uninspected = location.hotspots.filter((hotspot) => !state.inspectedHotspots.includes(`${location.id}:${hotspot.id}`));

  return (
    <View style={styles.section}>
      <View style={styles.rowHeader}>
        <View>
          <Text style={styles.sectionTitle}>{location.title}</Text>
          <Text style={styles.sectionText}>{location.summary}</Text>
        </View>
        <SecondaryButton label="Retour" onPress={onBack} />
      </View>
      <View style={styles.roomGuide}>
        <Text style={styles.roomGuideTitle}>{uninspected.length > 0 ? 'À examiner dans cette pièce' : 'Pièce entièrement inspectée'}</Text>
        <Text style={styles.roomGuideText}>
          {uninspected.length > 0
            ? uninspected.map((hotspot) => hotspot.label).join(' · ')
            : 'Reviens au hall, au carnet ou au tableau pour transformer ces indices en déductions.'}
        </Text>
      </View>
      <View style={[styles.sceneFrame, { width: sceneWidth, height: sceneHeight }]}>
        <Image source={backgrounds[location.bg]} style={styles.sceneImage} contentFit="cover" />
        {location.hotspots.map((hotspot) => {
          const inspected = state.inspectedHotspots.includes(`${location.id}:${hotspot.id}`);
          return (
            <Pressable
              key={hotspot.id}
              accessibilityRole="button"
              accessibilityLabel={hotspot.label}
              onPress={() => onInspect(hotspot.id)}
              style={({ pressed }) => [
                styles.hotspot,
                { left: `${hotspot.x}%`, top: `${hotspot.y}%` },
                inspected && styles.hotspotInspected,
                pressed && styles.pressed,
              ]}>
              <Image source={require('@/assets/game/vallombre/ui-hotspot.png')} style={styles.hotspotImage} contentFit="contain" />
              <Text style={styles.hotspotLabel}>{hotspot.label}</Text>
            </Pressable>
          );
        })}
      </View>
      <View style={styles.clueStrip}>
        {state.discoveredClues
          .map(findClue)
          .filter((clue) => clue.locationId === location.id)
          .map((clue) => (
            <MiniClue key={clue.id} id={clue.id} />
          ))}
      </View>
    </View>
  );
}

function DialogueScreen({ state, onPresent, onBack }: { state: VallombreState; onPresent: (characterId: VallombreCharacterId, topicId: string, clueId: VallombreClueId, suspicion: number, response: string) => void; onBack: () => void }) {
  const character = findCharacter(state.currentCharacterId);
  const dialogue = vallombreDialogues.find((item) => item.characterId === character.id);
  const expression = state.suspicion[character.id] >= 70 ? 'demasque' : state.presentedContradictions.some((key) => key.startsWith(`${character.id}:`)) ? 'ment' : 'neutre';

  return (
    <View style={styles.dialogueLayout}>
      <View style={styles.characterStage}>
        <Image source={backgrounds['bg-05']} style={styles.characterBack} contentFit="cover" />
        <Image source={characterAssets[character.id][expression]} style={styles.characterSprite} contentFit="contain" />
      </View>
      <View style={styles.dialoguePanel}>
        <View style={styles.rowHeader}>
          <View>
            <Text style={styles.sectionTitle}>{character.name}</Text>
            <Text style={styles.sectionText}>{character.role} · {character.secret}</Text>
          </View>
          <SecondaryButton label="Retour" onPress={onBack} />
        </View>
        <Text style={styles.statement}>{character.intro}</Text>
        {dialogue?.topics.map((topic) => {
          const contradiction = topic.contradiction;
          const canPresent = contradiction ? state.discoveredClues.includes(contradiction.clueId) : false;
          const done = state.presentedContradictions.includes(`${character.id}:${topic.id}`);
          return (
            <View key={topic.id} style={styles.topicCard}>
              <Text style={styles.topicLabel}>{topic.label}</Text>
              <Text style={styles.topicStatement}>{topic.statement}</Text>
              {contradiction ? (
                <Pressable
                  disabled={!canPresent || done}
                  onPress={() => onPresent(character.id, topic.id, contradiction.clueId, contradiction.suspicion, contradiction.response)}
                  style={({ pressed }) => [styles.proofButton, (!canPresent || done) && styles.disabledButton, pressed && styles.pressed]}>
                  <Text style={styles.proofText}>{done ? 'Contradiction établie' : canPresent ? `Présenter: ${findClue(contradiction.clueId).title}` : 'Indice manquant'}</Text>
                </Pressable>
              ) : null}
            </View>
          );
        })}
      </View>
    </View>
  );
}

function NotebookScreen({ state, discovered, tab, onTab }: { state: VallombreState; discovered: ReturnType<typeof findClue>[]; tab: 'indices' | 'profils' | 'chrono' | 'plan'; onTab: (tab: 'indices' | 'profils' | 'chrono' | 'plan') => void }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Carnet de Morane</Text>
      <View style={styles.notebookHelp}>
        <Text style={styles.notebookHelpTitle}>À quoi sert le carnet ?</Text>
        <Text style={styles.notebookHelpText}>
          Les indices ne sont jamais consommés. Utilise-les pour comprendre ce qu’ils prouvent, les présenter aux suspects, puis les relier sur le Tableau de Liège.
        </Text>
      </View>
      <View style={styles.tabRow}>
        {(['indices', 'profils', 'chrono', 'plan'] as const).map((item) => (
          <NavButton key={item} label={item} active={tab === item} onPress={() => onTab(item)} />
        ))}
      </View>
      {tab === 'indices' ? (
        <View style={styles.clueGrid}>
          {discovered.map((clue) => (
            <View key={clue.id} style={styles.clueCard}>
              <Image source={props[clue.id]} style={styles.clueImage} contentFit="cover" />
              <Text style={styles.cardTitle}>{clue.title}</Text>
              <Text style={styles.cardMeta}>{findLocation(clue.locationId).title}</Text>
              <Text style={styles.cardText}>{clue.proves}</Text>
            </View>
          ))}
          {discovered.length === 0 ? <Text style={styles.emptyText}>Aucun indice découvert.</Text> : null}
        </View>
      ) : null}
      {tab === 'profils' ? (
        <View style={styles.profileList}>
          {vallombreCharacters.map((character) => (
            <View key={character.id} style={styles.profileRow}>
              <Image source={characterAssets[character.id].inquiet} style={styles.profileFace} contentFit="contain" />
              <View style={styles.profileCopy}>
                <Text style={styles.cardTitle}>{character.name}</Text>
                <Text style={styles.cardText}>{character.role}. {character.secret}</Text>
                <SuspicionMeter value={state.suspicion[character.id]} />
              </View>
            </View>
          ))}
        </View>
      ) : null}
      {tab === 'chrono' ? <Timeline state={state} /> : null}
      {tab === 'plan' ? <MapView state={state} /> : null}
    </View>
  );
}

function CorkboardScreen({ state, selectedClues, onSelect }: { state: VallombreState; selectedClues: VallombreClueId[]; onSelect: (id: VallombreClueId) => void }) {
  const discovered = state.discoveredClues.map(findClue);
  return (
    <View style={styles.section}>
      <Image source={require('@/assets/game/vallombre/ui-cork.png')} style={styles.panelTexture} contentFit="cover" />
      <Text style={styles.sectionTitle}>Tableau de Liège</Text>
      <Text style={styles.sectionText}>Choisis deux indices dans la banque compacte. Si le lien est juste, le fil rouge est ajouté et une nouvelle étape s’ouvre.</Text>
      <View style={styles.corkSelectionBar}>
        <Text style={styles.corkSelectionTitle}>Sélection active</Text>
        <Text style={styles.corkSelectionText}>
          {selectedClues.length > 0 ? selectedClues.map((id) => findClue(id).title).join(' ↔ ') : 'Aucun indice sélectionné'}
        </Text>
      </View>
      <View style={styles.corkboardLayout}>
        <View style={styles.corkClueBank}>
          <Text style={styles.corkColumnTitle}>Indices découverts</Text>
          <View style={styles.compactPinGrid}>
            {discovered.map((clue) => (
              <Pressable key={clue.id} onPress={() => onSelect(clue.id)} style={({ pressed }) => [styles.compactPinCard, selectedClues.includes(clue.id) && styles.compactPinSelected, pressed && styles.pressed]}>
                <Image source={props[clue.id]} style={styles.compactPinImage} contentFit="cover" />
                <View style={styles.compactPinCopy}>
                  <Text numberOfLines={2} style={styles.compactPinTitle}>{clue.title}</Text>
                  <Text numberOfLines={1} style={styles.compactPinMeta}>{findLocation(clue.locationId).title}</Text>
                </View>
              </Pressable>
            ))}
            {discovered.length === 0 ? <Text style={styles.emptyText}>Fouille le bureau pour épingler tes premiers indices.</Text> : null}
          </View>
        </View>

        <View style={styles.corkLinksColumn}>
          <Text style={styles.corkColumnTitle}>Fils rouges</Text>
          <View style={styles.linksList}>
            {vallombreLinks.map((link) => {
              const established = state.correctLinks.includes(link.id);
              const ready = link.clueIds.every((id) => state.discoveredClues.includes(id));
              return (
                <View key={link.id} style={[styles.linkRow, established && styles.linkRowDone, !ready && styles.linkRowMuted]}>
                  <Text style={styles.linkTitle}>{established ? '✓ ' : ready ? '• ' : '○ '}{link.title}</Text>
                  <Text style={styles.linkText}>{ready ? link.clueIds.map((id) => findClue(id).title).join(' ↔ ') : 'Indices encore manquants'}</Text>
                </View>
              );
            })}
          </View>
        </View>
      </View>
    </View>
  );
}

function VerdictScreen({ state, onChoice, onResolve }: { state: VallombreState; onChoice: (key: 'who' | 'how' | 'why', value: VallombreCharacterId | VallombreClueId) => void; onResolve: () => void }) {
  const discovered = state.discoveredClues.map(findClue);
  return (
    <View style={styles.section}>
      <Image source={backgrounds['bg-08']} style={styles.verdictBack} contentFit="cover" />
      <Text style={styles.sectionTitle}>Accusation</Text>
      <Text style={styles.sectionText}>Nomme la main, l’arme et le mobile. Une accusation incomplète peut quand même produire une fin amère.</Text>
      <Text style={styles.verdictLabel}>Qui ?</Text>
      <View style={styles.choiceGrid}>
        {vallombreCharacters.map((character) => (
          <ChoiceButton key={character.id} label={character.name} active={state.verdict.who === character.id} onPress={() => onChoice('who', character.id)} />
        ))}
      </View>
      <Text style={styles.verdictLabel}>Comment ?</Text>
      <View style={styles.choiceGrid}>
        {discovered.map((clue) => (
          <ChoiceButton key={clue.id} label={clue.title} active={state.verdict.how === clue.id} onPress={() => onChoice('how', clue.id)} />
        ))}
      </View>
      <Text style={styles.verdictLabel}>Pourquoi ?</Text>
      <View style={styles.choiceGrid}>
        {discovered.map((clue) => (
          <ChoiceButton key={clue.id} label={clue.title} active={state.verdict.why === clue.id} onPress={() => onChoice('why', clue.id)} />
        ))}
      </View>
      <PrimaryButton label={requiredLinksComplete(state) ? 'Rendre le verdict' : 'Rendre un verdict risqué'} disabled={!state.verdict.who || !state.verdict.how || !state.verdict.why} onPress={onResolve} />
    </View>
  );
}

function EndingScreen({ state, onRestart }: { state: VallombreState; onRestart: () => void }) {
  const ending = findEnding(state.endingId ?? 'end-c');
  return (
    <View style={styles.ending}>
      <Image source={backgrounds[ending.id === 'end-a' ? 'bg-09' : 'bg-08']} style={styles.endingBack} contentFit="cover" />
      <View style={styles.endingPanel}>
        <Text style={styles.titleKicker}>{ending.tone}</Text>
        <Text style={styles.endingTitle}>{ending.title}</Text>
        <Text style={styles.endingText}>{ending.text}</Text>
        <Text style={styles.endingMeta}>{state.discoveredClues.length}/20 indices · {state.correctLinks.length}/7 liens établis</Text>
        <PrimaryButton label="Recommencer l’enquête" onPress={onRestart} />
      </View>
    </View>
  );
}

function Timeline({ state }: { state: VallombreState }) {
  const rows = [
    ['20h', 'Dîner: Aldéric menace ses proches.', state.discoveredClues.includes('clu-15')],
    ['23h', 'Dernier verre: la chronologie se resserre.', state.correctLinks.includes('l2')],
    ['23h47', 'Meurtre: entrée, coup, fuite par le passage.', state.correctLinks.includes('l4')],
    ['00h30', 'Foucher maquille la scène et brûle ses lettres.', state.correctLinks.includes('l3')],
  ] as const;
  return (
    <View style={styles.timeline}>
      {rows.map(([time, text, unlocked]) => (
        <View key={time} style={[styles.timelineRow, unlocked && styles.timelineUnlocked]}>
          <Text style={styles.timelineTime}>{time}</Text>
          <Text style={styles.timelineText}>{unlocked ? text : 'Segment encore incertain'}</Text>
        </View>
      ))}
    </View>
  );
}

function MapView({ state }: { state: VallombreState }) {
  return (
    <View style={styles.mapGrid}>
      {vallombreLocations.map((location) => (
        <View key={location.id} style={[styles.mapRoom, isLocationUnlocked(state, location.id) && styles.mapRoomOpen]}>
          <Text style={styles.mapRoomText}>{location.title}</Text>
        </View>
      ))}
    </View>
  );
}

function MiniClue({ id }: { id: VallombreClueId }) {
  const clue = findClue(id);
  return (
    <View style={styles.miniClue}>
      <Image source={props[id]} style={styles.miniClueImage} contentFit="cover" />
      <Text style={styles.miniClueText}>{clue.title}</Text>
    </View>
  );
}

function SuspicionMeter({ value }: { value: number }) {
  return (
    <View style={styles.meter}>
      <View style={[styles.meterFill, { width: `${value}%` }]} />
    </View>
  );
}

function NavButton({ label, active, disabled, onPress }: { label: string; active?: boolean; disabled?: boolean; onPress: () => void }) {
  return (
    <Pressable disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.navButton, active && styles.navButtonActive, disabled && styles.disabledButton, pressed && styles.pressed]}>
      <Text style={[styles.navText, active && styles.navTextActive]}>{label}</Text>
    </Pressable>
  );
}

function ChoiceButton({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.choiceButton, active && styles.choiceButtonActive, pressed && styles.pressed]}>
      <Text style={[styles.choiceText, active && styles.choiceTextActive]}>{label}</Text>
    </Pressable>
  );
}

function PrimaryButton({ label, disabled, onPress }: { label: string; disabled?: boolean; onPress: () => void }) {
  return (
    <Pressable disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.primaryButton, disabled && styles.disabledButton, pressed && styles.pressed]}>
      <Text style={styles.primaryText}>{label}</Text>
    </Pressable>
  );
}

function SecondaryButton({ label, disabled, onPress }: { label: string; disabled?: boolean; onPress: () => void }) {
  return (
    <Pressable disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.secondaryButton, disabled && styles.disabledButton, pressed && styles.pressed]}>
      <Text style={styles.secondaryText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { borderRadius: 8, overflow: 'hidden', backgroundColor: '#141217', borderWidth: 2, borderColor: '#6E4B2F', padding: 14, gap: 12 },
  backdrop: { ...StyleSheet.absoluteFill },
  tint: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(8, 10, 14, 0.76)' },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
  brand: { flex: 1, minWidth: 0 },
  kicker: { color: '#D99B5C', fontSize: 12, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0 },
  title: { color: '#F4E6C8', fontSize: 22, fontWeight: '900', letterSpacing: 0, lineHeight: 25 },
  clock: { borderWidth: 1, borderColor: '#B9824B', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: 'rgba(24, 20, 20, 0.78)' },
  clockLabel: { color: '#AEBECB', fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
  clockValue: { color: '#F4E6C8', fontSize: 14, fontWeight: '900' },
  nav: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  navButton: { minHeight: 38, borderRadius: 8, borderWidth: 1, borderColor: '#826145', backgroundColor: 'rgba(20, 22, 28, 0.82)', paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center' },
  navButtonActive: { backgroundColor: '#C98036', borderColor: '#F2BE7D' },
  navText: { color: '#E6D3B5', fontSize: 13, fontWeight: '900', textTransform: 'uppercase' },
  navTextActive: { color: '#11131A' },
  messagePanel: { borderRadius: 8, borderWidth: 1, borderColor: '#614B3B', backgroundColor: 'rgba(22, 21, 23, 0.88)', padding: 12, gap: 4 },
  messageText: { color: '#F0DFC2', fontSize: 15, fontWeight: '700', lineHeight: 21 },
  saveText: { color: '#8FA9B8', fontSize: 12, fontWeight: '800', textTransform: 'uppercase' },
  guidancePanel: { borderRadius: 8, borderWidth: 1, borderColor: '#9B7049', backgroundColor: 'rgba(18, 20, 26, 0.94)', padding: 12, gap: 10 },
  guidanceHeader: { gap: 3 },
  guidanceCopy: { flex: 1, minWidth: 0, gap: 3 },
  guidanceKicker: { color: '#D99B5C', fontSize: 12, fontWeight: '900', textTransform: 'uppercase' },
  guidanceTitle: { color: '#F7E4C3', fontSize: 20, fontWeight: '900', letterSpacing: 0 },
  guidanceText: { color: '#D6E1E3', fontSize: 14, lineHeight: 20, fontWeight: '700' },
  rewardBox: { borderRadius: 8, borderWidth: 1, borderColor: '#584638', backgroundColor: 'rgba(42, 33, 29, 0.92)', padding: 10, gap: 3 },
  rewardLabel: { color: '#E59A4B', fontSize: 11, fontWeight: '900', textTransform: 'uppercase' },
  rewardText: { color: '#F0DFC2', fontSize: 13, lineHeight: 18, fontWeight: '800' },
  checklistRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  checkItem: { borderRadius: 999, borderWidth: 1, borderColor: '#7A6048', backgroundColor: 'rgba(34, 35, 39, 0.92)', paddingHorizontal: 10, paddingVertical: 6 },
  checkText: { color: '#E9D9BD', fontSize: 12, fontWeight: '900' },
  progressGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  progressStat: { flex: 1, minWidth: 142, gap: 5 },
  progressStatHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  progressLabel: { color: '#AEBECB', fontSize: 11, fontWeight: '900', textTransform: 'uppercase' },
  progressValue: { color: '#F2D6A9', fontSize: 11, fontWeight: '900' },
  progressTrack: { height: 7, borderRadius: 4, backgroundColor: '#26323A', overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#D28A3B' },
  guidanceActionRow: { alignItems: 'flex-start' },
  titleRoot: { minHeight: 560, borderRadius: 8, overflow: 'hidden', backgroundColor: '#12151C', borderWidth: 2, borderColor: '#6E4B2F', justifyContent: 'flex-end' },
  titleImage: { ...StyleSheet.absoluteFill },
  titleShade: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(7, 10, 15, 0.46)' },
  titleCopy: { padding: 20, gap: 12, maxWidth: 620 },
  titleKicker: { color: '#E69A4A', fontSize: 14, fontWeight: '900', textTransform: 'uppercase' },
  titleLogo: { color: '#F8E4BD', fontSize: 33, lineHeight: 37, fontWeight: '900', letterSpacing: 0 },
  titleLead: { color: '#D7E1E6', fontSize: 17, lineHeight: 24, fontWeight: '700' },
  titleActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  introRoot: { minHeight: 540, borderRadius: 8, overflow: 'hidden', borderWidth: 1, borderColor: '#6E4B2F', backgroundColor: '#101218', justifyContent: 'flex-end' },
  introImage: { ...StyleSheet.absoluteFill },
  introShade: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(6, 8, 12, 0.28)' },
  introProgress: { position: 'absolute', top: 14, right: 14, flexDirection: 'row', gap: 7 },
  introDot: { width: 28, height: 6, borderRadius: 3, backgroundColor: 'rgba(230, 220, 196, 0.34)', borderWidth: 1, borderColor: 'rgba(255, 238, 198, 0.35)' },
  introDotActive: { backgroundColor: '#D28A3B', borderColor: '#F2BE7D' },
  introPanel: { margin: 14, borderRadius: 8, borderWidth: 1, borderColor: '#9B7049', backgroundColor: 'rgba(9, 11, 16, 0.84)', padding: 16, gap: 8 },
  introKicker: { color: '#E69A4A', fontSize: 13, fontWeight: '900', textTransform: 'uppercase' },
  introTitle: { color: '#F8E4BD', fontSize: 31, fontWeight: '900', letterSpacing: 0 },
  introText: { color: '#E5EEF0', fontSize: 16, lineHeight: 23, fontWeight: '800' },
  introActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'flex-end', marginTop: 4 },
  section: { borderRadius: 8, borderWidth: 1, borderColor: '#5D4939', backgroundColor: 'rgba(18, 19, 23, 0.9)', padding: 14, gap: 12, overflow: 'hidden' },
  sectionTitle: { color: '#F6E6C8', fontSize: 23, fontWeight: '900', letterSpacing: 0 },
  sectionText: { color: '#C4D0D4', fontSize: 14, lineHeight: 20, fontWeight: '700' },
  manualPanel: { borderRadius: 8, borderWidth: 1, borderColor: '#6D5746', backgroundColor: 'rgba(24, 25, 30, 0.92)', padding: 12, gap: 9 },
  manualHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  manualTitle: { color: '#F6E6C8', fontSize: 18, fontWeight: '900' },
  manualMeta: { color: '#101217', backgroundColor: '#D28A3B', borderRadius: 999, paddingHorizontal: 9, paddingVertical: 4, fontSize: 11, fontWeight: '900', textTransform: 'uppercase' },
  manualLead: { color: '#DCE5E6', fontSize: 13, lineHeight: 19, fontWeight: '700' },
  manualGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  manualCard: { flex: 1, minWidth: 160, borderRadius: 8, borderWidth: 1, borderColor: '#4F4037', backgroundColor: 'rgba(37, 35, 37, 0.9)', padding: 9, gap: 5 },
  manualCardTitle: { color: '#E59A4B', fontSize: 12, fontWeight: '900', textTransform: 'uppercase' },
  manualCardText: { color: '#D4DEE0', fontSize: 12, lineHeight: 17, fontWeight: '700' },
  rowHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
  locationGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  locationCard: { width: '48%', minWidth: 250, height: 132, borderRadius: 8, overflow: 'hidden', borderWidth: 1, borderColor: '#7A6048', padding: 10, justifyContent: 'flex-end' },
  lockedCard: { opacity: 0.48 },
  locationThumb: { ...StyleSheet.absoluteFill },
  locationOverlay: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0, 0, 0, 0.42)' },
  cardTitle: { color: '#F5E7CB', fontSize: 16, fontWeight: '900' },
  cardMeta: { color: '#B8CBD2', fontSize: 12, fontWeight: '800', lineHeight: 17 },
  cardText: { color: '#C9D4D5', fontSize: 13, lineHeight: 18, fontWeight: '700' },
  suspectGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  suspectCard: { width: '48%', minWidth: 250, minHeight: 118, borderRadius: 8, borderWidth: 1, borderColor: '#604B3C', backgroundColor: 'rgba(31, 30, 34, 0.9)', flexDirection: 'row', alignItems: 'center', padding: 8, gap: 10 },
  suspectBust: { width: 82, height: 102 },
  suspectCopy: { flex: 1, gap: 5, minWidth: 0 },
  meter: { height: 8, borderRadius: 4, backgroundColor: '#28333B', overflow: 'hidden' },
  meterFill: { height: '100%', backgroundColor: '#D85D3B' },
  sceneFrame: { maxWidth: '100%', borderRadius: 8, overflow: 'hidden', borderWidth: 2, borderColor: '#8A6545', alignSelf: 'center', backgroundColor: '#111' },
  roomGuide: { borderRadius: 8, borderWidth: 1, borderColor: '#5E4938', backgroundColor: 'rgba(30, 31, 35, 0.9)', padding: 10, gap: 3 },
  roomGuideTitle: { color: '#E59A4B', fontSize: 12, fontWeight: '900', textTransform: 'uppercase' },
  roomGuideText: { color: '#D8E2E4', fontSize: 13, lineHeight: 18, fontWeight: '800' },
  sceneImage: { ...StyleSheet.absoluteFill },
  hotspot: { position: 'absolute', width: 94, minHeight: 58, marginLeft: -47, marginTop: -29, alignItems: 'center', justifyContent: 'center' },
  hotspotInspected: { opacity: 0.58 },
  hotspotImage: { position: 'absolute', width: 58, height: 58 },
  hotspotLabel: { color: '#FFF4D7', fontSize: 11, fontWeight: '900', textAlign: 'center', textShadowColor: '#000', textShadowRadius: 5, marginTop: 48 },
  clueStrip: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  miniClue: { flexDirection: 'row', alignItems: 'center', gap: 7, borderRadius: 8, borderWidth: 1, borderColor: '#6D5746', backgroundColor: 'rgba(39, 36, 35, 0.9)', padding: 6 },
  miniClueImage: { width: 34, height: 34, borderRadius: 6 },
  miniClueText: { color: '#F3E0C0', fontSize: 12, fontWeight: '900' },
  dialogueLayout: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  characterStage: { flex: 1, minWidth: 260, minHeight: 430, borderRadius: 8, overflow: 'hidden', borderWidth: 1, borderColor: '#654B38', backgroundColor: '#171A20' },
  characterBack: { ...StyleSheet.absoluteFill, opacity: 0.7 },
  characterSprite: { position: 'absolute', width: '96%', height: '96%', bottom: -18, left: '2%' },
  dialoguePanel: { flex: 1.25, minWidth: 300, borderRadius: 8, borderWidth: 1, borderColor: '#604B3C', backgroundColor: 'rgba(18, 19, 23, 0.92)', padding: 14, gap: 10 },
  statement: { color: '#F1E1C3', fontSize: 16, lineHeight: 22, fontWeight: '800' },
  topicCard: { borderRadius: 8, borderWidth: 1, borderColor: '#514234', backgroundColor: 'rgba(37, 35, 37, 0.9)', padding: 10, gap: 8 },
  topicLabel: { color: '#E39A51', fontSize: 13, fontWeight: '900', textTransform: 'uppercase' },
  topicStatement: { color: '#DCE5E6', fontSize: 14, lineHeight: 20, fontWeight: '700' },
  proofButton: { borderRadius: 8, backgroundColor: '#C98036', paddingVertical: 9, paddingHorizontal: 10, alignItems: 'center' },
  proofText: { color: '#11131A', fontSize: 13, fontWeight: '900' },
  notebookHelp: { borderRadius: 8, borderWidth: 1, borderColor: '#6D5746', backgroundColor: 'rgba(35, 31, 31, 0.92)', padding: 10, gap: 4 },
  notebookHelpTitle: { color: '#E59A4B', fontSize: 12, fontWeight: '900', textTransform: 'uppercase' },
  notebookHelpText: { color: '#DCE5E6', fontSize: 13, lineHeight: 18, fontWeight: '700' },
  tabRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  clueGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  clueCard: { width: '31.5%', minWidth: 174, borderRadius: 8, borderWidth: 1, borderColor: '#604B3C', backgroundColor: 'rgba(31, 30, 34, 0.92)', padding: 9, gap: 7 },
  clueImage: { width: '100%', aspectRatio: 1, borderRadius: 8, borderWidth: 1, borderColor: '#8A6545' },
  emptyText: { color: '#C8D2D4', fontSize: 14, fontWeight: '800' },
  profileList: { gap: 10 },
  profileRow: { flexDirection: 'row', gap: 10, borderRadius: 8, borderWidth: 1, borderColor: '#584638', backgroundColor: 'rgba(28, 28, 32, 0.92)', padding: 10 },
  profileFace: { width: 72, height: 90 },
  profileCopy: { flex: 1, gap: 6 },
  timeline: { gap: 8 },
  timelineRow: { borderRadius: 8, borderWidth: 1, borderColor: '#4D4240', backgroundColor: 'rgba(31, 30, 34, 0.92)', padding: 10, flexDirection: 'row', gap: 10 },
  timelineUnlocked: { borderColor: '#B9824B', backgroundColor: 'rgba(54, 40, 32, 0.95)' },
  timelineTime: { color: '#E59A4B', fontSize: 15, fontWeight: '900', width: 56 },
  timelineText: { color: '#D7E2E4', fontSize: 14, fontWeight: '800', flex: 1 },
  mapGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  mapRoom: { width: '31%', minWidth: 145, minHeight: 62, borderRadius: 8, borderWidth: 1, borderColor: '#4E4140', backgroundColor: '#20242A', alignItems: 'center', justifyContent: 'center', padding: 8 },
  mapRoomOpen: { backgroundColor: '#583B2E', borderColor: '#C98036' },
  mapRoomText: { color: '#EAD9BC', fontSize: 12, fontWeight: '900', textAlign: 'center' },
  panelTexture: { ...StyleSheet.absoluteFill, opacity: 0.2 },
  corkSelectionBar: { borderRadius: 8, borderWidth: 1, borderColor: '#7A6048', backgroundColor: 'rgba(31, 24, 20, 0.92)', padding: 10, gap: 3 },
  corkSelectionTitle: { color: '#E59A4B', fontSize: 11, fontWeight: '900', textTransform: 'uppercase' },
  corkSelectionText: { color: '#F0DFC2', fontSize: 13, lineHeight: 18, fontWeight: '800' },
  corkboardLayout: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  corkClueBank: { flex: 1.25, minWidth: 300, gap: 8 },
  corkLinksColumn: { flex: 0.9, minWidth: 260, gap: 8 },
  corkColumnTitle: { color: '#F2D6A9', fontSize: 14, fontWeight: '900', textTransform: 'uppercase' },
  compactPinGrid: { gap: 7 },
  compactPinCard: { minHeight: 64, borderRadius: 8, borderWidth: 1, borderColor: '#6A4A31', backgroundColor: 'rgba(38, 28, 22, 0.9)', padding: 7, flexDirection: 'row', alignItems: 'center', gap: 8 },
  compactPinSelected: { borderColor: '#F2BE7D', backgroundColor: 'rgba(132, 72, 38, 0.96)' },
  compactPinImage: { width: 48, height: 48, borderRadius: 6, borderWidth: 1, borderColor: '#8A6545' },
  compactPinCopy: { flex: 1, minWidth: 0, gap: 2 },
  compactPinTitle: { color: '#F6E4C4', fontSize: 12, lineHeight: 16, fontWeight: '900' },
  compactPinMeta: { color: '#BFD0D2', fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
  linksList: { gap: 8 },
  linkRow: { borderRadius: 8, borderWidth: 1, borderColor: '#4F4037', padding: 10, backgroundColor: 'rgba(24, 23, 26, 0.9)' },
  linkRowDone: { borderColor: '#C98036', backgroundColor: 'rgba(55, 39, 31, 0.94)' },
  linkRowMuted: { opacity: 0.56 },
  linkTitle: { color: '#F2D6A9', fontSize: 14, fontWeight: '900' },
  linkText: { color: '#BFD0D2', fontSize: 12, fontWeight: '700', lineHeight: 17 },
  verdictBack: { ...StyleSheet.absoluteFill, opacity: 0.28 },
  verdictLabel: { color: '#E59A4B', fontSize: 15, fontWeight: '900', textTransform: 'uppercase' },
  choiceGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  choiceButton: { borderRadius: 8, borderWidth: 1, borderColor: '#5B4A3B', backgroundColor: 'rgba(27, 28, 32, 0.92)', paddingHorizontal: 10, paddingVertical: 8 },
  choiceButtonActive: { borderColor: '#F2BE7D', backgroundColor: '#C98036' },
  choiceText: { color: '#E9D9BD', fontSize: 13, fontWeight: '900' },
  choiceTextActive: { color: '#11131A' },
  ending: { minHeight: 520, borderRadius: 8, overflow: 'hidden', justifyContent: 'flex-end', borderWidth: 1, borderColor: '#6E4B2F' },
  endingBack: { ...StyleSheet.absoluteFill },
  endingPanel: { backgroundColor: 'rgba(9, 11, 15, 0.84)', padding: 18, gap: 10 },
  endingTitle: { color: '#F7D69C', fontSize: 32, fontWeight: '900', letterSpacing: 0 },
  endingText: { color: '#E4EEF0', fontSize: 16, lineHeight: 24, fontWeight: '700' },
  endingMeta: { color: '#AFC1C8', fontSize: 13, fontWeight: '900', textTransform: 'uppercase' },
  primaryButton: { minHeight: 44, borderRadius: 8, backgroundColor: '#D28A3B', borderWidth: 1, borderColor: '#F0C488', paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center' },
  primaryText: { color: '#101217', fontSize: 14, fontWeight: '900', textTransform: 'uppercase' },
  secondaryButton: { minHeight: 40, borderRadius: 8, backgroundColor: 'rgba(17, 19, 24, 0.86)', borderWidth: 1, borderColor: '#8B6A4F', paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center' },
  secondaryText: { color: '#F0DFC2', fontSize: 13, fontWeight: '900', textTransform: 'uppercase' },
  disabledButton: { opacity: 0.45 },
  pressed: { opacity: 0.72, transform: [{ scale: 0.99 }] },
});
