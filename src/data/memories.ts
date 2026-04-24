export interface Memory {
  id: string;
  img: string;
  thumb: string; // same for now, will be separate thumbnails later
  title: string;
  caption: string;
  category: string;
}

export const MEMORIES: Memory[] = [
  {
    id: 'bjj-black-belt',
    img: '/images/photo-3wun-BJJ.jpg',
    thumb: '/images/photo-3wun-BJJ.jpg',
    title: 'Black Belt',
    caption: 'Years of pressure, repetition, and humility condensed into a single moment.',
    category: 'BJJ',
  },
  {
    id: 'family-birthday',
    img: '/images/photo-0afl-birthday-family.jpg',
    thumb: '/images/photo-0afl-birthday-family.jpg',
    title: 'Why I Build',
    caption: 'Every decision maps back to one reason. Everything else is downstream of that.',
    category: 'Family',
  },
  {
    id: 'skiing',
    img: '/images/photo-8wp2-skiing.jpg',
    thumb: '/images/photo-8wp2-skiing.jpg',
    title: 'Fully Lived',
    caption: 'A life that earns the right to be remembered.',
    category: 'Life',
  },
  {
    id: 'dance',
    img: '/images/photo-een9-birthday-dance.jpg',
    thumb: '/images/photo-een9-birthday-dance.jpg',
    title: 'Presence',
    caption: 'When you are fully in the moment, time stops mattering.',
    category: 'Reflection',
  },
  {
    id: 'lift',
    img: '/images/photo-e27v-birthday-lift.jpg',
    thumb: '/images/photo-e27v-birthday-lift.jpg',
    title: 'Joy',
    caption: 'The moments that remind you why all of it matters.',
    category: 'Family',
  },
  {
    id: 'christmas-tory',
    img: '/images/photo-5dif-christmas-tory.jpg',
    thumb: '/images/photo-5dif-christmas-tory.jpg',
    title: 'Home',
    caption: 'The foundation everything else is built on.',
    category: 'Family',
  },
  {
    id: 'christmas-son',
    img: '/images/photo-ayyg-christmas-son.jpg',
    thumb: '/images/photo-ayyg-christmas-son.jpg',
    title: 'Legacy',
    caption: 'Not what you leave behind. Who you leave behind.',
    category: 'Family',
  },
  {
    id: 'selfie',
    img: '/images/photo-oq31-family-selfie.jpg',
    thumb: '/images/photo-oq31-family-selfie.jpg',
    title: 'Present Tense',
    caption: 'Right now I am building — and becoming.',
    category: 'Life',
  },
];
