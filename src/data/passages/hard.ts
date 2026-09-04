import type { PassageSeed } from '@/types/run';

export const hardPassages: PassageSeed[] = [
  {
    id: 'refuse-to-die',
    title: 'Small Things That Refuse to Die',
    category: 'science',
    difficulty: 'hard',
    paragraphs: [
      'The tardigrade is about half a millimetre long, walks on eight stubby legs, and lives in the water film clinging to moss and lichen. It is also the animal most often described, with some exaggeration, as indestructible.',
      'The reputation rests on a single trick. When its environment dries out, a tardigrade does not attempt to survive the drought as a functioning animal. It stops being one. It pulls in its legs, contracts into a barrel shape, and expels almost all of the water in its body. Metabolism drops to a level that is difficult to distinguish from zero. This suspended condition is called cryptobiosis, and an animal in it is neither quite alive nor dead in any sense the words were built for.',
      'The chemistry is the interesting part. Water is not simply lost; it is replaced. The animal floods its cells with protective sugars and disordered proteins that harden into a glass-like matrix. Delicate structures that would normally collapse without water are instead locked in place, held rigid by this internal glass until liquid returns. Nothing moves, so nothing breaks.',
      'In that state a tardigrade tolerates conditions that have nothing to do with its natural habitat: temperatures near absolute zero, pressures far beyond the deep ocean, radiation doses that would be lethal to us hundreds of times over. Some have been revived after exposure to the vacuum of space. Their genomes carry proteins that appear to shield DNA from radiation damage, and repair machinery that is unusually good at reassembling broken strands.',
      'The exaggeration is worth correcting, though. An active, hydrated tardigrade is a fairly ordinary small animal. It can be crushed, eaten, boiled or starved. Its resilience is not a property of the creature so much as a property of a state it can enter, and only when it is given enough warning to prepare.',
      'Which is a reasonable description of most durability. Very little survives everything. A great deal survives more than expected, provided it can stop in time.',
    ],
    questions: [
      {
        id: 'refuse-to-die-q1',
        prompt: 'What is cryptobiosis, as described in the passage?',
        options: [
          'A rapid reproductive cycle triggered by drought',
          'A suspended state with metabolism near zero',
          'A protective outer shell the animal grows',
          'A form of hibernation lasting one season',
        ],
        answerIndex: 1,
      },
      {
        id: 'refuse-to-die-q2',
        prompt: 'What does the tardigrade replace the water in its cells with?',
        options: [
          'A salt solution',
          'Air pockets',
          'Sugars and proteins that form a glass-like matrix',
          'A waxy lipid layer',
        ],
        answerIndex: 2,
      },
      {
        id: 'refuse-to-die-q3',
        prompt: 'Why does the passage call the tardigrade\'s reputation exaggerated?',
        options: [
          'Only a few species can enter the state',
          'The revivals were never independently confirmed',
          'An active, hydrated tardigrade is quite ordinary and vulnerable',
          'The animal dies shortly after being revived',
        ],
        answerIndex: 2,
      },
      {
        id: 'refuse-to-die-q4',
        prompt: 'What condition does the passage say resilience depends on?',
        options: [
          'Having enough warning to prepare',
          'Remaining in cold environments',
          'Access to moss or lichen',
          'Repeated exposure to mild stress',
        ],
        answerIndex: 0,
      },
    ],
  },
  {
    id: 'punctuation-for-feelings',
    title: 'Punctuation for Feelings',
    category: 'culture',
    difficulty: 'hard',
    paragraphs: [
      'Speech carries far more than words. Pitch rises and tone flattens, a pause lands in the wrong place, an eyebrow moves. Linguists estimate that a substantial share of what we understand in conversation arrives through channels that have nothing to do with vocabulary.',
      'Writing threw all of that away, and for centuries the loss barely mattered. Written language was mostly formal, asynchronous and edited. Letters, contracts and books do not need to convey the exact emotional temperature of a sentence, because nobody expects a reply within nine seconds.',
      'Text messaging broke that arrangement. It is written language performing the job of speech: fast, casual, back and forth, between people who know each other. And it arrived without any of the equipment speech uses to signal warmth, irony or hesitation.',
      'So users built the equipment themselves, quickly and without permission. Repeated letters stretch a word the way a voice would. Lowercase signals ease; full capitals signal volume or panic. The ellipsis became a marker of reluctance. Most strikingly, the full stop acquired a tone. In a short message, a sentence ending in a period now reads to many younger readers as cold or final, because in a medium where the line break already ends the thought, choosing to add a period is choosing to add something.',
      'Emoji fit this pattern rather than breaking it. They are usually described as decoration, but they mostly behave grammatically. A smiling face at the end of a blunt request does not add a picture of a face; it does the work an apologetic smile does in person, softening the sentence it is attached to. Its position matters, it modifies rather than replaces, and using it wrongly reads as strange rather than merely ugly.',
      'What looks like the decline of written language is closer to the opposite. Writing lost the body when it was invented, and having suddenly been asked to do the body\'s job, it is growing the missing organs in public, at speed, in front of everyone.',
    ],
    questions: [
      {
        id: 'punctuation-for-feelings-q1',
        prompt: 'Why did the loss of tone in writing not matter for centuries?',
        options: [
          'Most people could not read',
          'Written language was formal, edited and asynchronous',
          'Letters included detailed descriptions of feeling',
          'Writing was mostly read aloud by a speaker',
        ],
        answerIndex: 1,
      },
      {
        id: 'punctuation-for-feelings-q2',
        prompt: 'According to the passage, why does a full stop now read as cold in short messages?',
        options: [
          'It suggests the writer is in a hurry',
          'It was traditionally used only in formal writing',
          'The line break already ends the thought, so adding it adds meaning',
          'Autocorrect rarely inserts one',
        ],
        answerIndex: 2,
      },
      {
        id: 'punctuation-for-feelings-q3',
        prompt: 'What claim does the passage make about emoji?',
        options: [
          'They behave grammatically rather than decoratively',
          'They are replacing words entirely',
          'They vary too much between cultures to be useful',
          'They are mainly used by younger writers',
        ],
        answerIndex: 0,
      },
      {
        id: 'punctuation-for-feelings-q4',
        prompt: 'What is the passage\'s overall conclusion?',
        options: [
          'Written language is deteriorating under pressure from speed',
          'Speech and writing are converging into one system',
          'Writing is rapidly developing new tools to do the body\'s work',
          'Formal writing will eventually absorb these conventions',
        ],
        answerIndex: 2,
      },
    ],
  },
  {
    id: 'blank-spaces',
    title: "The Cartographers' Blank Spaces",
    category: 'history',
    difficulty: 'hard',
    paragraphs: [
      'A map is usually read as a statement of fact, which is exactly what makes it such an effective argument. Every map is a set of decisions about what counts as real, what deserves a name, and what can be left out without complaint.',
      'The blank spaces are the most revealing part. On early maps, unmapped regions were often filled with decorative flourishes, invented coastlines or speculative interiors. The familiar phrase about dragons is largely a modern myth; it survives on almost no historical maps. But the impulse behind the story is accurate. Emptiness was uncomfortable, and mapmakers filled it, sometimes with ornament and sometimes with guesses that hardened into accepted geography once they had been copied a few times.',
      'Later, blankness became a deliberate technique rather than an embarrassment. As European powers expanded, interiors that had been confidently, if inaccurately, drawn were quietly emptied. Territory that was inhabited, farmed and governed appeared on the paper as unmarked space awaiting survey. A blank interior is an invitation. It implies that nothing there has yet been claimed, and therefore that a claim is available.',
      'The same logic operates through naming. To place a name on a feature that already had several is not to record it but to overwrite it, and the overwriting travels: the printed name enters treaties, then schoolbooks, then ordinary speech, until the earlier names sound like local colour rather than the original record.',
      'None of this requires a conspiracy. Mapmakers work from the sources they trust, and the sources they trust are the ones produced by the institutions paying for the map. The distortion is structural rather than deliberate, which is precisely why it is so durable.',
      'Reading an old map well means asking two questions at once. What was known, and what was it useful to appear not to know?',
    ],
    questions: [
      {
        id: 'blank-spaces-q1',
        prompt: 'What does the passage say about the phrase concerning dragons?',
        options: [
          'It appeared on most medieval maps',
          'It is largely a modern myth found on almost no historical maps',
          'It was a coded warning about pirates',
          'It marked areas with dangerous currents',
        ],
        answerIndex: 1,
      },
      {
        id: 'blank-spaces-q2',
        prompt: 'Why did previously drawn interiors later appear blank on maps?',
        options: [
          'Printing techniques could not reproduce fine detail',
          'Earlier surveys had been proven false',
          'Blank space implied the land was unclaimed and available',
          'Mapmakers ran short of reliable ink',
        ],
        answerIndex: 2,
      },
      {
        id: 'blank-spaces-q3',
        prompt: 'How does naming function according to the passage?',
        options: [
          'It records existing local usage accurately',
          'It overwrites earlier names and spreads through official documents',
          'It has little effect outside of cartography',
          'It was usually negotiated with inhabitants',
        ],
        answerIndex: 1,
      },
      {
        id: 'blank-spaces-q4',
        prompt: 'Why does the passage call the distortion durable?',
        options: [
          'Because it is structural rather than deliberate',
          'Because old maps are rarely re-examined',
          'Because treaties cannot be renegotiated',
          'Because printed maps outlast manuscripts',
        ],
        answerIndex: 0,
      },
    ],
  },
];
