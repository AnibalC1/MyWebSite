export interface Memory {
  id: string;
  globeId: string;
  img: string;
  title: string;
  caption: string;
  category: string;
}

export const MEMORIES: Memory[] = [
  {
    id: 'selfie',
    globeId: 'family',
    img: '/images/photo-oq31-family-selfie.jpg',
    title: 'Present Tense',
    caption: 'This is the version of myself I chose. Not by accident — by decision, repeated daily.',
    category: 'Family',
  },
  {
    id: 'bday',
    globeId: 'family',
    img: '/images/photo-0afl-birthday-family.jpg',
    title: 'Why I Build',
    caption: 'Every system I design, every discipline I build — it is all for this table.',
    category: 'Family',
  },
  {
    id: 'lift',
    globeId: 'family',
    img: '/images/photo-e27v-birthday-lift.jpg',
    title: 'Joy',
    caption: 'Joy that is not performed. Joy that is just there, in the lifting.',
    category: 'Family',
  },
  {
    id: 'xmas-t',
    globeId: 'family',
    img: '/images/photo-5dif-christmas-tory.jpg',
    title: 'Home',
    caption: 'Home is not a place. It is a frequency. A warmth that does not need words.',
    category: 'Family',
  },
  {
    id: 'xmas-s',
    globeId: 'family',
    img: '/images/photo-ayyg-christmas-son.jpg',
    title: 'Legacy',
    caption: 'He watches how I move. That is the real deadline. The real deliverable.',
    category: 'Family',
  },
  {
    id: 'bjj',
    globeId: 'discipline',
    img: '/images/photo-3wun-BJJ.jpg',
    title: 'Black Belt',
    caption: 'A black belt is just a white belt who did not quit. Every session is a vote for who you are becoming.',
    category: 'Discipline',
  },
  {
    id: 'dance',
    globeId: 'reflection',
    img: '/images/photo-een9-birthday-dance.jpg',
    title: 'Presence',
    caption: 'The ability to be fully here — not managing, not planning — just alive in the moment.',
    category: 'Reflection',
  },
  {
    id: 'skiing',
    globeId: 'growth',
    img: '/images/photo-8wp2-skiing.jpg',
    title: 'Fully Lived',
    caption: 'Growth is not always a spreadsheet. Sometimes it is a mountain and the decision to go down.',
    category: 'Growth',
  },
];
