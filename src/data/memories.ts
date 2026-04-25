export interface Memory {
  id: string;
  globeId: string;
  img: string;
  title: string;
  caption: string;
  category: string;
}

export const MEMORIES: Memory[] = [
  // ── Family (original 5) ────────────────────────────────────────────────────
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
  // ── Family (50th birthday party — 14 new) ─────────────────────────────────
  {
    id: '50th-dance',
    globeId: 'family',
    img: '/images/photo-family-50th-dance.jpg',
    title: 'The Dance',
    caption: 'Fifty years and still moving. Still choosing joy.',
    category: 'Family',
  },
  {
    id: '50th-group',
    globeId: 'family',
    img: '/images/photo-family-50th-group.jpg',
    title: 'All Together',
    caption: 'This is the wealth. Right here. Everyone in the same room.',
    category: 'Family',
  },
  {
    id: '50th-trio',
    globeId: 'family',
    img: '/images/photo-family-50th-trio.jpg',
    title: 'The Three',
    caption: 'Some bonds need no explanation. They just are.',
    category: 'Family',
  },
  {
    id: 'party-1',
    globeId: 'family',
    img: '/images/img-1777080178662-25nv.jpg',
    title: 'Celebration',
    caption: 'Every milestone is a monument to everything that made it possible.',
    category: 'Family',
  },
  {
    id: 'party-2',
    globeId: 'family',
    img: '/images/img-1777080178981-7s97.jpg',
    title: 'Together',
    caption: 'The people in this room are the reason for every early morning.',
    category: 'Family',
  },
  {
    id: 'party-3',
    globeId: 'family',
    img: '/images/img-1777080179002-lwlr.jpg',
    title: 'Gathered',
    caption: 'You only understand the value of presence when it becomes absence.',
    category: 'Family',
  },
  {
    id: 'party-4',
    globeId: 'family',
    img: '/images/img-1777080179088-8mow.jpg',
    title: 'Alive',
    caption: 'Not performing happiness. Living it.',
    category: 'Family',
  },
  {
    id: 'party-5',
    globeId: 'family',
    img: '/images/img-1777080179276-pdvc.jpg',
    title: 'In the Room',
    caption: 'Being here — fully here — is its own kind of discipline.',
    category: 'Family',
  },
  {
    id: 'party-6',
    globeId: 'family',
    img: '/images/img-1777080179605-3d59.jpg',
    title: 'Laughter',
    caption: 'The loudest rooms are the ones built on real love.',
    category: 'Family',
  },
  {
    id: 'party-7',
    globeId: 'family',
    img: '/images/img-1777080179742-2vlj.jpg',
    title: 'Moment',
    caption: 'A moment that will outlive the night that held it.',
    category: 'Family',
  },
  {
    id: 'party-8',
    globeId: 'family',
    img: '/images/img-1777080180756-6vih.jpg',
    title: 'Connected',
    caption: 'No algorithm builds what decades of showing up builds.',
    category: 'Family',
  },
  {
    id: 'party-9',
    globeId: 'family',
    img: '/images/img-1777080180969-alln.jpg',
    title: 'Warmth',
    caption: 'The kind of warmth that only comes from choosing each other, again and again.',
    category: 'Family',
  },
  {
    id: 'party-10',
    globeId: 'family',
    img: '/images/img-1777080183906-a4er.jpg',
    title: 'Fifty',
    caption: 'Fifty years is not just a number. It is a body of work.',
    category: 'Family',
  },
  {
    id: 'party-11',
    globeId: 'family',
    img: '/images/img-1777080184042-fd34.jpg',
    title: 'Full',
    caption: 'A full life looks exactly like this.',
    category: 'Family',
  },
  // ── Discipline ─────────────────────────────────────────────────────────────
  {
    id: 'bjj',
    globeId: 'discipline',
    img: '/images/photo-3wun-BJJ.jpg',
    title: 'Black Belt',
    caption: 'A black belt is just a white belt who did not quit. Every session is a vote for who you are becoming.',
    category: 'Discipline',
  },
  // ── Reflection ─────────────────────────────────────────────────────────────
  {
    id: 'dance',
    globeId: 'reflection',
    img: '/images/photo-een9-birthday-dance.jpg',
    title: 'Presence',
    caption: 'The ability to be fully here — not managing, not planning — just alive in the moment.',
    category: 'Reflection',
  },
  // ── Growth ─────────────────────────────────────────────────────────────────
  {
    id: 'skiing',
    globeId: 'growth',
    img: '/images/photo-8wp2-skiing.jpg',
    title: 'Fully Lived',
    caption: 'Growth is not always a spreadsheet. Sometimes it is a mountain and the decision to go down.',
    category: 'Growth',
  },
];
