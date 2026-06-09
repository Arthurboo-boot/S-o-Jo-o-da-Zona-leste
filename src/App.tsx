import React, { useState, useEffect, useMemo } from 'react';
import { 
  Star, 
  Lock, 
  Unlock, 
  Trash2, 
  MessageSquare, 
  Calendar, 
  MapPin, 
  User, 
  Check, 
  ChevronRight, 
  AlertCircle,
  Eye,
  EyeOff,
  TrendingDown,
  TrendingUp,
  Award
} from 'lucide-react';

// Firebase Imports
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, onSnapshot, doc, setDoc, deleteDoc, query, orderBy, getDocFromServer } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase & Firestore
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth();

// Error Handling Requirements conform to firebase-integration skill
enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Validate Connection to Firestore (Skill Core Requirement)
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if(error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
  }
}
testConnection();

// Simplified Feedback interface
interface SimpleFeedback {
  id: string;
  name: string;
  location: string;
  rating: 'bom' | 'regular' | 'ruim'; // Simple satisfaction
  stars: number; // 1 to 5 stars
  comment: string;
  createdAt: string; // Dynamic local date ISO string
}

const DEFAULT_FEEDBACKS: SimpleFeedback[] = [
  {
    id: '1',
    name: 'Mateus Bezerra',
    location: 'Petrolina - PE',
    rating: 'bom',
    stars: 5,
    comment: 'A decoração esteve maravilhosa e os shows de forró autêntico foram o ponto alto! Que festa linda.',
    createdAt: new Date(2025, 5, 23, 21, 15).toISOString()
  },
  {
    id: '2',
    name: 'Renata Albuquerque',
    location: 'Juazeiro - BA',
    rating: 'bom',
    stars: 4,
    comment: 'Muito organizado, policiamento presente em todas as esquinas. Só a entrada de carros que estava bem congestionada.',
    createdAt: new Date(2025, 5, 24, 2, 30).toISOString()
  },
  {
    id: '3',
    name: 'José Carlos',
    location: 'Cabrobó - PE',
    rating: 'regular',
    stars: 3,
    comment: 'As atrações foram fantásticas, mas o preço das bebidas nas barracas de alimentação estava um pouco salgado.',
    createdAt: new Date(2025, 5, 24, 18, 45).toISOString()
  },
  {
    id: '4',
    name: 'Larissa Alencar',
    location: 'Recife - PE',
    rating: 'ruim',
    stars: 2,
    comment: 'Demorou muito para conseguir estacionar e o sinal de celular no local estava péssimo para mandar mensagens.',
    createdAt: new Date(2025, 5, 25, 1, 10).toISOString()
  }
];

export default function App() {
  // Feedbacks states
  const [feedbacks, setFeedbacks] = useState<SimpleFeedback[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Public Form States
  const [name, setName] = useState('');
  const [location, setLocation] = useState('Petrolina - PE');
  const [rating, setRating] = useState<'bom' | 'regular' | 'ruim'>('bom');
  const [stars, setStars] = useState<number>(5);
  const [comment, setComment] = useState('');
  
  // Feedback Success Status
  const [successMsg, setSuccessMsg] = useState(false);

  // Password Wall states
  const [password, setPassword] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');

  // Active Screen: 'avaliar' (Public evaluation), 'analisar' (Private analyzer locking)
  const [screen, setScreen] = useState<'avaliar' | 'analisar'>('avaliar');

  // Custom Confirmation Dialogue and Toast States for iFrame support
  const [feedbackToDelete, setFeedbackToDelete] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; error?: boolean } | null>(null);

  const showToast = (text: string, isError = false) => {
    setToastMessage({ text, error: isError });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Real-time listener for Firestore feedbacks collection
  useEffect(() => {
    setIsLoading(true);
    const q = query(collection(db, 'feedbacks'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: SimpleFeedback[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        list.push({
          id: docSnap.id,
          name: data.name || 'Anônimo',
          location: data.location || 'Petrolina - PE',
          rating: data.rating || 'bom',
          stars: typeof data.stars === 'number' ? data.stars : 5,
          comment: data.comment || '',
          createdAt: data.createdAt || new Date().toISOString(),
        } as SimpleFeedback);
      });
      
      setFeedbacks(list);
      setIsLoading(false);
    }, (error) => {
      showToast('Erro de permissão ou conexão ao ler feedbacks da nuvem!', true);
      handleFirestoreError(error, OperationType.LIST, 'feedbacks');
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Form Handling
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !comment.trim()) return;

    const feedbackId = 'fb-' + Date.now();
    const newFeedback: SimpleFeedback = {
      id: feedbackId,
      name: name.trim(),
      location: location.trim() || 'Petrolina - PE',
      rating,
      stars,
      comment: comment.trim(),
      createdAt: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, 'feedbacks', feedbackId), newFeedback);
      
      // Clear inputs
      setName('');
      setComment('');
      setRating('bom');
      setStars(5);
      
      // Trigger Success Indicator
      setSuccessMsg(true);
      showToast('Avaliação salva com sucesso!');
      setTimeout(() => {
        setSuccessMsg(false);
      }, 5000);
    } catch (error) {
      showToast('Erro ao salvar avaliação. Verifique a regras de segurança ou conexão!', true);
      handleFirestoreError(error, OperationType.WRITE, `feedbacks/${feedbackId}`);
    }
  };

  // Trigger custom confirmation dialog for deletion
  const promptDeleteFeedback = (id: string) => {
    setFeedbackToDelete(id);
  };

  // Confirm delete feedback
  const confirmDeleteFeedback = async () => {
    if (!feedbackToDelete) return;
    try {
      await deleteDoc(doc(db, 'feedbacks', feedbackToDelete));
      setFeedbackToDelete(null);
      showToast('Avaliação excluída com sucesso da nuvem!');
    } catch (error) {
      showToast('Erro ao excluir avaliação da nuvem!', true);
      handleFirestoreError(error, OperationType.DELETE, `feedbacks/${feedbackToDelete}`);
      setFeedbackToDelete(null);
    }
  };

  // Trigger custom reset confirmation dialog
  const promptResetData = () => {
    setShowResetConfirm(true);
  };

  // Confirm reset to original default feedbacks
  const confirmResetData = async () => {
    setShowResetConfirm(false);
    try {
      for (const fb of DEFAULT_FEEDBACKS) {
        await setDoc(doc(db, 'feedbacks', fb.id), fb);
      }
      showToast('Avaliações originais restauradas na nuvem!');
    } catch (error) {
      showToast('Erro ao restaurar as avaliações no banco de dados!', true);
      handleFirestoreError(error, OperationType.WRITE, 'feedbacks_reset');
    }
  };

  // Authenticate Admin Tab
  const handleVerifyPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === '265202') {
      setIsUnlocked(true);
      setAuthError('');
    } else {
      setAuthError('Senha incorreta! Tente novamente.');
      setIsUnlocked(false);
      // Auto shake feedback
      setTimeout(() => setAuthError(''), 3000);
    }
  };

  // Check stats dynamically
  const stats = useMemo(() => {
    const total = feedbacks.length;
    if (total === 0) return { total: 0, bomPercent: 0, regularPercent: 0, ruimPercent: 0, avgStars: 0 };
    
    const bomCount = feedbacks.filter(f => f.rating === 'bom').length;
    const regularCount = feedbacks.filter(f => f.rating === 'regular').length;
    const ruimCount = feedbacks.filter(f => f.rating === 'ruim').length;
    
    const totalStars = feedbacks.reduce((acc, current) => acc + current.stars, 0);

    return {
      total,
      bomPercent: Math.round((bomCount / total) * 100),
      regularPercent: Math.round((regularCount / total) * 100),
      ruimPercent: Math.round((ruimCount / total) * 100),
      avgStars: Math.round((totalStars / total) * 10) / 10
    };
  }, [feedbacks]);

  return (
    <div className="min-h-screen bg-[#1F0E08] text-[#FAF4EC] flex flex-col items-center font-sans selection:bg-[#E67E22] selection:text-white">
      
      {/* Woodcut Traditional Bandeirinhas Border */}
      <div className="w-full flex justify-center overflow-hidden h-9 opacity-90 relative pointer-events-none select-none border-b-4 border-[#2D1309]">
        <div className="flex space-x-1.5 whitespace-nowrap min-w-max">
          {Array.from({ length: 50 }).map((_, i) => {
            const colors = [
              'bg-[#C0392B]', // Deep Rustic Red
              'bg-[#D35400]', // Bonfire Orange
              'bg-[#8E44AD]', // Woodcut Violet
              'bg-[#D35400]', // Clay Orange
              'bg-[#A04000]'  // Dark Brick Red
            ];
            const colorClass = colors[i % colors.length];
            return (
              <div 
                key={i} 
                className={`${colorClass} w-8 h-7 relative`}
                style={{
                  clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 50% 75%, 0% 100%)'
                }}
              />
            );
          })}
        </div>
      </div>

      {/* Styled Poster Header */}
      <header className="w-full max-w-4xl px-4 pt-10 pb-6 text-center flex flex-col items-center">
        {/* Visual Bonfire graphic */}
        <div className="w-20 h-20 mb-3 relative flex items-center justify-center">
          <div className="absolute inset-x-0 bottom-1 h-3 bg-[#4a1c0d] rounded-full filter blur-md opacity-70" />
          <svg viewBox="0 0 100 100" className="w-16 h-16 flame-animation">
            {/* Dark wood logs */}
            <path d="M 20 85 L 80 85" stroke="#311102" strokeWidth="9" strokeLinecap="round" />
            <path d="M 28 80 L 72 90" stroke="#120400" strokeWidth="9" strokeLinecap="round" />
            <path d="M 72 80 L 28 90" stroke="#1c0700" strokeWidth="9" strokeLinecap="round" />
            {/* High-quality styled fire */}
            <path d="M 32 83 C 32 60, 44 38, 50 15 C 56 38, 68 60, 68 83 Z" fill="#E67E22" />
            <path d="M 40 83 C 40 65, 46 48, 50 32 C 54 48, 60 65, 60 83 Z" fill="#D35400" />
            <path d="M 46 83 C 46 72, 48 58, 50 45 C 52 58, 54 72, 54 83 Z" fill="#C0392B" />
          </svg>
        </div>

        <span className="text-[#E67E22] font-mono text-xs tracking-widest uppercase font-extrabold border-2 border-[#E67E22]/30 px-4 py-1.5 rounded-md bg-[#E67E22]/5">
          🌵 OPINIÃO E SATISFAÇÃO • SERTÃO DE PERNAMBUCO 🌵
        </span>

        {/* Cordel Style Poster Heading */}
        <h1 className="mt-4 text-4xl md:text-5xl font-display font-extrabold text-[#FAF4EC] tracking-tight leading-none drop-shadow-xl">
          São João da Zona Leste 
        </h1>
        
        <p className="mt-3 text-sm md:text-base text-[#FAF4EC]/75 max-w-lg font-medium">
          Diga-nos o que achou dos shows, segurança, infraestrutura e acessibilidade! Suas respostas ajudam no monitoramento do evento.
        </p>

        {/* Tab Selection mimicking traditional wood engravings */}
        <div className="mt-8 flex justify-center w-full max-w-md border-4 border-[#2D1309] p-1.5 bg-[#25120B] rounded-lg shadow-2xl">
          <button
            onClick={() => setScreen('avaliar')}
            className={`flex-1 py-3 text-xs md:text-sm font-extrabold uppercase tracking-wide rounded-md transition-all duration-300 flex items-center justify-center gap-2 ${
              screen === 'avaliar'
                ? 'bg-[#E67E22] text-[#FAF4EC] shadow-inner border-b-2 border-orange-600'
                : 'text-[#FAF4EC]/60 hover:text-[#FAF4EC] hover:bg-white/5'
            }`}
          >
            🔥 Avaliar Satisfação
          </button>
          
          <button
            onClick={() => setScreen('analisar')}
            className={`flex-1 py-3 text-xs md:text-sm font-extrabold uppercase tracking-wide rounded-md transition-all duration-300 flex items-center justify-center gap-2 ${
              screen === 'analisar'
                ? 'bg-[#E67E22] text-[#FAF4EC] shadow-inner border-b-2 border-orange-600'
                : 'text-[#FAF4EC]/60 hover:text-[#FAF4EC] hover:bg-white/5'
            }`}
          >
            🔒 Analisar Respostas
          </button>
        </div>
      </header>

      {/* Main Container Area */}
      <main className="w-full max-w-4xl px-4 pb-24 relative z-20">
        
        {/* PUBLIC EVALUATION FORM SCREEN */}
        {screen === 'avaliar' && (
          <div className="max-w-xl mx-auto space-y-6">
            
            {successMsg && (
              <div id="evaluation-success" className="bg-[#FAF4EC] border-4 border-[#C0392B] p-4 text-[#1F0E08] rounded-md shadow-2xl flex items-start gap-3 transition-all">
                <div className="p-1 px-2.5 bg-[#C0392B] text-white font-bold rounded-full mt-1">✓</div>
                <div>
                  <h4 className="font-extrabold text-base text-[#C0392B]">Avaliação Salva na Nuvem!</h4>
                  <p className="text-xs text-[#1F0E08]/85 mt-1">
                    Sua resposta foi enviada com sucesso para o banco de dados em tempo real! Os organizadores agradecem sua opinião sincera.
                  </p>
                </div>
              </div>
            )}

            <form 
              onSubmit={handleSubmit}
              className="bg-[#FAF4EC] text-[#2D1309] p-7 rounded-lg border-4 border-[#2D1309] shadow-2xl space-y-5 relative overflow-hidden"
            >
              {/* Cordel style divider top */}
              <div className="absolute top-0 left-0 right-0 h-2 bg-[#E67E22]" />

              <h2 className="font-display font-extrabold text-xl text-[#1F0E08] border-b-2 border-[#2D1309] pb-3 flex items-center justify-between">
                  <span>📝 Deixe sua Opinião</span>
                  <span className="text-xs font-mono font-medium text-[#2D1309]/60">Petrolina-PE</span>
                </h2>

              <div className="space-y-4">
                
                {/* Field 1: Name */}
                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-[#2D1309]/80 mb-1">
                    Seu Nome / Apelido:
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="Ex: Maria das Dores, João Sanfoneiro"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-[#FAF4EC] border-2 border-[#2D1309] rounded-md pl-9 pr-3 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#E67E22]"
                    />
                    <User className="absolute left-3 top-3 w-4 h-4 text-[#2D1309]/50" />
                  </div>
                </div>

                {/* Field 3: General Sentiment Feedback */}
                <div className="bg-[#FCF9F5] p-4 rounded-lg border-2 border-[#2D1309]/50">
                  <span className="block text-xs font-extrabold uppercase tracking-wider text-[#2D1309]/80 mb-3 text-center">
                    No geral, como foi o São João de Petrolina?
                  </span>
                  
                  <div className="grid grid-cols-3 gap-3">
                    
                    {/* OPTION: RUIM */}
                    <button
                      type="button"
                      onClick={() => {
                        setRating('ruim');
                        setStars(2);
                      }}
                      className={`py-3 rounded-md flex flex-col items-center justify-center transition-all border-2 ${
                        rating === 'ruim'
                          ? 'bg-[#C0392B] text-white border-[#2D1309] scale-105 font-bold shadow-md'
                          : 'bg-white text-[#2D1309] border-[#2D1309]/30 hover:bg-slate-100'
                      }`}
                    >
                      <span className="text-3xl mb-1 mt-0.5">🙁</span>
                      <span className="text-xs uppercase font-extrabold">Ruim</span>
                    </button>

                    {/* OPTION: REGULAR */}
                    <button
                      type="button"
                      onClick={() => {
                        setRating('regular');
                        setStars(3);
                      }}
                      className={`py-3 rounded-md flex flex-col items-center justify-center transition-all border-2 ${
                        rating === 'regular'
                          ? 'bg-[#A04000] text-white border-[#2D1309] scale-105 font-bold shadow-md'
                          : 'bg-white text-[#2D1309] border-[#2D1309]/30 hover:bg-slate-100'
                      }`}
                    >
                      <span className="text-3xl mb-1 mt-0.5">😐</span>
                      <span className="text-xs uppercase font-extrabold">Regular</span>
                    </button>

                    {/* OPTION: BOM */}
                    <button
                      type="button"
                      onClick={() => {
                        setRating('bom');
                        setStars(5);
                      }}
                      className={`py-3 rounded-md flex flex-col items-center justify-center transition-all border-2 ${
                        rating === 'bom'
                          ? 'bg-[#D35400] text-white border-[#2D1309] scale-105 font-bold shadow-md'
                          : 'bg-white text-[#2D1309] border-[#2D1309]/30 hover:bg-slate-100'
                      }`}
                    >
                      <span className="text-3xl mb-1 mt-0.5">🤠</span>
                      <span className="text-xs uppercase font-extrabold">Bom!</span>
                    </button>

                  </div>
                </div>

                {/* Field 4: Optional Star Details (1-5) */}
                <div className="py-2.5 border-y border-[#2D1309]/15 flex flex-col items-center">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-[#2D1309]/70 mb-1.5">
                    Selecione de 1 a 5 Estrelas:
                  </span>
                  
                  <div className="flex gap-2.5">
                    {[1, 2, 3, 4, 5].map((starValue) => (
                      <button
                        type="button"
                        key={starValue}
                        onClick={() => setStars(starValue)}
                        className="transition-transform duration-100 hover:scale-125 focus:outline-none"
                      >
                        <Star 
                          className={`w-9 h-9 ${
                            starValue <= stars 
                              ? 'fill-[#D35400] text-[#D35400]' 
                              : 'text-[#2D1309]/20 fill-transparent'
                          }`} 
                        />
                      </button>
                    ))}
                  </div>
                  <span className="text-xs font-mono font-bold text-[#D35400] mt-1.5 uppercase">
                    Nota concedida: {stars} / 5 Estrelas
                  </span>
                </div>

                {/* Field 5: Detailed Comment box */}
                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-[#2D1309]/80 mb-1">
                    Deixe seu Comentário ou Crítica Construtiva:
                  </label>
                  <div className="relative">
                    <textarea
                      required
                      rows={4}
                      placeholder="Fale das filas, preços das comidas, policiamento local, segurança ou elogios aos shows de forró de Petrolina..."
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      className="w-full bg-[#FAF4EC] border-2 border-[#2D1309] rounded-md px-3 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#E67E22] font-sans leading-relaxed"
                    />
                  </div>
                </div>

              </div>

              {/* Submit button with fire aesthetic */}
              <button
                type="submit"
                className="w-full bg-[#D35400] hover:bg-[#C0392B] text-white font-display font-extrabold text-sm py-4 rounded-md border-2 border-[#2D1309] shadow-xl transition-all duration-200 cursor-pointer uppercase tracking-wider"
              >
                🔥 Enviar Avaliação do São João
              </button>

            </form>

            {/* Little Junino decorative quote banner */}
            <div className="p-4 bg-[#25120B] text-center rounded-md border-2 border-[#2D1309]/50 text-xs italic text-[#FAF4EC]/70">
              "Olha pro céu, meu amor, vê como ele está lindo! Olha praquele balão multicolor, que lá no céu vai subindo..."
            </div>

          </div>
        )}

        {/* PRIVATE COMMENTS ANALYSIS SCREEN (PASSWORD PROTECTED) */}
        {screen === 'analisar' && (
          <div className="space-y-6">
            
            {/* Password Verification Dialog */}
            {!isUnlocked ? (
              <div className="max-w-md mx-auto bg-[#FAF4EC] text-[#2D1309] p-6 rounded-lg border-4 border-[#2D1309] shadow-2xl relative">
                <div className="absolute top-0 left-0 right-0 h-2 bg-[#C0392B]" />

                <div className="text-center space-y-4">
                  <div className="mx-auto w-12 h-12 bg-red-100 text-[#C0392B] rounded-full flex items-center justify-center">
                    <Lock className="w-6 h-6" />
                  </div>

                  <div>
                    <h3 className="font-display font-extrabold text-lg text-[#1F0E08]">Área Restrita aos Organizadores</h3>
                    <p className="text-xs text-[#2D1309]/70 mt-1 leading-relaxed">
                      Esta aba compila os comentários particulares e as estatísticas de satisfação reais do evento. Insira a senha de acesso para liberar.
                    </p>
                  </div>

                  <form onSubmit={handleVerifyPassword} className="space-y-3 pt-2">
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        placeholder="Informe a identificação de acesso"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-[#FCF9F5] border-2 border-[#2D1309] rounded-md px-3 py-3 text-xs text-center focus:outline-none focus:ring-2 focus:ring-[#C0392B] tracking-widest font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-[#2D1309]/60 hover:text-[#2D1309]"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    {authError && (
                      <div className="text-[11px] font-bold text-[#C0392B] flex items-center justify-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>{authError}</span>
                      </div>
                    )}



                    <button
                      type="submit"
                      className="w-full bg-[#201009] hover:bg-[#C0392B] text-white py-2.5 px-4 rounded font-extrabold text-xs uppercase tracking-wider border-2 border-[#120703] shadow-md transition-all cursor-pointer"
                    >
                      🚀 Autenticar & Entrar
                    </button>
                  </form>
                </div>
              </div>
            ) : (
              /* UNLOCKED: SECURE ANALYTICS & RECOGNITION PANEL */
              <div className="space-y-6">
                
                {/* Header Action with option to re-lock */}
                <div className="flex flex-wrap justify-between items-center gap-3 bg-[#2D1309] p-4 rounded-lg border-2 border-[#2D1309]">
                  <div className="flex items-center gap-2">
                    <div className="p-1 px-2.5 bg-[#E67E22] text-white text-xs font-mono rounded font-bold uppercase">ADMIN</div>
                    <span className="text-xs font-semibold text-[#FAF4EC]/85">Painel Geral de Opiniões Liberado!</span>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={promptResetData}
                      className="px-3 py-1.5 bg-[#1F0E08] hover:bg-white/5 border border-[#FAF4EC]/20 rounded text-[11px] font-bold text-[#FAF4EC]/80 transition-all"
                    >
                      Restaurar Originais
                    </button>
                    <button
                      onClick={() => {
                        setIsUnlocked(false);
                        setPassword('');
                      }}
                      className="px-3 py-1.5 bg-[#C0392B] hover:bg-red-700 text-xs font-bold rounded text-white transition-all flex items-center gap-1"
                    >
                      <Lock className="w-3 h-3" /> Fechar Sessão
                    </button>
                  </div>
                </div>

                {/* Dashboard Metrics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  
                  {/* Gauge 1 */}
                  <div className="bg-[#FAF4EC] text-[#2D1309] p-4 rounded-lg border-2 border-[#2D1309] flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-slate-500 font-extrabold block">Amostragem</span>
                      <span className="text-3xl font-display font-black text-[#2D1309] mt-1 block">
                        {stats.total}
                      </span>
                    </div>
                    <span className="text-[10px] text-[#2D1309]/60 font-mono mt-1 pt-2 border-t border-[#2D1309]/10">Total de Opiniões Salvas</span>
                  </div>

                  {/* Gauge 2 */}
                  <div className="bg-[#FAF4EC] text-[#2D1309] p-4 rounded-lg border-2 border-[#2D1309] flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-slate-500 font-extrabold block">Média de Estrelas</span>
                      <div className="flex items-baseline gap-1 mt-1">
                        <span className="text-3xl font-display font-black text-[#2D1309]">{stats.avgStars}</span>
                        <span className="text-xs text-slate-400">/ 5.0</span>
                      </div>
                    </div>
                    <div className="flex gap-0.5 mt-1 pt-2 border-t border-[#2D1309]/10">
                      {Array.from({ length: 5 }).map((_, idx) => (
                        <Star 
                          key={idx} 
                          className={`w-3 h-3 ${
                            idx < Math.round(stats.avgStars) 
                              ? 'fill-[#D35400] text-[#D35400]' 
                              : 'text-slate-300'
                          }`} 
                        />
                      ))}
                    </div>
                  </div>

                  {/* Gauge 3 */}
                  <div className="bg-[#FAF4EC] text-[#2D1309] p-4 rounded-lg border-2 border-[#2D1309] flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-[#D35400] font-extrabold block">Aprovação (BOM)</span>
                      <span className="text-3xl font-display font-black text-[#D35400] mt-1 block">
                        {stats.bomPercent}%
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500 mt-1 pt-1.5 border-t border-[#2D1309]/10 flex items-center gap-1 font-semibold">
                      <TrendingUp className="w-3.5 h-3.5 text-[#D35400]" /> Forró Aprovado
                    </span>
                  </div>

                  {/* Gauge 4 */}
                  <div className="bg-[#FAF4EC] text-[#2D1309] p-4 rounded-lg border-2 border-[#2D1309] flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-slate-500 font-extrabold block">Reclamação (RUIM)</span>
                      <span className="text-3xl font-display font-black text-[#C0392B] mt-1 block">
                        {stats.ruimPercent}%
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500 mt-1 pt-1.5 border-t border-[#2D1309]/10 flex items-center gap-1 font-semibold">
                      <TrendingDown className="w-3.5 h-3.5 text-[#C0392B]" /> Necessitam de Ajuste
                    </span>
                  </div>

                </div>

                {/* Progress bar of opinions */}
                <div className="bg-[#FAF4EC] text-[#2D1309] p-5 rounded-lg border-2 border-[#2D1309]">
                  <h4 className="text-xs uppercase tracking-wider font-extrabold text-[#2D1309]/80 mb-3 text-center border-b pb-2">
                    📊 Distribuição percentual das Categorias
                  </h4>
                  <div className="space-y-4">
                    {/* Bom bar */}
                    <div>
                      <div className="flex justify-between items-center text-xs font-bold mb-1">
                        <span className="flex items-center gap-1">🤠 Aprovado / Bom</span>
                        <span>{stats.bomPercent}%</span>
                      </div>
                      <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden border border-[#2D1309]/20">
                        <div className="bg-[#D35400] h-full rounded-full transition-all" style={{ width: `${stats.bomPercent}%` }} />
                      </div>
                    </div>

                    {/* Regular bar */}
                    <div>
                      <div className="flex justify-between items-center text-xs font-bold mb-1">
                        <span className="flex items-center gap-1">😐 Neutro / Regular</span>
                        <span>{stats.regularPercent}%</span>
                      </div>
                      <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden border border-[#2D1309]/20">
                        <div className="bg-[#A04000] h-full rounded-full transition-all" style={{ width: `${stats.regularPercent}%` }} />
                      </div>
                    </div>

                    {/* Ruim bar */}
                    <div>
                      <div className="flex justify-between items-center text-xs font-bold mb-1">
                        <span className="flex items-center gap-1">🙁 Ruim / Críticas</span>
                        <span>{stats.ruimPercent}%</span>
                      </div>
                      <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden border border-[#2D1309]/20">
                        <div className="bg-[#C0392B] h-full rounded-full transition-all" style={{ width: `${stats.ruimPercent}%` }} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Comments Listing */}
                <div className="bg-[#FAF4EC] text-[#2D1309] p-6 rounded-lg border-4 border-[#2D1309] shadow-2xl">
                  <div className="border-b-2 border-dashed border-[#2D1309]/20 pb-3 mb-4 flex justify-between items-center">
                    <div>
                      <h3 className="font-display font-extrabold text-lg text-[#1F0E08] flex items-center gap-1">
                        <MessageSquare className="w-5 h-5 text-[#C0392B]" /> Testemunhos e Críticas Coletadas
                      </h3>
                      <p className="text-[11px] text-[#2D1309]/60 leading-tight">
                        Abaixo consta a totalidade das opiniões inseridas pelos usuários de forma anônima ou identificada.
                      </p>
                    </div>
                    <span className="text-xs font-mono font-bold bg-[#FAF4EC] border border-[#2D1309]/30 px-2 py-1 rounded">
                      Total: {feedbacks.length}
                    </span>
                  </div>

                  {feedbacks.length === 0 ? (
                    <div className="py-12 text-center text-slate-400 text-xs italic">
                      Não há feedbacks salvos no sistema.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {feedbacks.map((f) => {
                        // Sentiment badge styling
                        let sentimentStyle = 'bg-orange-100 text-[#D35400] border-[#D35400]/20';
                        let emoji = '🤠';
                        if (f.rating === 'regular') {
                          sentimentStyle = 'bg-amber-100 text-[#A04000] border-[#A04000]/20';
                          emoji = '😐';
                        } else if (f.rating === 'ruim') {
                          sentimentStyle = 'bg-red-50 text-[#C0392B] border-red-200';
                          emoji = '🙁';
                        }

                        // Local dynamic formatted date for display
                        const formattedDate = new Date(f.createdAt).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        });

                        return (
                          <div 
                            key={f.id}
                            className="bg-[#FCF9F5] border-2 border-[#2D1309] p-4 rounded-md relative shadow-sm hover:shadow-md transition-shadow"
                          >
                            <div className="flex flex-wrap justify-between items-start gap-2 mb-2 pb-2 border-b border-[#2D1309]/10">
                              <div className="flex items-center gap-2">
                                <span className="font-display font-extrabold text-[#2D1309] text-sm">
                                  {f.name}
                                </span>
                                <span className="text-[10px] text-slate-500 flex items-center gap-0.5">
                                  • {f.location}
                                </span>
                              </div>

                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                                  <Calendar className="w-3 h-3 text-[#2D1309]/70" /> {formattedDate}
                                </span>
                                <button
                                  onClick={() => promptDeleteFeedback(f.id)}
                                  className="p-1 text-red-700 hover:bg-red-50 border border-transparent hover:border-red-300 rounded transition-colors"
                                  title="Remover avaliação permanentemente"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {/* Comment */}
                            <p className="text-xs text-[#2D1309]/90 italic font-mono leading-relaxed bg-white/40 p-2.5 rounded border border-[#2D1309]/5 mb-3">
                              "{f.comment}"
                            </p>

                            {/* Technical visual star score indicator */}
                            <div className="flex flex-wrap items-center justify-between gap-2.5 text-xs">
                              <div className="flex items-center gap-1 bg-[#201009]/5 px-2.5 py-1 rounded border">
                                <span className="text-[10px] text-[#2D1309]/60 font-extrabold uppercase tracking-wide">AVALIAÇÃO:</span>
                                <span className="font-bold flex items-center gap-1">
                                  <span>{emoji}</span>
                                  <span className="uppercase text-[10px] tracking-wide">{f.rating}</span>
                                </span>
                              </div>

                              <div className="flex items-center gap-0.5">
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <Star 
                                    key={i} 
                                    className={`w-3.5 h-3.5 ${
                                      i < f.stars 
                                        ? 'fill-[#D35400] text-[#D35400]' 
                                        : 'text-slate-300 fill-transparent'
                                    }`} 
                                  />
                                ))}
                                <span className="text-[11px] font-mono font-bold text-slate-500 pl-1">({f.stars}/5)</span>
                              </div>
                            </div>

                          </div>
                        );
                      })}
                    </div>
                  )}

                </div>
              </div>
            )}

          </div>
        )}

      </main>

      {/* Styled Footer */}
      <footer className="w-full mt-auto bg-[#160905] border-t-4 border-[#2D1309] text-center py-8 px-4 text-xs text-[#FAF4EC]/60 relative">
        <div className="max-w-md mx-auto space-y-2">
          {/* Decorative cactus */}
          <span className="text-lg">🌵 🌾 🪗 🌾 🌵</span>
          <p className="font-mono text-[10px] tracking-widest text-[#E67E22] uppercase font-bold">
            Monitoramento de Opinião São João de Petrolina
          </p>
          <p className="text-[10px] leading-relaxed">
            Desenvolvido sob diretrizes de design rústico e tradicional do Nordeste brasileiro. Todas as respostas e opiniões são conectadas ao banco de dados Firestore em tempo real.
          </p>
        </div>
      </footer>

      {/* Custom Delete Confirmation Modal */}
      {feedbackToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-[#FAF4EC] text-[#2D1309] max-w-sm w-full p-6 rounded-lg border-4 border-[#C0392B] shadow-2xl relative">
            <div className="absolute top-0 left-0 right-0 h-2 bg-[#C0392B]" />
            <div className="text-center space-y-4">
              <div className="mx-auto w-12 h-12 bg-red-100 text-[#C0392B] rounded-full flex items-center justify-center animate-pulse">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-display font-extrabold text-lg text-[#1F0E08]">Deletar permanente?</h3>
                <p className="text-xs text-[#2D1309]/70 mt-1 leading-relaxed">
                  Tem certeza que deseja apagar esta resposta definitivamente do banco de dados na nuvem? Essa ação não pode ser desfeita.
                </p>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setFeedbackToDelete(null)}
                  className="flex-1 py-2 px-4 rounded text-xs font-bold bg-[#FAF4EC] hover:bg-slate-100 text-[#2D1309] border-2 border-[#2D1309]/30 transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDeleteFeedback}
                  className="flex-1 py-2.5 px-4 rounded text-xs font-bold bg-[#C0392B] hover:bg-red-700 text-white border-2 border-[#120703] shadow-md transition-all cursor-pointer"
                >
                  Sim, Deletar!
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom Reset Data Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-[#FAF4EC] text-[#2D1309] max-w-sm w-full p-6 rounded-lg border-4 border-[#2D1309] shadow-2xl relative">
            <div className="absolute top-0 left-0 right-0 h-2 bg-[#D35400]" />
            <div className="text-center space-y-4">
              <div className="mx-auto w-12 h-12 bg-orange-100 text-[#D35400] rounded-full flex items-center justify-center">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-display font-extrabold text-lg text-[#1F0E08]">Restaurar Originais?</h3>
                <p className="text-xs text-[#2D1309]/70 mt-1 leading-relaxed">
                  Deseja restaurar as avaliações padrão? Se houver outras opiniões na nuvem, elas não serão deletadas, mas as principais padrão serão reiniciadas de volta.
                </p>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="flex-1 py-2 px-4 rounded text-xs font-bold bg-[#FAF4EC] hover:bg-slate-100 text-[#2D1309] border-2 border-[#2D1309]/30 transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmResetData}
                  className="flex-1 py-2.5 px-4 rounded text-xs font-bold bg-[#D35400] hover:bg-[#C0392B] text-white border-2 border-[#120703] shadow-md transition-all cursor-pointer"
                >
                  Sim, Restaurar!
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom Toast Notification Popup */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 max-w-xs w-full bg-[#FAF4EC] border-4 border-[#2D1309] p-3 rounded-md shadow-2xl flex items-center gap-2.5 animate-bounce">
          <div className={`p-1.5 rounded-full text-white ${toastMessage.error ? 'bg-[#C0392B]' : 'bg-[#D35400]'}`}>
            {toastMessage.error ? <AlertCircle className="w-4 h-4" /> : <Check className="w-4 h-4" />}
          </div>
          <span className="text-xs font-extrabold text-[#2D1309]">{toastMessage.text}</span>
        </div>
      )}

    </div>
  );
}
