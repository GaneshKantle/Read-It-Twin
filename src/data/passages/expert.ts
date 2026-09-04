import type { PassageSeed } from '@/types/run';

export const expertPassages: PassageSeed[] = [
  {
    id: 'ship-plank-self',
    title: 'The Ship, the Plank, the Self',
    category: 'philosophy',
    difficulty: 'expert',
    paragraphs: [
      'A ship returns from a long voyage with one rotten plank, which is replaced. It sails again, and another plank is replaced, and over many years every original piece of timber is swapped out. The ship has never been out of service, never been rebuilt, never been renamed. Is it the same ship?',
      'Most people answer yes without much hesitation. Continuity seems to do the work: the changes were gradual, the function unbroken, the crew and the harbour never in any doubt about which vessel they meant.',
      'Then the problem tightens. Suppose someone has been collecting the discarded planks, and assembles them into a ship of their own. Now there are two vessels. One has continuity of form and use; the other has every original component. Both have a serious claim, and they cannot both be the original, because the original was one thing and these are unmistakably two.',
      'The usual instinct is that a fact must exist which settles it, and that we simply lack the information to find it. But there is no further fact hiding anywhere. Every physical detail is already available. What is missing is not evidence but a decision about which criterion of identity we intend to use, and that decision was never made, because ordinary language never needed it. Words are built for the cases we usually encounter, and they fail quietly at the edges rather than announcing that they have run out.',
      'The uncomfortable move is to turn the question on ourselves. The material of a human body is continually replaced. Memories are not stored intact but reconstructed, and they drift a little with each retrieval. Personality shifts across decades, sometimes sharply. The child in an old photograph shares almost no physical matter with the adult holding it, and often disagrees with them about most things worth having an opinion on.',
      'We insist on identity anyway, and we do it for reasons that are largely practical rather than metaphysical. Promises must be kept by someone. Debts must be owed by someone. Punishment and praise both require a stable target. Personal identity may be less a discovery about what we are than a convention we maintain because too much depends on it.',
      'Which does not make it false. Conventions can be indispensable. It only means the question of whether you are the same person who began this passage may not have an answer waiting to be found, but one we have agreed in advance to give.',
    ],
    questions: [
      {
        id: 'ship-plank-self-q1',
        prompt: 'What complication does the collector of discarded planks introduce?',
        options: [
          'The original ship is proven to be a forgery',
          'Two vessels each have a serious claim to being the original',
          'The planks turn out to be unusable',
          'The crew refuses to sail the repaired ship',
        ],
        answerIndex: 1,
      },
      {
        id: 'ship-plank-self-q2',
        prompt: 'According to the passage, what is actually missing when we cannot settle the question?',
        options: [
          'Physical evidence about the planks',
          'Historical records of the voyage',
          'A decision about which criterion of identity to use',
          'Agreement among philosophers',
        ],
        answerIndex: 2,
      },
      {
        id: 'ship-plank-self-q3',
        prompt: 'Why does the passage say we insist on personal identity?',
        options: [
          'Because memory proves continuity',
          'For practical reasons such as promises, debts and blame',
          'Because physical matter is largely retained',
          'Because the law requires a metaphysical basis',
        ],
        answerIndex: 1,
      },
      {
        id: 'ship-plank-self-q4',
        prompt: 'What is the passage\'s closing position on identity being a convention?',
        options: [
          'It makes identity an illusion best abandoned',
          'It shows the question is meaningless',
          'It does not make identity false, since conventions can be indispensable',
          'It proves the ship and the self are different cases',
        ],
        answerIndex: 2,
      },
    ],
  },
  {
    id: 'arrow-forward',
    title: 'The Arrow That Only Points Forward',
    category: 'science',
    difficulty: 'expert',
    paragraphs: [
      'Almost every fundamental law of physics works equally well in either direction of time. Film two billiard balls colliding, run the film backwards, and nothing in the footage violates mechanics. The reversed collision is a perfectly legal event. The equations do not contain a preference.',
      'Yet the world we inhabit is aggressively one-directional. Cups shatter and never reassemble. Heat flows from the hot object to the cold one and stops there. We remember yesterday and not tomorrow. Something separates the two directions, and it does not appear to be written into the basic laws.',
      'The standard answer is statistical. A system has an enormous number of possible arrangements of its parts, and only a vanishingly small fraction of those arrangements look organised to us. Intact cups occupy a tiny region of that space; scattered fragments occupy an unimaginably larger one. Nothing forbids the fragments from reassembling. It is simply that the arrangements we would call reassembled are so rare, relative to the alternatives, that the probability is indistinguishable from zero across the age of the universe.',
      'This explains why disorder tends to increase going forward. Unfortunately, the same reasoning applies just as well going backwards, since the argument is symmetric in time. Run it in reverse and it predicts that the past should also have been more disordered than the present, which is plainly false. Yesterday was not more chaotic than today.',
      'To break the symmetry, physicists add an assumption rather than a law: that the universe began in an extraordinarily ordered, extremely low-entropy state. Given that starting point, the statistical argument only has room to run in one direction, and the arrow appears. This assumption is usually called the past hypothesis, and it does a remarkable amount of work for something that is essentially a stipulation about initial conditions.',
      'The consequences reach further than thermodynamics. Memory itself depends on the same gradient. Recording a trace of an event requires expending energy and increasing disorder somewhere else, which is possible only in a universe still running down from an ordered beginning. We remember the past rather than the future not because the past is metaphysically fixed and the future open, but because the direction in which entropy increases is the only direction in which records can be made at all.',
      'The arrow of time, on this account, is not a feature of the laws. It is an inheritance from how things happened to start.',
    ],
    questions: [
      {
        id: 'arrow-forward-q1',
        prompt: 'What is unusual about fundamental physical laws with respect to time?',
        options: [
          'They only apply at very large scales',
          'They work equally well in either direction',
          'They forbid reversed collisions',
          'They require a fixed starting point',
        ],
        answerIndex: 1,
      },
      {
        id: 'arrow-forward-q2',
        prompt: 'Why does the statistical explanation alone fail?',
        options: [
          'It contradicts observed collisions',
          'It cannot be tested experimentally',
          'It applies symmetrically and wrongly predicts a more disordered past',
          'It only works for very small systems',
        ],
        answerIndex: 2,
      },
      {
        id: 'arrow-forward-q3',
        prompt: 'What is the past hypothesis?',
        options: [
          'A law derived from thermodynamics',
          'An assumption that the universe began in a very low-entropy state',
          'A claim that memory is unreliable',
          'A proof that time travel is impossible',
        ],
        answerIndex: 1,
      },
      {
        id: 'arrow-forward-q4',
        prompt: 'Why do we remember the past rather than the future?',
        options: [
          'Because the past is metaphysically fixed',
          'Because the brain evolved to store completed events',
          'Because records can only be made in the direction entropy increases',
          'Because future events have no physical trace',
        ],
        answerIndex: 2,
      },
    ],
  },
  {
    id: 'tyranny-of-average',
    title: 'The Tyranny of the Average',
    category: 'business',
    difficulty: 'expert',
    paragraphs: [
      'In the late 1940s the United States Air Force had a problem it could not explain. Its pilots were crashing at an alarming rate, and not in combat. The aircraft were inspected and cleared. The pilots were experienced and well trained. Nothing obvious accounted for the accidents.',
      'The cockpits had been designed in the 1920s around the dimensions of the average pilot, calculated from measurements taken at the time. One reasonable hypothesis was that pilots had simply grown larger over the intervening decades, so the Air Force commissioned a fresh study to update the average. More than four thousand pilots were measured across ten dimensions relevant to cockpit fit: height, chest circumference, arm length, and so on.',
      'A young researcher on the project decided to ask a slightly different question first. Rather than computing the new average, he defined a generous band around the existing one, roughly the middle thirty percent of the range on each dimension, and asked how many pilots fell inside that band on all ten measures at once.',
      'The answer was none. Out of more than four thousand men, not a single one was average across all ten dimensions. Even reducing the test to any three dimensions left fewer than five percent qualifying. A pilot with an average arm length would have an unusual chest, or unusually long legs, or a shorter torso. The average pilot, it turned out, was not a rare individual. He did not exist at all.',
      'The design implication was immediate and initially resisted: if nobody is average, then a cockpit fitted to the average fits nobody, and the only workable response is adjustability. Adjustable seats, adjustable pedals, adjustable straps. These are so standard now that their origin is invisible, and performance improved sharply once they arrived.',
      'The statistical lesson generalises badly beyond aviation, which is to say it applies everywhere and is ignored almost everywhere. An average is a summary of a distribution, not a description of any member of it. Averaging across dimensions that vary independently produces a profile that may correspond to no real case. The average customer, the average employee, the average user, and the average student are all constructions of the same kind.',
      'Designing for them is not a neutral simplification. It is designing for someone who is not there, and then wondering why the people who are there keep struggling.',
    ],
    questions: [
      {
        id: 'tyranny-of-average-q1',
        prompt: 'How many pilots fell within the average band on all ten dimensions?',
        options: ['None', 'Fewer than one hundred', 'About five percent', 'Roughly one third'],
        answerIndex: 0,
      },
      {
        id: 'tyranny-of-average-q2',
        prompt: 'What was the original hypothesis for the crashes?',
        options: [
          'Pilots were being trained too quickly',
          'Pilots had grown larger since the cockpits were designed',
          'The aircraft engines were unreliable',
          'Instrument layouts were too complex',
        ],
        answerIndex: 1,
      },
      {
        id: 'tyranny-of-average-q3',
        prompt: 'What design response followed from the finding?',
        options: [
          'Recruiting pilots closer to average dimensions',
          'Building several fixed cockpit sizes',
          'Making cockpit components adjustable',
          'Reducing the number of controls',
        ],
        answerIndex: 2,
      },
      {
        id: 'tyranny-of-average-q4',
        prompt: 'What is the general statistical lesson the passage draws?',
        options: [
          'Averages are unreliable when samples are small',
          'An average summarises a distribution but may describe no actual member',
          'Independent dimensions should never be measured together',
          'Design should always target the majority',
        ],
        answerIndex: 1,
      },
    ],
  },
];
