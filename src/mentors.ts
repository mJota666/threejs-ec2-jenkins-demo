export type MentorCard = {
  id: string;
  name: string;
  image: string;
  rating: string;
  role: string;
  theme: 'gold' | 'blue' | 'red';
  stats: Array<{
    label: string;
    value: string;
  }>;
};

export const mentorCards: MentorCard[] = [
  {
    id: 'wyatt',
    name: 'Wyatt Truong',
    image: '/mentors/images2.jpg',
    rating: '99',
    role: 'LEAD',
    theme: 'gold',
    stats: [
      { value: '98', label: 'ARCH' },
      { value: '97', label: 'SHIP' },
      { value: '99', label: 'LEAD' },
      { value: '96', label: 'CODE' },
      { value: '95', label: 'OPS' },
      { value: '99', label: 'IQ' },
    ],
  },
  {
    id: 'vu',
    name: 'Vu Tran',
    image: '/mentors/mentor.jpg',
    rating: '97',
    role: 'PLAY',
    theme: 'blue',
    stats: [
      { value: '96', label: 'ARCH' },
      { value: '98', label: 'SHIP' },
      { value: '95', label: 'LEAD' },
      { value: '99', label: 'CODE' },
      { value: '94', label: 'OPS' },
      { value: '97', label: 'IQ' },
    ],
  },
  {
    id: 'danh',
    name: 'Danh Bui',
    image: '/mentors/images2.jpg',
    rating: '98',
    role: 'CORE',
    theme: 'red',
    stats: [
      { value: '95', label: 'ARCH' },
      { value: '96', label: 'SHIP' },
      { value: '97', label: 'LEAD' },
      { value: '95', label: 'CODE' },
      { value: '99', label: 'OPS' },
      { value: '196', label: 'IQ' },
    ],
  },
];
