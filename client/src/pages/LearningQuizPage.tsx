import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { QuizQuestion } from '../types';
import { 
  Award, 
  BookOpen, 
  CheckCircle, 
  XCircle, 
  RotateCcw, 
  Compass, 
  Sprout, 
  Check,
  Sparkles
} from 'lucide-react';

export const LearningQuizPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'learn' | 'quiz'>('learn');

  // Quiz state
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [userScore, setUserScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);

  // Learning Sections: AYUSH Systems, Plant Identification, Plant Uses, Plant Care, Vastu Concepts
  const [learnSection, setLearnSection] = useState<'systems' | 'identification' | 'uses' | 'care' | 'vastu'>('systems');

  useEffect(() => {
    async function loadQuizData() {
      try {
        const res = await api.getQuizQuestions();
        setQuestions(res.questions || []);
      } catch (err) {
        console.warn('Error loading quiz:', err);
      }
    }
    loadQuizData();
  }, []);

  const currentQ = questions[currentIndex];

  const handleSelectOption = (idx: number) => {
    if (isAnswerSubmitted) return;
    setSelectedOption(idx);
  };

  const handleSubmitAnswer = () => {
    if (selectedOption === null || isAnswerSubmitted) return;
    setIsAnswerSubmitted(true);

    if (selectedOption === currentQ.correctAnswerIndex) {
      setUserScore((prev) => prev + 1);
    }
  };

  const handleNextQuestion = async () => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setIsAnswerSubmitted(false);
    } else {
      setQuizFinished(true);
      const finalScore = selectedOption === currentQ.correctAnswerIndex ? userScore + 1 : userScore;
      
      confetti({
        particleCount: 100,
        spread: 60,
        origin: { y: 0.6 }
      });

      if (user) {
        try {
          await api.submitQuizResult({
            score: finalScore,
            totalQuestions: questions.length,
            answers: []
          });
        } catch {}
      }
    }
  };

  const handleRestartQuiz = () => {
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsAnswerSubmitted(false);
    setUserScore(0);
    setQuizFinished(false);
  };

  const learningSections = [
    { id: 'systems', label: 'AYUSH Systems' },
    { id: 'identification', label: 'Plant Identification' },
    { id: 'uses', label: 'Plant Uses' },
    { id: 'care', label: 'Plant Care' },
    { id: 'vastu', label: 'Vastu Concepts' },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10 animate-fadeIn text-[#0F172A]">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E2E8F0] pb-6">
        <div>
          <span className="text-[10px] font-bold tracking-[0.2em] text-[#2563EB] uppercase block">
            KNOWLEDGE & ACADEMY
          </span>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-[#0F172A] mt-0.5">
            Botanical Learning & Quiz
          </h1>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-[#F1F5F9] p-1 rounded-full border border-[#E2E8F0] text-xs font-bold self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('learn')}
            className={`py-2 px-5 rounded-full transition duration-200 flex items-center gap-1.5 ${
              activeTab === 'learn'
                ? 'bg-[#2563EB] text-white shadow-xs'
                : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            Learning Interface
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('quiz')}
            className={`py-2 px-5 rounded-full transition duration-200 flex items-center gap-1.5 ${
              activeTab === 'quiz'
                ? 'bg-[#2563EB] text-white shadow-xs'
                : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            Gamified Quiz
          </button>
        </div>
      </div>

      {activeTab === 'learn' ? (
        /* IMMERSIVE LEARNING INTERFACE: AYUSH Systems, Plant Identification, Plant Uses, Plant Care, Vastu Concepts */
        <div className="space-y-8">
          {/* Editorial Section Navigation Pills */}
          <div className="flex flex-wrap gap-2">
            {learningSections.map((sec) => (
              <button
                key={sec.id}
                type="button"
                onClick={() => setLearnSection(sec.id as any)}
                className={`py-2.5 px-5 rounded-full text-xs font-semibold tracking-wide transition duration-200 ${
                  learnSection === sec.id
                    ? 'bg-[#2563EB] text-white shadow-xs'
                    : 'bg-white text-[#64748B] hover:text-[#2563EB] hover:bg-[#F8FAFC] border border-[#E2E8F0]'
                }`}
              >
                {sec.label}
              </button>
            ))}
          </div>

          {/* Large Editorial Card with Illustrations */}
          <div className="bg-white rounded-[2.5rem] p-8 sm:p-12 border border-[#E2E8F0] space-y-8 shadow-sm">
            {learnSection === 'systems' && (
              <div className="space-y-6">
                <span className="bg-[#2563EB]/10 text-[#2563EB] border border-[#2563EB]/20 text-[10px] font-bold tracking-[0.2em] px-3.5 py-1 rounded-full uppercase">
                  MEDICAL TRADITIONS
                </span>
                <h2 className="text-3xl font-serif font-bold text-[#0F172A]">
                  AYUSH Systems of Classical Healing
                </h2>
                <p className="text-sm text-[#64748B] leading-relaxed max-w-2xl">
                  AYUSH encompasses India's indigenous medical systems: Ayurveda, Yoga & Naturopathy, Unani, Siddha, and Homeopathy. These philosophies prioritize preventive wellness through botanical harmony.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 text-xs">
                  <div className="p-5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1">
                    <strong className="text-base font-serif text-[#0F172A] block">Ayurveda (Longevity Science)</strong>
                    <p className="text-[#64748B]">Focuses on tridoshic equilibrium (Vata, Pitta, Kapha) and rejuvenating Rasayana botanicals like Ashwagandha and Tulsi.</p>
                  </div>
                  <div className="p-5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1">
                    <strong className="text-base font-serif text-[#0F172A] block">Siddha (Dravidian Alchemy)</strong>
                    <p className="text-[#64748B]">Rooted in southern Indian tradition, employing Kaya Kalpa therapies and herbs like Bhringraj to maintain cellular vitality.</p>
                  </div>
                  <div className="p-5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1">
                    <strong className="text-base font-serif text-[#0F172A] block">Unani (Tibbi Medicine)</strong>
                    <p className="text-[#64748B]">Derived from Greco-Arabic principles balancing bodily humors through warming circulatory botanicals like Lemongrass.</p>
                  </div>
                  <div className="p-5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1">
                    <strong className="text-base font-serif text-[#0F172A] block">Yoga & Naturopathy</strong>
                    <p className="text-[#64748B]">Harnesses the five elements (Pancha Mahabhutas) alongside living oxygen-producing plants like Aloe Vera.</p>
                  </div>
                </div>
              </div>
            )}

            {learnSection === 'identification' && (
              <div className="space-y-6">
                <span className="bg-[#2563EB]/10 text-[#2563EB] border border-[#2563EB]/20 text-[10px] font-bold tracking-[0.2em] px-3.5 py-1 rounded-full uppercase">
                  MORPHOLOGICAL CLUES
                </span>
                <h2 className="text-3xl font-serif font-bold text-[#0F172A]">
                  Plant Identification & Characteristics
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div className="p-5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2">
                    <strong className="text-sm font-serif text-[#0F172A] block">Square Stems (Lamiaceae)</strong>
                    <p className="text-[#64748B]">Tulsi and Mint are characterized by distinct four-sided square stems and opposite aromatic leaf pairs.</p>
                  </div>
                  <div className="p-5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2">
                    <strong className="text-sm font-serif text-[#0F172A] block">Succulent Rosettes</strong>
                    <p className="text-[#64748B]">Aloe Vera displays thick lanceolate leaves with serrated margins filled with clear soothing inner mucilage.</p>
                  </div>
                  <div className="p-5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2">
                    <strong className="text-sm font-serif text-[#0F172A] block">Heart-Shaped Climbers</strong>
                    <p className="text-[#64748B]">Giloy (Tinospora cordifolia) features delicate cordate leaves along grooved twining aerial stems.</p>
                  </div>
                </div>
              </div>
            )}

            {learnSection === 'uses' && (
              <div className="space-y-6">
                <span className="bg-[#2563EB]/10 text-[#2563EB] border border-[#2563EB]/20 text-[10px] font-bold tracking-[0.2em] px-3.5 py-1 rounded-full uppercase">
                  TRADITIONAL APOTHECARY
                </span>
                <h2 className="text-3xl font-serif font-bold text-[#0F172A]">
                  Traditional Preparation Arts
                </h2>
                <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed">
                  Classical AYUSH methods for releasing botanical therapeutic essences:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0]">
                    <strong className="text-sm font-serif text-[#0F172A] block">Kwath / Kashaya</strong>
                    <p className="text-[#64748B] mt-1">Boiled decoctions from woody bark, rhizomes, or tough roots reduced to concentrated tea.</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0]">
                    <strong className="text-sm font-serif text-[#0F172A] block">Swarasa</strong>
                    <p className="text-[#64748B] mt-1">Freshly pressed raw juice from leaves, strained through clean muslin cloth.</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0]">
                    <strong className="text-sm font-serif text-[#0F172A] block">Hima (Cold Infusion)</strong>
                    <p className="text-[#64748B] mt-1">Aromatic delicate flowers steeped overnight in fresh water for cooling Pitta relief.</p>
                  </div>
                </div>
              </div>
            )}

            {learnSection === 'care' && (
              <div className="space-y-6">
                <span className="bg-[#2563EB]/10 text-[#2563EB] border border-[#2563EB]/20 text-[10px] font-bold tracking-[0.2em] px-3.5 py-1 rounded-full uppercase">
                  CULTIVATION ETHICS
                </span>
                <h2 className="text-3xl font-serif font-bold text-[#0F172A]">
                  Plant Care & Gardening Discipline
                </h2>
                <div className="space-y-2.5 text-xs text-[#64748B]">
                  <p>• <strong>Morning Sunlight:</strong> Place plants where they receive morning photon rays to produce aromatic terpenes.</p>
                  <p>• <strong>Drainage Discipline:</strong> Ensure container pots have free-draining gravel or perlite bases.</p>
                  <p>• <strong>Gentle Pruning:</strong> Deadhead spent blossoms to encourage fresh foliage shoots.</p>
                </div>
              </div>
            )}

            {learnSection === 'vastu' && (
              <div className="space-y-6">
                <span className="bg-[#2563EB]/10 text-[#2563EB] border border-[#2563EB]/20 text-[10px] font-bold tracking-[0.2em] px-3.5 py-1 rounded-full uppercase">
                  SPATIAL HARMONY
                </span>
                <h2 className="text-3xl font-serif font-bold text-[#0F172A]">
                  Vastu Concepts & Spatial Aesthetics
                </h2>
                <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed">
                  How traditional Indian architectural geometry arranges home flora according to sunlight and ventilation flows:
                </p>
                <div className="p-5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs space-y-2 text-[#0F172A]">
                  <p>• <strong>North-East (Ishanya):</strong> Associated with water and clarity. Ideal for light sacred herbs like Tulsi and Brahmi.</p>
                  <p>• <strong>East (Surya):</strong> Receives invigorating sunrise. Harmonizes rejuvenating health tonics like Amla.</p>
                  <p>• <strong>South-East (Agni):</strong> Connected to the fire element. Suits warming spices like Ginger and Cinnamon.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* GAMIFIED QUIZ INTERFACE: Question 4 / 10, Progress Bar, Question, Answer cards, Summary */
        <div className="max-w-2xl mx-auto space-y-6">
          {!quizFinished && currentQ ? (
            <div className="bg-white rounded-[2.5rem] p-8 sm:p-10 border border-[#E2E8F0] space-y-6 shadow-sm">
              {/* Question Header: “Question 4 / 10” + Progress bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-mono text-[#64748B]">
                  <span className="font-bold text-[#0F172A]">
                    Question {currentIndex + 1} / {questions.length}
                  </span>
                  <span>Score: {userScore}</span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-1.5 rounded-full bg-[#E2E8F0] overflow-hidden">
                  <div
                    className="h-full bg-[#2563EB] rounded-full transition-all duration-300"
                    style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
                  />
                </div>
              </div>

              {/* Question Text */}
              <div className="space-y-2 pt-2">
                <span className="bg-[#2563EB]/10 text-[#2563EB] border border-[#2563EB]/20 text-[9px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full">
                  {currentQ.ayushCategory}
                </span>
                <h3 className="text-xl font-serif font-bold text-[#0F172A] leading-snug">
                  {currentQ.question}
                </h3>
              </div>

              {/* Plant Photo if plant-identification */}
              {currentQ.image && (
                <div className="h-52 rounded-2xl overflow-hidden border border-[#E2E8F0] bg-[#F1F5F9]">
                  <img
                    src={currentQ.image}
                    alt="Plant clue"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Answer Cards */}
              <div className="space-y-2.5 pt-2">
                {currentQ.options.map((opt, oIdx) => {
                  const isSelected = selectedOption === oIdx;
                  const isCorrect = oIdx === currentQ.correctAnswerIndex;

                  let cardStyle = 'border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] hover:border-[#CBD5E1] text-[#0F172A]';
                  if (isSelected && !isAnswerSubmitted) {
                    cardStyle = 'border-[#2563EB] bg-[#2563EB]/5 text-[#2563EB] ring-2 ring-[#2563EB] font-bold';
                  } else if (isAnswerSubmitted) {
                    if (isCorrect) {
                      cardStyle = 'border-[#22C55E] bg-[#22C55E]/10 text-[#0F172A] font-bold';
                    } else if (isSelected && !isCorrect) {
                      cardStyle = 'border-[#EF4444] bg-[#EF4444]/10 text-[#EF4444] font-bold';
                    }
                  }

                  return (
                    <button
                      key={oIdx}
                      type="button"
                      disabled={isAnswerSubmitted}
                      onClick={() => handleSelectOption(oIdx)}
                      className={`w-full p-4 rounded-2xl border text-left text-xs sm:text-sm transition flex items-center justify-between ${cardStyle}`}
                    >
                      <span>{opt}</span>
                      {isAnswerSubmitted && isCorrect && (
                        <CheckCircle className="w-4 h-4 text-[#22C55E] shrink-0" />
                      )}
                      {isAnswerSubmitted && isSelected && !isCorrect && (
                        <XCircle className="w-4 h-4 text-[#EF4444] shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Explanation Reveal */}
              {isAnswerSubmitted && (
                <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs text-[#0F172A] space-y-1 animate-fadeIn">
                  <strong className="text-[#0F172A] block font-bold">
                    {selectedOption === currentQ.correctAnswerIndex ? '✓ Correct!' : '✗ Explanation:'}
                  </strong>
                  <p className="leading-relaxed text-[#64748B]">{currentQ.explanation}</p>
                </div>
              )}

              {/* Next Button */}
              <div className="flex justify-end pt-2">
                {!isAnswerSubmitted ? (
                  <button
                    type="button"
                    disabled={selectedOption === null}
                    onClick={handleSubmitAnswer}
                    className="py-3 px-8 rounded-full bg-[#2563EB] hover:bg-[#1d4ed8] active:bg-[#1e40af] text-white text-xs font-bold tracking-wider transition duration-200 disabled:opacity-40"
                  >
                    Confirm Answer
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleNextQuestion}
                    className="py-3 px-8 rounded-full bg-[#F97316] hover:bg-[#ea580c] active:bg-[#c2410c] text-white text-xs font-bold tracking-wider transition duration-200 shadow-md shadow-[#F97316]/20 flex items-center gap-1.5"
                  >
                    {currentIndex + 1 < questions.length ? 'Next Question →' : 'View Results 🎉'}
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* After completion show: “Your Herbal Knowledge”, Score, Plants learned, Topics completed */
            <div className="bg-white rounded-[3rem] p-10 border border-[#E2E8F0] text-center space-y-6 shadow-sm animate-fadeIn">
              <span className="text-4xl block">🏆</span>
              <div className="space-y-1">
                <span className="text-[10px] font-bold tracking-[0.2em] text-[#2563EB] uppercase block">
                  CHALLENGE COMPLETE
                </span>
                <h3 className="text-3xl font-serif font-bold text-[#0F172A]">
                  Your Herbal Knowledge
                </h3>
              </div>

              {/* Score Metric Cards */}
              <div className="grid grid-cols-3 gap-3 max-w-md mx-auto pt-2 text-xs">
                <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0]">
                  <span className="text-[10px] text-[#64748B] uppercase font-bold block">Score</span>
                  <strong className="text-2xl font-serif text-[#2563EB] mt-1 block">
                    {userScore}/{questions.length}
                  </strong>
                </div>
                <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0]">
                  <span className="text-[10px] text-[#64748B] uppercase font-bold block">Plants Learned</span>
                  <strong className="text-2xl font-serif text-[#2563EB] mt-1 block">
                    {questions.length}
                  </strong>
                </div>
                <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0]">
                  <span className="text-[10px] text-[#64748B] uppercase font-bold block">Topics Completed</span>
                  <strong className="text-2xl font-serif text-[#2563EB] mt-1 block">
                    5
                  </strong>
                </div>
              </div>

              <div className="flex justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleRestartQuiz}
                  className="py-3 px-6 rounded-full bg-[#F97316] hover:bg-[#ea580c] active:bg-[#c2410c] text-white text-xs font-bold flex items-center gap-2 transition duration-200 shadow-sm"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Try Again</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('learn')}
                  className="py-3 px-6 rounded-full bg-white hover:bg-[#F8FAFC] border border-[#E2E8F0] text-[#0F172A] text-xs font-bold transition duration-200"
                >
                  Review Learning Cards
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
