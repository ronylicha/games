import {
  vallombreCharacters,
  vallombreClues,
  vallombreEndings,
  vallombreLinks,
  vallombreLocations,
} from './data';
import {
  VallombreCharacterId,
  VallombreClueId,
  VallombreEndingId,
  VallombreLinkId,
  VallombreLocationId,
  VallombrePhase,
  VallombreState,
} from './types';

const phases: VallombrePhase[] = ['matin', 'apres-midi', 'soir', 'nuit'];

export function createVallombreState(): VallombreState {
  return {
    screen: 'title',
    introStep: 0,
    phase: 'matin',
    currentLocationId: 'loc-02',
    currentCharacterId: 'garance',
    discoveredClues: [],
    inspectedHotspots: [],
    correctLinks: [],
    attemptedLinks: [],
    suspicion: {
      helene: 0,
      theodore: 0,
      garance: 0,
      foucher: 0,
      victor: 0,
      camille: 0,
    },
    presentedContradictions: [],
    verdict: {
      who: null,
      how: null,
      why: null,
    },
    endingId: null,
    lastMessage: 'La neige enferme Vallombre. Il reste a ouvrir les yeux.',
  };
}

export function findLocation(id: VallombreLocationId) {
  return vallombreLocations.find((location) => location.id === id) ?? vallombreLocations[0];
}

export function findCharacter(id: VallombreCharacterId) {
  return vallombreCharacters.find((character) => character.id === id) ?? vallombreCharacters[0];
}

export function findClue(id: VallombreClueId) {
  return vallombreClues.find((clue) => clue.id === id) ?? vallombreClues[0];
}

export function findEnding(id: VallombreEndingId) {
  return vallombreEndings.find((ending) => ending.id === id) ?? vallombreEndings[0];
}

export function isLocationUnlocked(state: VallombreState, locationId: VallombreLocationId): boolean {
  const location = findLocation(locationId);
  return !location.lockedBy || state.correctLinks.includes(location.lockedBy);
}

export function inspectHotspot(state: VallombreState, hotspotId: string): VallombreState {
  const location = findLocation(state.currentLocationId);
  const hotspot = location.hotspots.find((item) => item.id === hotspotId);

  if (!hotspot) {
    return state;
  }

  const inspectedKey = `${location.id}:${hotspot.id}`;
  const inspectedHotspots = state.inspectedHotspots.includes(inspectedKey)
    ? state.inspectedHotspots
    : [...state.inspectedHotspots, inspectedKey];
  const discoveredClues =
    hotspot.clueId && !state.discoveredClues.includes(hotspot.clueId)
      ? [...state.discoveredClues, hotspot.clueId]
      : state.discoveredClues;

  return {
    ...state,
    inspectedHotspots,
    discoveredClues,
    lastMessage: hotspot.clueId ? `Indice ajoute: ${findClue(hotspot.clueId).title}` : hotspot.text,
  };
}

export function presentContradiction(
  state: VallombreState,
  characterId: VallombreCharacterId,
  topicId: string,
  clueId: VallombreClueId,
  suspicionGain: number,
  response: string,
): VallombreState {
  if (!state.discoveredClues.includes(clueId)) {
    return {
      ...state,
      lastMessage: 'Morane ne peut pas presenter une preuve qui manque encore au carnet.',
    };
  }

  const key = `${characterId}:${topicId}`;
  const presentedContradictions = state.presentedContradictions.includes(key)
    ? state.presentedContradictions
    : [...state.presentedContradictions, key];

  return {
    ...state,
    presentedContradictions,
    suspicion: {
      ...state.suspicion,
      [characterId]: Math.min(100, state.suspicion[characterId] + (state.presentedContradictions.includes(key) ? 0 : suspicionGain)),
    },
    lastMessage: response,
  };
}

export function attemptVallombreLink(state: VallombreState, first: VallombreClueId, second: VallombreClueId): VallombreState {
  const sorted = [first, second].sort().join(':');
  const link = vallombreLinks.find(({ clueIds }) => clueIds.slice().sort().join(':') === sorted);

  if (!link) {
    return {
      ...state,
      attemptedLinks: state.attemptedLinks.includes(sorted) ? state.attemptedLinks : [...state.attemptedLinks, sorted],
      lastMessage: 'Le fil rouge ne tient pas. La deduction est trop faible.',
    };
  }

  if (state.correctLinks.includes(link.id)) {
    return {
      ...state,
      lastMessage: `${link.title} est deja etabli.`,
    };
  }

  return {
    ...state,
    correctLinks: [...state.correctLinks, link.id],
    phase: nextPhase(state.phase),
    lastMessage: `${link.title}: ${link.unlocks}`,
  };
}

export function setVerdictChoice(
  state: VallombreState,
  key: 'who' | 'how' | 'why',
  value: VallombreCharacterId | VallombreClueId,
): VallombreState {
  return {
    ...state,
    verdict: {
      ...state.verdict,
      [key]: value,
    },
  };
}

export function resolveVallombreEnding(state: VallombreState): VallombreState {
  const endingId = calculateEnding(state);
  return {
    ...state,
    screen: 'ending',
    endingId,
    lastMessage: findEnding(endingId).title,
  };
}

export function requiredLinksComplete(state: VallombreState): boolean {
  return (['l1', 'l2', 'l3', 'l4'] as VallombreLinkId[]).every((linkId) => state.correctLinks.includes(linkId));
}

function calculateEnding(state: VallombreState): VallombreEndingId {
  const { who, how, why } = state.verdict;
  const fullTruth = state.correctLinks.length >= 7;
  const requiredComplete = requiredLinksComplete(state);
  const howCorrect = how === 'clu-13' || how === 'clu-08' || how === 'clu-16';
  const whyCorrect = why === 'clu-11' || why === 'clu-17';

  if (who === 'foucher' && !state.correctLinks.includes('l5') && !state.correctLinks.includes('l6')) {
    return 'end-e';
  }

  if (who !== 'victor') {
    return 'end-c';
  }

  if (!howCorrect || !requiredComplete) {
    return 'end-d';
  }

  if (!whyCorrect) {
    return 'end-b';
  }

  return fullTruth ? 'end-a' : 'end-b';
}

function nextPhase(phase: VallombrePhase): VallombrePhase {
  const index = phases.indexOf(phase);
  return phases[Math.min(phases.length - 1, index + 1)];
}
