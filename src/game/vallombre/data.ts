import {
  VallombreCharacter,
  VallombreClue,
  VallombreDeductionLink,
  VallombreDialogue,
  VallombreEnding,
  VallombreIntroScene,
  VallombreLocation,
} from './types';

export const vallombreIntroScenes: VallombreIntroScene[] = [
  {
    id: 'intro-01',
    image: 'intro-01',
    title: 'La route coupe',
    text: 'Hiver 1924. Morane rejoint Vallombre a pied, dix kilometres dans la neige, appele par un telegramme envoye avant que la tempete ne coupe les routes.',
  },
  {
    id: 'intro-02',
    image: 'intro-02',
    title: 'Le telegramme',
    text: 'Le message est bref: Aldéric Vallombre ne repond plus. Son bureau est verrouille de l interieur. La maison refuse deja de parler.',
  },
  {
    id: 'intro-03',
    image: 'intro-03',
    title: 'Soeur Garance',
    text: 'A l entree du manoir, Soeur Garance ouvre la porte comme on ouvre une tombe. Six pensionnaires sont bloques. Aucun ne peut partir.',
  },
  {
    id: 'intro-04',
    image: 'intro-04',
    title: 'La porte du bureau',
    text: 'Derriere la porte forcee: un mort, des cendres, une fenetre gelee et une horloge arretee a 23h47. Le huis clos commence.',
  },
];

export const vallombreLocations: VallombreLocation[] = [
  {
    id: 'loc-01',
    title: 'Vestibule',
    bg: 'bg-02',
    summary: 'Manteaux mouilles, neige fondue, registre ouvert sur un gueridon.',
    hotspots: [
      { id: 'registry', label: 'Registre', x: 62, y: 68, text: 'Les arrivees concordent: personne ne pouvait repartir dans la tempete.' },
      { id: 'door', label: 'Porte gelee', x: 69, y: 36, text: 'Le vent force contre le bois. Le manoir est une cage.' },
    ],
  },
  {
    id: 'loc-02',
    title: 'Grand Hall',
    bg: 'bg-05',
    summary: 'Le coeur du manoir, froid comme un tribunal.',
    hotspots: [
      { id: 'clock', label: 'Horloge du hall', x: 52, y: 25, text: 'Chaque tic-tac ressemble a un aveu qui recule.' },
      { id: 'stairs', label: 'Escalier', x: 37, y: 53, text: 'Les chambres attendent, toutes plus silencieuses les unes que les autres.' },
    ],
  },
  {
    id: 'loc-03',
    title: "Bureau d'Alderic",
    bg: 'bg-04',
    summary: 'Scene de crime: foyer tiede, fauteuil renverse, porte verrouillee de l interieur.',
    hotspots: [
      { id: 'ashes', label: 'Foyer', x: 83, y: 45, clueId: 'clu-01', text: 'Des papiers ont ete brules apres la mort. Pas avant.' },
      { id: 'poker', label: 'Tisonnier', x: 80, y: 66, clueId: 'clu-02', text: 'Il a ete essuye trop soigneusement pour etre honnete.' },
      { id: 'key', label: 'Poche', x: 58, y: 75, clueId: 'clu-03', text: 'La cle du bureau etait bien sur la victime.' },
      { id: 'window', label: 'Fenetre', x: 25, y: 27, clueId: 'clu-04', text: 'Verrouillee. Gel intact. Personne n est passe par la.' },
      { id: 'draft', label: 'Courant d air', x: 35, y: 36, clueId: 'clu-05', text: 'Une flamme tremble vers la bibliotheque. Une autre entree existe.' },
      { id: 'ether', label: 'Flacon', x: 36, y: 71, clueId: 'clu-18', text: 'Ethere. Medical. Et beaucoup trop opportun.' },
      { id: 'clock', label: 'Horloge arretee', x: 79, y: 14, clueId: 'clu-19', text: 'Les aiguilles sont bloquees sur 23h47.' },
      { id: 'letter', label: 'Lettre brulee', x: 43, y: 66, clueId: 'clu-09', text: 'Il ne reste qu une phrase: il sait.' },
    ],
  },
  {
    id: 'loc-04',
    title: 'Bibliotheque',
    bg: 'bg-10',
    summary: 'Boiseries, livres anciens et une etagere qui respire mal.',
    hotspots: [
      { id: 'shelf', label: 'Etagere pivotante', x: 62, y: 49, clueId: 'clu-06', text: 'Le faux huis clos prend fin derriere des livres de droit.' },
      { id: 'heel', label: 'Talon dans la poussiere', x: 42, y: 82, clueId: 'clu-10', text: 'Quelqu un a emprunte ce passage dans la nuit.' },
    ],
  },
  {
    id: 'loc-05',
    title: 'Salle a manger',
    bg: 'bg-06',
    summary: 'Longue table, argenterie incomplete, toast qui a vire a la menace.',
    hotspots: [
      { id: 'knife-rest', label: 'Argenterie', x: 55, y: 62, clueId: 'clu-08', text: 'Le coupe-papier en argent manque a sa place.' },
      { id: 'toast', label: 'Place d Alderic', x: 39, y: 57, text: 'Alderic a fait de chaque repas une audience.' },
    ],
  },
  {
    id: 'loc-06',
    title: 'Salon',
    bg: 'bg-07',
    summary: 'Velours, masques de salon, dernier verre servi dans la nuit.',
    hotspots: [
      { id: 'score', label: 'Partition annotee', x: 41, y: 61, clueId: 'clu-15', text: 'Camille a griffonne: il sait.' },
      { id: 'cognac', label: 'Verre de cognac', x: 71, y: 63, clueId: 'clu-20', text: 'Deux empreintes. Alderic n a pas bu seul avant 23h47.' },
    ],
  },
  {
    id: 'loc-07',
    title: 'Cuisine',
    bg: 'bg-12',
    summary: 'Carrelage humide, billot propre, odeur d ether derriere le savon.',
    hotspots: [
      { id: 'letter-opener', label: 'Coupe-papier lave', x: 48, y: 68, clueId: 'clu-13', text: 'La vraie arme a ete lavee a l ether, mais pas sauvee.' },
      { id: 'rack', label: 'Porte-couteaux', x: 61, y: 45, text: 'Une place vide. Une absence peut etre plus bruyante qu un cri.' },
    ],
  },
  {
    id: 'loc-08',
    title: 'Serre',
    bg: 'bg-13',
    summary: 'Verriere givree, terre verte, neige violee par des pas recents.',
    hotspots: [
      { id: 'mud', label: 'Boue verte', x: 39, y: 75, clueId: 'clu-16', text: 'La meme terre que sur le talon de la bibliotheque.' },
      { id: 'glass', label: 'Verriere', x: 75, y: 36, text: 'Le froid dessine sur le verre des cartes de fuite.' },
    ],
  },
  {
    id: 'loc-09',
    title: "Chambre d'Helene",
    bg: 'bg-14',
    summary: 'Elegance froide, tiroir a double fond, parfum trop calme.',
    hotspots: [
      { id: 'debts', label: 'Reconnaissances de dette', x: 82, y: 67, clueId: 'clu-07', text: 'Theodore doit plus qu il ne pourra jamais payer.' },
      { id: 'letters', label: 'Lettres cachees', x: 70, y: 43, text: 'Helene savait plus que son deuil ne le dit.' },
    ],
  },
  {
    id: 'loc-10',
    title: 'Chambre de Victor',
    bg: 'bg-15',
    summary: 'Une chambre trop pauvre pour un secretaire si proche du maitre.',
    hotspots: [
      { id: 'telegram', label: 'Telegramme', x: 51, y: 61, clueId: 'clu-12', text: 'Un creancier attendait Theodore au tournant.' },
      { id: 'medallion', label: 'Medaillon', x: 29, y: 70, clueId: 'clu-17', text: 'Une photo d enfant que Garance n aurait jamais du garder.' },
    ],
  },
  {
    id: 'loc-11',
    title: 'Grenier',
    bg: 'bg-16',
    summary: 'Malles familiales, poussiere, verites rangees sous cadenas.',
    lockedBy: 'l1',
    hotspots: [
      { id: 'birth', label: 'Acte de naissance', x: 44, y: 66, clueId: 'clu-11', text: 'Victor est le fils illegitime d Alderic Vallombre.' },
      { id: 'trunk', label: 'Coffre', x: 69, y: 72, text: 'Les familles enterrent mal ce qu elles veulent oublier.' },
    ],
  },
  {
    id: 'loc-12',
    title: 'Cave',
    bg: 'bg-17',
    summary: 'Charbon, cuivre, bidon de petrole, odeur d incendie programme.',
    lockedBy: 'l1',
    hotspots: [
      { id: 'oil', label: 'Bidon de petrole', x: 61, y: 72, clueId: 'clu-14', text: 'L incendie etait un second crime, pas le meurtre.' },
      { id: 'boiler', label: 'Chaudiere', x: 70, y: 34, text: 'Le manoir respire comme une machine malade.' },
    ],
  },
];

export const vallombreCharacters: VallombreCharacter[] = [
  { id: 'helene', name: 'Helene Vallombre', role: 'Epouse', secret: 'Sait pour l enfant illegitime.', lieClue: 'clu-11', sprite: 'char-helene', intro: 'Mon mari et moi nous aimions.' },
  { id: 'theodore', name: 'Theodore Vallombre', role: 'Fils endette', secret: 'Doit une fortune au jeu.', lieClue: 'clu-12', sprite: 'char-theodore', intro: 'Pere dormait quand je suis monte.' },
  { id: 'garance', name: 'Soeur Garance', role: 'Gouvernante', secret: 'A eleve Victor.', lieClue: 'clu-17', sprite: 'char-garance', intro: 'J etais a la cuisine toute la nuit.' },
  { id: 'foucher', name: 'Dr Lazare Foucher', role: 'Medecin', secret: 'A maquille la scene.', lieClue: 'clu-18', sprite: 'char-foucher', intro: 'Je n ai pas remis les pieds dans le bureau.' },
  { id: 'victor', name: 'Victor Nguyen', role: 'Secretaire', secret: 'Fils cache d Alderic.', lieClue: 'clu-11', sprite: 'char-victor', intro: 'Monsieur Vallombre etait un bon employeur.' },
  { id: 'camille', name: 'Camille Roux', role: 'Cantatrice', secret: 'Ancienne maitresse menacee.', lieClue: 'clu-15', sprite: 'char-camille', intro: 'Je ne suis ici que pour chanter.' },
];

export const vallombreClues: VallombreClue[] = [
  { id: 'clu-01', title: 'Cendres de papier', locationId: 'loc-03', proves: 'Des documents ont ete brules apres la mort.', description: 'Papiers calcinés dans le foyer encore tiede.', prop: 'prop-01' },
  { id: 'clu-02', title: 'Tisonnier propre', locationId: 'loc-03', proves: 'Le tisonnier n est pas l arme.', description: 'Trop propre, trop visible, trop pratique.', prop: 'prop-02' },
  { id: 'clu-03', title: 'Cle du bureau', locationId: 'loc-03', proves: 'La porte etait verrouillee de l interieur.', description: 'Trouvee dans la poche de la victime.', prop: 'prop-03' },
  { id: 'clu-04', title: 'Fenetre gelee', locationId: 'loc-03', proves: 'Personne n est entre par la fenetre.', description: 'Gel intact autour du loquet.', prop: 'prop-04' },
  { id: 'clu-05', title: 'Courant d air anormal', locationId: 'loc-03', proves: 'Il existe une autre entree.', description: 'La flamme penche vers la bibliotheque.', prop: 'prop-05' },
  { id: 'clu-06', title: 'Etagere pivotante', locationId: 'loc-04', proves: 'Le passage relie bibliotheque et bureau.', description: 'Un pan entier de boiserie bascule.', prop: 'prop-06' },
  { id: 'clu-07', title: 'Dettes de Theodore', locationId: 'loc-09', proves: 'Theodore avait un mobile financier.', description: 'Reconnaissances signees d une main tremblante.', prop: 'prop-07' },
  { id: 'clu-08', title: 'Coupe-papier manquant', locationId: 'loc-05', proves: 'La vraie arme manque a table.', description: 'Une forme vide dans l argenterie.', prop: 'prop-08' },
  { id: 'clu-09', title: 'Lettre de chantage', locationId: 'loc-03', proves: 'Alderic tenait ses proches.', description: 'A demi brulee: il sait.', prop: 'prop-09' },
  { id: 'clu-10', title: 'Talon dans la poussiere', locationId: 'loc-04', proves: 'Quelqu un a emprunte le passage.', description: 'Une trace nette pres de l etagere.', prop: 'prop-10' },
  { id: 'clu-11', title: 'Acte de naissance', locationId: 'loc-11', proves: 'Victor est le fils illegitime.', description: 'Pere: A. Vallombre. Mere: ligne grattee.', prop: 'prop-11' },
  { id: 'clu-12', title: 'Telegramme du creancier', locationId: 'loc-10', proves: 'Theodore allait etre denonce.', description: 'Dernier avertissement avant scandale public.', prop: 'prop-12' },
  { id: 'clu-13', title: 'Coupe-papier lave', locationId: 'loc-07', proves: 'L arme a ete nettoyee a l ether.', description: 'L argent garde une ombre rouge.', prop: 'prop-13' },
  { id: 'clu-14', title: 'Bidon de petrole', locationId: 'loc-12', proves: 'L incendie etait premedite.', description: 'Entame recemment, cache dans la cave.', prop: 'prop-14' },
  { id: 'clu-15', title: 'Partition annotee', locationId: 'loc-06', proves: 'Camille etait menacee.', description: 'Entre deux mesures: il sait.', prop: 'prop-15' },
  { id: 'clu-16', title: 'Boue verte', locationId: 'loc-08', proves: 'Le passeur venait de la serre.', description: 'Terre minerale, presque fluorescente.', prop: 'prop-16' },
  { id: 'clu-17', title: 'Medaillon', locationId: 'loc-10', proves: 'Garance a eleve Victor.', description: 'Photo d enfant protegee par une main pieuse.', prop: 'prop-17' },
  { id: 'clu-18', title: 'Flacon d ether', locationId: 'loc-03', proves: 'Foucher a manipule la scene.', description: 'Odeur medicale sur une scene trop theatrale.', prop: 'prop-18' },
  { id: 'clu-19', title: 'Horloge 23h47', locationId: 'loc-03', proves: 'Heure reelle du deces.', description: 'Le verre casse a bloque le mecanisme.', prop: 'prop-19' },
  { id: 'clu-20', title: 'Verre de cognac', locationId: 'loc-06', proves: 'Alderic a bu avec quelqu un avant de mourir.', description: 'Deux empreintes sur le cristal.', prop: 'prop-20' },
];

export const vallombreLinks: VallombreDeductionLink[] = [
  { id: 'l1', clueIds: ['clu-05', 'clu-06'], title: 'Le faux huis clos', unlocks: 'Le passage secret et les zones hautes/basses du manoir.' },
  { id: 'l2', clueIds: ['clu-19', 'clu-20'], title: 'Le dernier verre', unlocks: 'La chronologie de 23h.' },
  { id: 'l3', clueIds: ['clu-13', 'clu-18'], title: 'La scene maquillee', unlocks: 'Foucher a manipule les preuves, pas commis le meurtre.' },
  { id: 'l4', clueIds: ['clu-10', 'clu-16'], title: 'La fuite par la serre', unlocks: 'Le tueur est reparti par le passage.' },
  { id: 'l5', clueIds: ['clu-11', 'clu-17'], title: 'La filiation cachee', unlocks: 'Victor et Garance partagent le secret central.', optional: true },
  { id: 'l6', clueIds: ['clu-09', 'clu-15'], title: 'La toile du chantage', unlocks: 'Alderic menacait Camille et les autres.', optional: true },
  { id: 'l7', clueIds: ['clu-07', 'clu-12'], title: 'Le leurre Theodore', unlocks: 'Theodore avait un mobile, pas le cran.', optional: true },
];

export const vallombreDialogues: VallombreDialogue[] = [
  {
    characterId: 'helene',
    topics: [
      { id: 'love', label: 'Mariage', statement: 'Alderic et moi nous aimions. Les gens aiment salir les veuves.', contradiction: { clueId: 'clu-11', response: 'Votre silence sur Victor etait un arrangement, pas un amour.', suspicion: 20 } },
      { id: 'night', label: 'La nuit', statement: 'Je suis restee dans ma chambre apres le diner.' },
    ],
  },
  {
    characterId: 'theodore',
    topics: [
      { id: 'debt', label: 'Dettes', statement: 'Je n avais aucun besoin d argent urgent.', contradiction: { clueId: 'clu-12', response: 'Votre creancier etait moins patient que vous.', suspicion: 40 } },
      { id: 'father', label: 'Alderic', statement: 'Pere dormait quand je suis monte. Vers onze heures.', contradiction: { clueId: 'clu-19', response: 'A 23h47, il ne dormait pas encore.', suspicion: 20 } },
    ],
  },
  {
    characterId: 'garance',
    topics: [
      { id: 'kitchen', label: 'Cuisine', statement: 'Je n ai pas quitte la cuisine.', contradiction: { clueId: 'clu-17', response: 'Vous aviez une raison de proteger Victor.', suspicion: 30 } },
      { id: 'victor', label: 'Victor', statement: 'Cet enfant a grandi sans personne. Enfin... presque.' },
    ],
  },
  {
    characterId: 'foucher',
    topics: [
      { id: 'office', label: 'Bureau', statement: 'Je n ai pas remis les pieds dans ce bureau depuis midi.', contradiction: { clueId: 'clu-18', response: 'Votre ether raconte une autre visite.', suspicion: 45 } },
      { id: 'weapon', label: 'Arme', statement: 'Je suis medecin, inspecteur. Je connais la mort, je ne la fabrique pas.', contradiction: { clueId: 'clu-13', response: 'Vous avez lave l arme. Cela ne fait pas encore de vous l assassin.', suspicion: 35 } },
    ],
  },
  {
    characterId: 'victor',
    topics: [
      { id: 'father', label: 'Employeur', statement: 'Monsieur Vallombre etait un bon employeur.', contradiction: { clueId: 'clu-11', response: 'Il etait aussi votre pere.', suspicion: 55 } },
      { id: 'passage', label: 'Passage', statement: 'Je ne connais aucun passage secret.', contradiction: { clueId: 'clu-16', response: 'La boue de la serre vous ramene vers la bibliotheque.', suspicion: 35 } },
    ],
  },
  {
    characterId: 'camille',
    topics: [
      { id: 'sing', label: 'Invitation', statement: 'Je ne suis ici que pour chanter.', contradiction: { clueId: 'clu-15', response: 'Votre partition connait le chantage d Alderic.', suspicion: 35 } },
      { id: 'glass', label: 'Dernier verre', statement: 'Je n ai pas vu Alderic apres le diner.', contradiction: { clueId: 'clu-20', response: 'Quelqu un a bu avec lui. Votre silence arrange tout le monde.', suspicion: 15 } },
    ],
  },
];

export const vallombreEndings: VallombreEnding[] = [
  { id: 'end-a', title: 'Les Cendres Froides', tone: 'Verite complete', text: 'Victor avoue. Garance se denonce pour le passage. Le manoir garde son froid, mais plus son mensonge.' },
  { id: 'end-b', title: 'Justice Aveugle', tone: 'Bon coupable, mauvais mobile', text: 'Victor est condamne. Le tribunal obtient un nom, pas une verite.' },
  { id: 'end-c', title: 'Erreur Judiciaire', tone: 'Faux coupable', text: 'Un innocent tombe. Victor quitte Vallombre avant la fonte des neiges.' },
  { id: 'end-d', title: 'La Verite Mutilee', tone: 'Preuve bancale', text: 'Le bon homme est accuse sur la mauvaise histoire. Morane gagne le dossier et perd la paix.' },
  { id: 'end-e', title: 'Le Silence des Notables', tone: 'Fin secrete', text: 'Foucher porte le feu et le meurtre. Les Vallombre referment leurs portes. Morane est mute.' },
];
