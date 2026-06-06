import { Feedback } from './types';

export const SEEDED_FEEDBACKS: Feedback[] = [
  {
    id: 'seed-1',
    name: 'Mateus Cavalcanti',
    location: 'Recife - PE',
    stars: 5,
    sentiment: 'excelente',
    comment: 'O maior São João do Brasil sem dúvidas! O show de João Gomes organizou o público de forma espetacular. Segurança nota 10, me senti super seguro com minha família.',
    categories: {
      atracoes: 5,
      estrutura: 5,
      seguranca: 5,
      limpeza: 4,
      alimentacao: 5,
      transito: 4
    },
    whatsappSent: false,
    createdAt: '2025-06-18T22:30:00Z',
    isSeeded: true
  },
  {
    id: 'seed-2',
    name: 'Ana Júlia Souza',
    location: 'Juazeiro - BA',
    stars: 4,
    sentiment: 'bom',
    comment: 'Atrações espetaculares e organização impecável das barracas. Só achei a fila dos banheiros do setor leste gigante após as 23h. Mas com certeza voltarei no próximo ano!',
    categories: {
      atracoes: 5,
      estrutura: 4,
      seguranca: 4,
      limpeza: 3,
      alimentacao: 4,
      transito: 3
    },
    whatsappSent: false,
    createdAt: '2025-06-19T18:15:00Z',
    isSeeded: true
  },
  {
    id: 'seed-3',
    name: 'Raimundo Nonato',
    location: 'Petrolina - PE',
    stars: 5,
    sentiment: 'excelente',
    comment: 'Como morador, tenho orgulho desse evento. O pátio de eventos principal está cada vez melhor estruturado. Muito espaço e policiamento por toda parte.',
    categories: {
      atracoes: 5,
      estrutura: 5,
      seguranca: 5,
      limpeza: 4,
      alimentacao: 4,
      transito: 4
    },
    whatsappSent: false,
    createdAt: '2025-06-20T01:10:00Z',
    isSeeded: true
  },
  {
    id: 'seed-4',
    name: 'Larissa Albuquerque',
    location: 'São Paulo - SP',
    stars: 3,
    sentiment: 'regular',
    comment: 'O evento é gigantesco e as atrações são as melhores do país. Porém, o engarrafamento para chegar e sair da área do festa foi extremamente exaustivo, quase 2 horas no trânsito.',
    categories: {
      atracoes: 5,
      estrutura: 3,
      seguranca: 4,
      limpeza: 3,
      alimentacao: 3,
      transito: 1
    },
    whatsappSent: false,
    createdAt: '2025-06-21T12:45:00Z',
    isSeeded: true
  },
  {
    id: 'seed-5',
    name: 'Carlos Heitor Mendes',
    location: 'Cabrobó - PE',
    stars: 2,
    sentiment: 'ruim',
    comment: 'Os shows foram ótimos, mas a limpeza nos arredores deixou muito a desejar. Banheiros químicos de difícil acesso na madrugada e bebidas caras nas barracas principais.',
    categories: {
      atracoes: 4,
      estrutura: 2,
      seguranca: 3,
      limpeza: 1,
      alimentacao: 2,
      transito: 3
    },
    whatsappSent: false,
    createdAt: '2025-06-22T03:20:00Z',
    isSeeded: true
  }
];
