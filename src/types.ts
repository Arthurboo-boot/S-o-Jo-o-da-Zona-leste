export type SentimentType = 'excelente' | 'bom' | 'regular' | 'ruim' | 'pessimo';

export interface CategoryRatings {
  atracoes: number;      // 1-5
  estrutura: number;     // 1-5
  seguranca: number;     // 1-5
  limpeza: number;       // 1-5
  alimentacao: number;   // 1-5
  transito: number;      // 1-5
}

export interface Feedback {
  id: string;
  name: string;
  location: string;
  stars: number;         // Overall star rating (1-5)
  sentiment: SentimentType;
  comment: string;
  categories: CategoryRatings;
  whatsappSent: boolean;
  createdAt: string;     // ISO String
  isSeeded?: boolean;    // Flag for initial mock comments
}

export interface Statistics {
  totalCount: number;
  averageStars: number;
  approvalRate: number;  // % of Excelente + Bom
  sentimentDistribution: Record<SentimentType, number>;
  categoryAverages: Record<keyof CategoryRatings, number>;
}
