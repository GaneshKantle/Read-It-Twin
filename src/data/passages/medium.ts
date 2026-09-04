import type { PassageSeed } from '@/types/run';

export const mediumPassages: PassageSeed[] = [
  {
    id: 'cost-of-remembering',
    title: 'The Cost of Remembering',
    category: 'technology',
    difficulty: 'medium',
    paragraphs: [
      'A photograph you take today will probably outlive you, but not for the reason you would like. It will not survive because it is precious. It will survive because deleting it is more trouble than keeping it.',
      'Storage has become so cheap that the economics of forgetting have inverted. For most of human history, remembering was the expensive act. Clay had to be fired, parchment scraped and reused, ledgers copied by hand in rooms full of people paid to copy ledgers. Anything preserved had to earn its place. Now the opposite holds. Keeping everything costs less than the labour of deciding what to throw away.',
      'The cost has not disappeared, though. It has moved. Somewhere there is a building the size of several football pitches, drawing as much electricity as a small town, filled with drives that spin so that a photograph of a lunch you have entirely forgotten can be retrieved in under a second.',
      'Those buildings need cooling, and cooling needs water. They need replacement hardware on a rolling schedule, because drives fail predictably enough that the whole system is designed around their failure rather than their reliability. Every file is written more than once, in more than one place, so that no single failure matters to anyone.',
      'So the true price of a casual photograph is not the megabytes. It is a share of a cooling system, a share of a power contract, and a share of the redundant copies made on your behalf without your knowledge.',
      'None of this is an argument for deleting your photographs. It is an argument for noticing that the cloud is a weather metaphor bolted onto some of the heaviest infrastructure our species has ever built.',
    ],
    questions: [
      {
        id: 'cost-of-remembering-q1',
        prompt: 'What inversion does the passage describe?',
        options: [
          'Photographs now last longer than paper records',
          'Remembering used to be expensive; now deciding what to discard is',
          'Storage costs rise as devices get smaller',
          'People take fewer photographs than they once did',
        ],
        answerIndex: 1,
      },
      {
        id: 'cost-of-remembering-q2',
        prompt: 'Why is every file written more than once?',
        options: [
          'To speed up retrieval times',
          'To satisfy legal requirements',
          'Because the system is designed around predictable drive failure',
          'Because compression is unreliable',
        ],
        answerIndex: 2,
      },
      {
        id: 'cost-of-remembering-q3',
        prompt: 'Besides electricity, what resource does the passage say cooling requires?',
        options: ['Water', 'Compressed air', 'Rare earth metals', 'Diesel fuel'],
        answerIndex: 0,
      },
      {
        id: 'cost-of-remembering-q4',
        prompt: 'What is the passage\'s final point about the term "the cloud"?',
        options: [
          'It is an accurate description of distributed systems',
          'It was invented by marketing departments in the 1990s',
          'It is a light metaphor attached to extremely heavy infrastructure',
          'It will be replaced by a more technical term',
        ],
        answerIndex: 2,
      },
    ],
  },
  {
    id: 'box-that-shrank-the-world',
    title: 'The Box That Shrank the World',
    category: 'business',
    difficulty: 'medium',
    paragraphs: [
      'Before the middle of the twentieth century, loading a ship was a craft. Dockworkers moved barrels, sacks and crates by hand and by hook, fitting awkward shapes against one another like a puzzle that had to be solved fresh at every port.',
      'It was slow in a way that is hard to imagine now. Cargo could spend longer sitting on a dock than it spent crossing an ocean. Theft was constant and more or less expected, since goods passed through many hands in the open. The cost of moving something was dominated not by the voyage but by the loading.',
      'The idea that changed this was not really a technology. Steel boxes are not difficult to manufacture. The difficulty was agreement. For the box to work it had to be the same size everywhere: the same size on a truck in one country, on a train in another, and on a crane owned by a competitor.',
      'That kind of standardisation is expensive in a way engineering is not. Ports had to be rebuilt around cranes rather than gangs of workers. Ships had to be redesigned as floating shelves. Unions had to negotiate over jobs everyone knew were disappearing. Firms had to adopt dimensions chosen by rivals.',
      'When it finally settled, the cost of moving goods collapsed. And when shipping becomes nearly free relative to the value of what is shipped, it stops being a factor in deciding where things are made. Factories drift toward cheap labour, components cross oceans several times before assembly, and a product stops having a single country of origin.',
      'The box did not simply move cargo more efficiently. It quietly rearranged the map of who makes what for whom.',
    ],
    questions: [
      {
        id: 'box-that-shrank-the-world-q1',
        prompt: 'What was the main obstacle to containerisation?',
        options: [
          'Manufacturing steel boxes cheaply',
          'Getting everyone to agree on a single standard',
          'Building ships large enough',
          'Finding ports deep enough for the new ships',
        ],
        answerIndex: 1,
      },
      {
        id: 'box-that-shrank-the-world-q2',
        prompt: 'What dominated the cost of moving goods before containers?',
        options: [
          'Fuel for the voyage',
          'Insurance against storms',
          'Port fees and tariffs',
          'The loading and unloading',
        ],
        answerIndex: 3,
      },
      {
        id: 'box-that-shrank-the-world-q3',
        prompt: 'What broader consequence does the passage attribute to cheap shipping?',
        options: [
          'Products stopped having a single country of origin',
          'Ports became the largest employers in most cities',
          'Ocean freight became slower but more reliable',
          'Manufacturing returned to wealthy countries',
        ],
        answerIndex: 0,
      },
    ],
  },
  {
    id: 'salt-roads',
    title: 'The Salt Roads',
    category: 'history',
    difficulty: 'medium',
    paragraphs: [
      'It is difficult now to take salt seriously. It sits on the table in a shaker that nobody guards. For most of recorded history it was closer to a strategic resource, because salt was not a seasoning first. It was the only reliable way to keep food from rotting.',
      'A society that could preserve fish and meat could store surplus, feed an army on the move, and survive a bad winter. A society that could not was permanently at the mercy of the harvest. That single fact turned a common mineral into something worth crossing deserts for.',
      'Caravans moved slabs of it south across the Sahara, trading with kingdoms that had gold but no salt, and returning with gold from kingdoms that had salt but no gold. Both sides walked away convinced they had cheated the other, which is usually the sign of a trade that will continue.',
      'Governments noticed. A commodity that every household must buy, in roughly predictable quantities, regardless of income, is close to a perfect object of taxation. Salt taxes funded states across Europe and Asia for centuries, and they were resented with a consistency that few other taxes have achieved.',
      'That resentment had teeth. Salt levies helped provoke unrest in pre-revolutionary France, and centuries later a colonial salt monopoly in India was challenged by a march to the sea specifically because the tax touched everyone, including the poorest.',
      'The pattern is worth remembering. What a society taxes reveals what it thinks nobody can refuse.',
    ],
    questions: [
      {
        id: 'salt-roads-q1',
        prompt: 'Why did salt matter so much historically?',
        options: [
          'It was rare in most regions',
          'It was the main way to preserve food',
          'It was used as currency everywhere',
          'It was required for metalworking',
        ],
        answerIndex: 1,
      },
      {
        id: 'salt-roads-q2',
        prompt: 'What was traded across the Sahara according to the passage?',
        options: [
          'Salt for gold',
          'Salt for grain',
          'Gold for horses',
          'Salt for textiles',
        ],
        answerIndex: 0,
      },
      {
        id: 'salt-roads-q3',
        prompt: 'Why does the passage call salt close to a perfect object of taxation?',
        options: [
          'It was easy to transport and store',
          'Only wealthy households purchased it',
          'Every household had to buy it regardless of income',
          'Its price rose steadily over time',
        ],
        answerIndex: 2,
      },
    ],
  },
];
