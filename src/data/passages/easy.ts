import type { PassageSeed } from '@/types/run';

export const easyPassages: PassageSeed[] = [
  {
    id: 'unfinished-song',
    title: 'The Unfinished Song',
    category: 'psychology',
    difficulty: 'easy',
    paragraphs: [
      'A waiter can hold a dozen orders in his head at once. He knows table four wants the fish, that table nine has changed its mind twice, and that someone near the window is still deciding. Then the plates go out, the bill is paid, and the whole arrangement vanishes from his memory within minutes.',
      'In the 1920s a researcher noticed this pattern and decided to test it. She asked people to work through a series of small tasks: puzzles, arithmetic, simple crafts. Some they were allowed to finish. Others were interrupted partway through. Later she asked them to recall as many of the tasks as they could.',
      'The interrupted ones came back far more easily. Unfinished work seemed to stay awake in the mind, tapping quietly for attention, while completed work went silent.',
      'The effect explains more than laboratory puzzles. It is why a song cut off mid-chorus loops in your head all afternoon, and why a conversation that ended badly replays itself at two in the morning. Closure is not only emotionally satisfying. It is a filing instruction. Without it the mind keeps the folder open on the desk, refusing to put it away.',
      'Which is also why starting is often the hardest part, and stopping is the second hardest. Once a thing has been opened, some part of you insists on closing it.',
    ],
    questions: [
      {
        id: 'unfinished-song-q1',
        prompt: 'What did the researcher do differently with some of the tasks?',
        options: [
          'She interrupted them partway through',
          'She made them much harder',
          'She removed the time limit',
          'She asked people to repeat them twice',
        ],
        answerIndex: 0,
      },
      {
        id: 'unfinished-song-q2',
        prompt: 'According to the passage, what happens to completed tasks in memory?',
        options: [
          'They are remembered more vividly',
          'They go quiet and are recalled less easily',
          'They are confused with unfinished ones',
          'They resurface after several days',
        ],
        answerIndex: 1,
      },
      {
        id: 'unfinished-song-q3',
        prompt: 'The passage compares closure to which of the following?',
        options: [
          'A reward for effort',
          'A form of rest',
          'A filing instruction',
          'A kind of forgetting',
        ],
        answerIndex: 2,
      },
    ],
  },
  {
    id: 'what-the-roots-say',
    title: 'What the Roots Are Saying',
    category: 'nature',
    difficulty: 'easy',
    paragraphs: [
      'Walk into an old forest and you will be told, quite confidently, that you are looking at individual trees. You are not. You are looking at the visible tips of a negotiation that has been running underground for millions of years.',
      'Beneath the soil, fungal threads thinner than a hair wrap themselves around and inside tree roots. The fungus cannot make its own sugar, so it takes some from the tree. In exchange it reaches into the soil far more finely than any root could, pulling up water, phosphorus and nitrogen and handing them over.',
      'Because a single fungal network can connect many trees at once, these trades do not stay private. Sugar moves from a tree standing in full sunlight to a seedling stuck in shade. Chemical warnings about insect attacks travel from a chewed tree to its neighbours, which begin producing bitter defensive compounds before the insects ever reach them.',
      'It is tempting to call this cooperation, and some of it is. But the fungus is not a charity. It bargains, it favours the trees that pay best, and it has been caught keeping more than its share.',
      'What looks like a peaceful wood is closer to a crowded marketplace. One that happens to be entirely silent, entirely dark, and directly beneath your boots.',
    ],
    questions: [
      {
        id: 'what-the-roots-say-q1',
        prompt: 'What does the fungus receive from the tree?',
        options: ['Nitrogen', 'Water', 'Sugar', 'Phosphorus'],
        answerIndex: 2,
      },
      {
        id: 'what-the-roots-say-q2',
        prompt: 'How do neighbouring trees benefit before insects reach them?',
        options: [
          'They drop their leaves early',
          'Chemical warnings let them build defences in advance',
          'They grow thicker bark within hours',
          'The fungus physically blocks the insects',
        ],
        answerIndex: 1,
      },
      {
        id: 'what-the-roots-say-q3',
        prompt: 'How does the passage finally characterise the fungus?',
        options: [
          'As a selfless partner to the forest',
          'As a parasite that gives nothing back',
          'As a bargainer in a kind of marketplace',
          'As a threat to older trees',
        ],
        answerIndex: 2,
      },
    ],
  },
  {
    id: 'keepers-inventory',
    title: "The Lighthouse Keeper's Inventory",
    category: 'fiction',
    difficulty: 'easy',
    paragraphs: [
      'Every Sunday, Mara counted what the sea had given her. She kept the list in a ledger her predecessor had left behind, and she wrote in the same cramped hand he had used, though she had never met him.',
      'Week eleven: one boot, left foot, size unknown. A crate lid stamped with a word in a language she did not read. Forty-three metres of blue rope, which she coiled and hung beside the door, because rope was always worth keeping.',
      "Week nineteen: a child's shoe. She wrote it down, and then she sat for a while with the pen in her hand, and then she wrote beneath it, nothing else came ashore, which was true.",
      'The lamp above her turned and turned. Ships passed and did not stop, because that was the entire point of her. Success, in her profession, looked exactly like nothing happening at all.',
      'In the spring she finally read the ledger\'s first page, which she had never bothered with. Week one, in that same cramped hand: began keeping this so someone would know I was here.',
    ],
    questions: [
      {
        id: 'keepers-inventory-q1',
        prompt: 'What does Mara record in the ledger?',
        options: [
          'The ships that pass the lighthouse',
          'Items that wash ashore',
          'Repairs made to the lamp',
          'The weather each Sunday',
        ],
        answerIndex: 1,
      },
      {
        id: 'keepers-inventory-q2',
        prompt: 'Why do ships pass without stopping?',
        options: [
          'The harbour is closed to them',
          'They cannot see the lighthouse',
          'Because the lighthouse is doing its job',
          'Mara signals them away',
        ],
        answerIndex: 2,
      },
      {
        id: 'keepers-inventory-q3',
        prompt: "What does the ledger's first page reveal?",
        options: [
          'The previous keeper started it so someone would know he existed',
          'The lighthouse was scheduled to close',
          'The ledger belonged to a ship captain',
          'The previous keeper had left instructions for repairs',
        ],
        answerIndex: 0,
      },
    ],
  },
];
