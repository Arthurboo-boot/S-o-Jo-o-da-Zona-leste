import { Feedback, Statistics, SentimentType, CategoryRatings } from './types';

export function calculateStats(feedbacks: Feedback[]): Statistics {
  const totalCount = feedbacks.length;
  if (totalCount === 0) {
    return {
      totalCount: 0,
      averageStars: 0,
      approvalRate: 0,
      sentimentDistribution: { excelente: 0, bom: 0, regular: 0, ruim: 0, pessimo: 0 },
      categoryAverages: { atracoes: 0, estrutura: 0, seguranca: 0, limpeza: 0, alimentacao: 0, transito: 0 }
    };
  }

  let sumStars = 0;
  let approvalCount = 0;

  const sentimentDistribution: Record<SentimentType, number> = {
    excelente: 0,
    bom: 0,
    regular: 0,
    ruim: 0,
    pessimo: 0
  };

  const categorySums: Record<keyof CategoryRatings, number> = {
    atracoes: 0,
    estrutura: 0,
    seguranca: 0,
    limpeza: 0,
    alimentacao: 0,
    transito: 0
  };

  feedbacks.forEach((f) => {
    sumStars += f.stars;
    if (f.sentiment === 'excelente' || f.sentiment === 'bom') {
      approvalCount++;
    }
    sentimentDistribution[f.sentiment] = (sentimentDistribution[f.sentiment] || 0) + 1;

    // Sum matching aspects
    categorySums.atracoes += f.categories.atracoes;
    categorySums.estrutura += f.categories.estrutura;
    categorySums.seguranca += f.categories.seguranca;
    categorySums.limpeza += f.categories.limpeza;
    categorySums.alimentacao += f.categories.alimentacao;
    categorySums.transito += f.categories.transito;
  });

  const categoryAverages: Record<keyof CategoryRatings, number> = {
    atracoes: Math.round((categorySums.atracoes / totalCount) * 10) / 10,
    estrutura: Math.round((categorySums.estrutura / totalCount) * 10) / 10,
    seguranca: Math.round((categorySums.seguranca / totalCount) * 10) / 10,
    limpeza: Math.round((categorySums.limpeza / totalCount) * 10) / 10,
    alimentacao: Math.round((categorySums.alimentacao / totalCount) * 10) / 10,
    transito: Math.round((categorySums.transito / totalCount) * 10) / 10
  };

  return {
    totalCount,
    averageStars: Math.round((sumStars / totalCount) * 10) / 10,
    approvalRate: Math.round((approvalCount / totalCount) * 100),
    sentimentDistribution,
    categoryAverages
  };
}

export function getSentimentEmoji(sentiment: SentimentType): string {
  switch (sentiment) {
    case 'excelente': return '🤠';
    case 'bom': return '😊';
    case 'regular': return '😐';
    case 'ruim': return '🙁';
    case 'pessimo': return '😡';
  }
}

export function getSentimentLabel(sentiment: SentimentType): string {
  switch (sentiment) {
    case 'excelente': return 'Excelente';
    case 'bom': return 'Bom';
    case 'regular': return 'Regular';
    case 'ruim': return 'Ruim';
    case 'pessimo': return 'Péssimo';
  }
}

export function generateWhatsAppText(feedback: Feedback): string {
  const starsString = '⭐'.repeat(feedback.stars) + '☆'.repeat(5 - feedback.stars);
  const emoji = getSentimentEmoji(feedback.sentiment);
  const label = getSentimentLabel(feedback.sentiment).toUpperCase();
  
  const formattedDate = new Date(feedback.createdAt).toLocaleString('pt-BR', {
    timeZone: 'UTC',
    dateStyle: 'short',
    timeStyle: 'short'
  });

  return `🔥 *PESQUISA DE SATISFAÇÃO - SÃO JOÃO DE PETROLINA* 🌽
--------------------------------------------------
*Avaliador:* ${feedback.name || 'Anônimo'}
*Origem:* ${feedback.location || 'Petrolina - PE'}
*Data:* ${formattedDate}

*AVALIAÇÃO GERAL:*
- Opinião Geral: ${emoji} *${label}*
- Estrelas: ${starsString} (${feedback.stars}/5)

*COMENTÁRIO DO USUÁRIO:*
"${feedback.comment || 'Sem comentário adicional.'}"

*NOTAS DETALHADAS POR SETOR:*
🎵 Atrações/Shows: ${'★'.repeat(feedback.categories.atracoes)}${'☆'.repeat(5 - feedback.categories.atracoes)} (${feedback.categories.atracoes}/5)
🎪 Estrutura do Pátio: ${'★'.repeat(feedback.categories.estrutura)}${'☆'.repeat(5 - feedback.categories.estrutura)} (${feedback.categories.estrutura}/5)
🛡️ Segurança Geral: ${'★'.repeat(feedback.categories.seguranca)}${'☆'.repeat(5 - feedback.categories.seguranca)} (${feedback.categories.seguranca}/5)
🧼 Limpeza/Banheiros: ${'★'.repeat(feedback.categories.limpeza)}${'☆'.repeat(5 - feedback.categories.limpeza)} (${feedback.categories.limpeza}/5)
🍢 Alimentação/Preços: ${'★'.repeat(feedback.categories.alimentacao)}${'☆'.repeat(5 - feedback.categories.alimentacao)} (${feedback.categories.alimentacao}/5)
🚗 Trânsito e Acesso: ${'★'.repeat(feedback.categories.transito)}${'☆'.repeat(5 - feedback.categories.transito)} (${feedback.categories.transito}/5)

--------------------------------------------------
_Enviado pelo Portal de Monitoramento e Opinião São João de Petrolina_`;
}

export function generateWhatsAppLink(feedback: Feedback, customPhone?: string): string {
  const text = encodeURIComponent(generateWhatsAppText(feedback));
  const cleanPhone = customPhone ? customPhone.replace(/\D/g, '') : '';
  
  if (cleanPhone) {
    return `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${text}`;
  }
  return `https://api.whatsapp.com/send?text=${text}`;
}
