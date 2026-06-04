export type VallombreScreen = 'title' | 'intro' | 'hub' | 'location' | 'dialogue' | 'notebook' | 'corkboard' | 'verdict' | 'ending';
export type VallombrePhase = 'matin' | 'apres-midi' | 'soir' | 'nuit';

export type VallombreLocationId =
  | 'loc-01'
  | 'loc-02'
  | 'loc-03'
  | 'loc-04'
  | 'loc-05'
  | 'loc-06'
  | 'loc-07'
  | 'loc-08'
  | 'loc-09'
  | 'loc-10'
  | 'loc-11'
  | 'loc-12';

export type VallombreCharacterId = 'helene' | 'theodore' | 'garance' | 'foucher' | 'victor' | 'camille';
export type VallombreClueId =
  | 'clu-01'
  | 'clu-02'
  | 'clu-03'
  | 'clu-04'
  | 'clu-05'
  | 'clu-06'
  | 'clu-07'
  | 'clu-08'
  | 'clu-09'
  | 'clu-10'
  | 'clu-11'
  | 'clu-12'
  | 'clu-13'
  | 'clu-14'
  | 'clu-15'
  | 'clu-16'
  | 'clu-17'
  | 'clu-18'
  | 'clu-19'
  | 'clu-20';

export type VallombreLinkId = 'l1' | 'l2' | 'l3' | 'l4' | 'l5' | 'l6' | 'l7';
export type VallombreEndingId = 'end-a' | 'end-b' | 'end-c' | 'end-d' | 'end-e';

export type VallombreLocation = {
  id: VallombreLocationId;
  title: string;
  bg: string;
  summary: string;
  lockedBy?: VallombreLinkId;
  hotspots: VallombreHotspot[];
};

export type VallombreHotspot = {
  id: string;
  label: string;
  x: number;
  y: number;
  clueId?: VallombreClueId;
  text: string;
};

export type VallombreCharacter = {
  id: VallombreCharacterId;
  name: string;
  role: string;
  secret: string;
  lieClue: VallombreClueId;
  sprite: string;
  intro: string;
};

export type VallombreClue = {
  id: VallombreClueId;
  title: string;
  locationId: VallombreLocationId;
  proves: string;
  description: string;
  prop: string;
};

export type VallombreDialogue = {
  characterId: VallombreCharacterId;
  topics: VallombreTopic[];
};

export type VallombreTopic = {
  id: string;
  label: string;
  statement: string;
  requiredClue?: VallombreClueId;
  contradiction?: {
    clueId: VallombreClueId;
    response: string;
    suspicion: number;
  };
};

export type VallombreDeductionLink = {
  id: VallombreLinkId;
  clueIds: [VallombreClueId, VallombreClueId];
  title: string;
  unlocks: string;
  optional?: boolean;
};

export type VallombreEnding = {
  id: VallombreEndingId;
  title: string;
  tone: string;
  text: string;
};

export type VallombreIntroScene = {
  id: string;
  image: string;
  title: string;
  text: string;
};

export type VallombreState = {
  screen: VallombreScreen;
  introStep: number;
  phase: VallombrePhase;
  currentLocationId: VallombreLocationId;
  currentCharacterId: VallombreCharacterId;
  discoveredClues: VallombreClueId[];
  inspectedHotspots: string[];
  correctLinks: VallombreLinkId[];
  attemptedLinks: string[];
  suspicion: Record<VallombreCharacterId, number>;
  presentedContradictions: string[];
  verdict: {
    who: VallombreCharacterId | null;
    how: VallombreClueId | null;
    why: VallombreClueId | null;
  };
  endingId: VallombreEndingId | null;
  lastMessage: string;
};
