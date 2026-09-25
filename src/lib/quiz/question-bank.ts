export type QuizCategory =
  | "geopolitics"
  | "indian_history"
  | "business"
  | "sports"
  | "pop_culture";

export type QuizQuestion = {
  id: string;
  category: QuizCategory;
  question: string;
  options: [string, string, string, string];
  correctIndex: number;
};

export const QUIZ_CATEGORY_LABELS: Record<QuizCategory, string> = {
  geopolitics: "Geopolitics",
  indian_history: "Indian History",
  business: "Business & Markets",
  sports: "Sports",
  pop_culture: "Pop Culture",
};

export const QUIZ_QUESTION_BANK: QuizQuestion[] = [
  // Geopolitics
  {
    id: "geo-01",
    category: "geopolitics",
    question:
      "Which strait is the primary chokepoint for roughly one-fifth of global liquefied natural gas trade and connects the Persian Gulf to the Gulf of Oman?",
    options: ["Bab el-Mandeb", "Strait of Hormuz", "Malacca Strait", "Bosporus"],
    correctIndex: 1,
  },
  {
    id: "geo-02",
    category: "geopolitics",
    question:
      "The 'Brussels Effect' in international relations most closely refers to:",
    options: [
      "NATO expansion into Eastern Europe",
      "EU regulatory standards becoming global norms",
      "Eurozone fiscal transfers to periphery states",
      "UN peacekeeping mandates led by Belgium",
    ],
    correctIndex: 1,
  },
  {
    id: "geo-03",
    category: "geopolitics",
    question:
      "Which country is NOT a member of the QUAD (Quadrilateral Security Dialogue)?",
    options: ["Japan", "Australia", "India", "South Korea"],
    correctIndex: 3,
  },
  {
    id: "geo-04",
    category: "geopolitics",
    question:
      "The Montreux Convention (1936) governs naval passage through which waterway?",
    options: ["Panama Canal", "Turkish Straits", "Suez Canal", "Strait of Gibraltar"],
    correctIndex: 1,
  },
  {
    id: "geo-05",
    category: "geopolitics",
    question:
      "Which African bloc launched the African Continental Free Trade Area (AfCFTA), the largest free trade area by number of countries?",
    options: ["ECOWAS", "SADC", "AU", "Arab League"],
    correctIndex: 2,
  },
  {
    id: "geo-06",
    category: "geopolitics",
    question:
      "The 'Thucydides Trap' concept, popularised by Graham Allison, describes tension between:",
    options: [
      "A rising power and an established dominant power",
      "Land powers and sea powers in Europe",
      "Authoritarian and democratic blocs",
      "Resource exporters and importers",
    ],
    correctIndex: 0,
  },
  {
    id: "geo-07",
    category: "geopolitics",
    question:
      "Which nation hosts the headquarters of the Shanghai Cooperation Organisation (SCO)?",
    options: ["China", "Russia", "Kazakhstan", "India"],
    correctIndex: 0,
  },
  {
    id: "geo-08",
    category: "geopolitics",
    question:
      "The BRI (Belt and Road Initiative) flagship port in Sri Lanka that raised debt-sustainability debates is:",
    options: ["Colombo", "Hambantota", "Trincomalee", "Galle"],
    correctIndex: 1,
  },
  // Indian History
  {
    id: "ih-01",
    category: "indian_history",
    question:
      "The 'Drain of Wealth' theory criticising colonial economic policy was most prominently articulated by:",
    options: ["B.R. Ambedkar", "Dadabhai Naoroji", "Gopal Krishna Gokhale", "Subhas Chandra Bose"],
    correctIndex: 1,
  },
  {
    id: "ih-02",
    category: "indian_history",
    question:
      "Which Mughal emperor's reign saw the compilation of the 'Ain-i-Akbari' as part of the Akbarnama project?",
    options: ["Akbar", "Aurangzeb", "Jahangir", "Shah Jahan"],
    correctIndex: 0,
  },
  {
    id: "ih-03",
    category: "indian_history",
    question:
      "The Gandhi-Irwin Pact (1931) led to the suspension of which major movement?",
    options: ["Non-Cooperation", "Civil Disobedience", "Quit India", "Khilafat"],
    correctIndex: 1,
  },
  {
    id: "ih-04",
    category: "indian_history",
    question:
      "The Battle of Plassey (1757) is considered pivotal because it established:",
    options: [
      "Direct Crown rule in India",
      "British political supremacy in Bengal via the EIC",
      "Maratha dominance over the Deccan",
      "Permanent Zamindari settlement",
    ],
    correctIndex: 1,
  },
  {
    id: "ih-05",
    category: "indian_history",
    question:
      "Who presided over the Karachi Session (1931) where fundamental rights and economic programme were discussed?",
    options: ["Jawaharlal Nehru", "Sardar Patel", "Rajendra Prasad", "Maulana Azad"],
    correctIndex: 1,
  },
  {
    id: "ih-06",
    category: "indian_history",
    question:
      "The Satavahana dynasty is historically associated with patronage of which religion in the Deccan?",
    options: ["Jainism only", "Buddhism and Hinduism", "Zoroastrianism", "Christianity"],
    correctIndex: 1,
  },
  {
    id: "ih-07",
    category: "indian_history",
    question:
      "The Rowlatt Act (1919) was opposed nationwide and led directly to the Jallianwala Bagh massacre in:",
    options: ["Lahore", "Amritsar", "Delhi", "Kanpur"],
    correctIndex: 1,
  },
  {
    id: "ih-08",
    category: "indian_history",
    question:
      "The Cabinet Mission Plan (1946) proposed India as a union comprising:",
    options: [
      "Two dominions only",
      "A weak centre with grouping of provinces",
      "A fully unitary state",
      "Three independent nations",
    ],
    correctIndex: 1,
  },
  // Business
  {
    id: "biz-01",
    category: "business",
    question:
      "In Porter's Five Forces, 'bargaining power of suppliers' is HIGH when:",
    options: [
      "Many substitute products exist",
      "Suppliers are fragmented and commoditised",
      "Switching costs for buyers are low",
      "Suppliers are concentrated and inputs are differentiated",
    ],
    correctIndex: 3,
  },
  {
    id: "biz-02",
    category: "business",
    question:
      "A company's 'economic moat' in investing terminology refers to:",
    options: [
      "High debt capacity",
      "Sustainable competitive advantage protecting profits",
      "Government subsidies only",
      "Temporary marketing buzz",
    ],
    correctIndex: 1,
  },
  {
    id: "biz-03",
    category: "business",
    question:
      "The 'Laffer Curve' illustrates the relationship between:",
    options: [
      "Inflation and unemployment",
      "Tax rates and tax revenue",
      "Interest rates and investment",
      "GDP and money supply",
    ],
    correctIndex: 1,
  },
  {
    id: "biz-04",
    category: "business",
    question:
      "In a DuPont analysis, ROE is decomposed into net margin, asset turnover, and:",
    options: ["Current ratio", "Financial leverage", "Quick ratio", "Dividend yield"],
    correctIndex: 1,
  },
  {
    id: "biz-05",
    category: "business",
    question:
      "Which RBI tool directly targets the amount of liquidity in the banking system overnight?",
    options: ["CRR only", "Repo / Reverse Repo operations", "Priority sector lending", "FEMA notifications"],
    correctIndex: 1,
  },
  {
    id: "biz-06",
    category: "business",
    question:
      "The 'innovator's dilemma' (Christensen) argues incumbents fail because they:",
    options: [
      "Ignore disruptive low-end or new-market innovations",
      "Over-invest in R&D always",
      "Focus too much on customers",
      "Have too little market share",
    ],
    correctIndex: 0,
  },
  {
    id: "biz-07",
    category: "business",
    question:
      "A 'bear steepener' in bond markets typically means:",
    options: [
      "Long-term yields rise more than short-term yields",
      "Short-term yields rise more than long-term yields",
      "All yields fall equally",
      "Credit spreads tighten sharply",
    ],
    correctIndex: 0,
  },
  {
    id: "biz-08",
    category: "business",
    question:
      "In marketing, the 'jobs to be done' framework focuses on:",
    options: [
      "Demographic segmentation only",
      "The progress a customer seeks in a circumstance",
      "Cost-plus pricing mechanics",
      "Shelf placement in retail",
    ],
    correctIndex: 1,
  },
  // Sports
  {
    id: "spo-01",
    category: "sports",
    question:
      "Which country has won the most FIFA Men's World Cup titles?",
    options: ["Germany", "Italy", "Brazil", "Argentina"],
    correctIndex: 2,
  },
  {
    id: "spo-02",
    category: "sports",
    question:
      "In cricket, the 'Duckworth-Lewis-Stern' method is primarily used to:",
    options: [
      "Rate bowlers by economy",
      "Adjust targets in rain-affected limited-overs games",
      "Rank Test batsmen",
      "Calculate fielding efficiency",
    ],
    correctIndex: 1,
  },
  {
    id: "spo-03",
    category: "sports",
    question:
      "The Tour de France yellow jersey (maillot jaune) is worn by:",
    options: [
      "Best climber",
      "Overall race leader on general classification",
      "Best young rider",
      "Most aggressive rider",
    ],
    correctIndex: 1,
  },
  {
    id: "spo-04",
    category: "sports",
    question:
      "Which tennis Grand Slam is played on clay courts?",
    options: ["Wimbledon", "US Open", "Australian Open", "French Open"],
    correctIndex: 3,
  },
  {
    id: "spo-05",
    category: "sports",
    question:
      "The 'Fosbury Flop' revolutionised which Olympic event?",
    options: ["Pole vault", "High jump", "Long jump", "Triple jump"],
    correctIndex: 1,
  },
  {
    id: "spo-06",
    category: "sports",
    question:
      "In Formula 1, a 'DRS' zone allows drivers to:",
    options: [
      "Pit without speed limit",
      "Open rear wing to reduce drag when within 1 second of car ahead",
      "Use extra engine power for lap",
      "Skip mandatory tyre change",
    ],
    correctIndex: 1,
  },
  {
    id: "spo-07",
    category: "sports",
    question:
      "Which Indian shooter won India's first individual Olympic gold (Beijing 2008)?",
    options: ["Gagan Narang", "Abhinav Bindra", "Manu Bhaker", "Rajyavardhan Rathore"],
    correctIndex: 1,
  },
  {
    id: "spo-08",
    category: "sports",
    question:
      "The NBA 'Larry O'Brien Trophy' is awarded to:",
    options: [
      "Regular season MVP",
      "Finals champion team",
      "All-Star Game winner",
      "Draft lottery winner",
    ],
    correctIndex: 1,
  },
  // Pop Culture
  {
    id: "pop-01",
    category: "pop_culture",
    question:
      "Which film holds the record for most Oscars won in a single night (11 awards, tied)?",
    options: ["Titanic", "The Lord of the Rings: The Return of the King", "Ben-Hur", "All of these tied at 11"],
    correctIndex: 3,
  },
  {
    id: "pop-02",
    category: "pop_culture",
    question:
      "The character 'Eleven' appears in which Netflix series?",
    options: ["Dark", "Stranger Things", "The Crown", "Squid Game"],
    correctIndex: 1,
  },
  {
    id: "pop-03",
    category: "pop_culture",
    question:
      "BTS, the K-pop group, announced a hiatus for members to pursue solo work in:",
    options: ["2019", "2020", "2022", "2024"],
    correctIndex: 2,
  },
  {
    id: "pop-04",
    category: "pop_culture",
    question:
      "Which author created the wizarding world of Hogwarts?",
    options: ["J.R.R. Tolkien", "J.K. Rowling", "C.S. Lewis", "George R.R. Martin"],
    correctIndex: 1,
  },
  {
    id: "pop-05",
    category: "pop_culture",
    question:
      "The Met Gala primarily benefits which New York institution?",
    options: [
      "MoMA",
      "Metropolitan Museum of Art's Costume Institute",
      "Guggenheim",
      "Whitney Museum",
    ],
    correctIndex: 1,
  },
  {
    id: "pop-06",
    category: "pop_culture",
    question:
      "Which streaming platform originally produced 'The Mandalorian'?",
    options: ["Netflix", "Disney+", "Amazon Prime", "HBO Max"],
    correctIndex: 1,
  },
  {
    id: "pop-07",
    category: "pop_culture",
    question:
      "The viral 'Renegade' dance on TikTok was created by:",
    options: ["Charli D'Amelio", "Jalaiah Harmon", "Addison Rae", "Dixie D'Amelio"],
    correctIndex: 1,
  },
  {
    id: "pop-08",
    category: "pop_culture",
    question:
      "Which Indian film was India's official Oscar entry and won Golden Globe for 'Naatu Naatu' (2023)?",
    options: ["Gangubai Kathiawadi", "RRR", "The Kashmir Files", "Chhello Show"],
    correctIndex: 1,
  },
];

const CATEGORIES: QuizCategory[] = [
  "geopolitics",
  "indian_history",
  "business",
  "sports",
  "pop_culture",
];

export function pickDailyQuizQuestions(dateStr: string): QuizQuestion[] {
  const seed = dateStr.split("").reduce((a, c) => Math.imul(31, a) + c.charCodeAt(0), 0);
  const rand = (() => {
    let s = seed;
    return () => {
      s += 0x6d2b79f5;
      let t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  })();

  const picked: QuizQuestion[] = [];
  for (const cat of CATEGORIES) {
    const pool = QUIZ_QUESTION_BANK.filter((q) => q.category === cat);
    const offset = Math.floor(rand() * pool.length);
    const idx = (Math.floor(rand() * 1000) + offset) % pool.length;
    picked.push(pool[idx]);
  }
  return picked;
}

export type StoredQuizQuestion = QuizQuestion;

export type PublicQuizQuestion = {
  id: string;
  category: QuizCategory;
  categoryLabel: string;
  question: string;
  options: [string, string, string, string];
};

export function toPublicQuestion(q: QuizQuestion): PublicQuizQuestion {
  return {
    id: q.id,
    category: q.category,
    categoryLabel: QUIZ_CATEGORY_LABELS[q.category],
    question: q.question,
    options: q.options,
  };
}

export function quizDailyScore(correctCount: number, durationMs: number, total = 5) {
  const perCorrect = 800;
  const speedBonus = Math.max(0, 1200 - Math.floor(durationMs / 1000) * 8);
  const perfectBonus = correctCount === total ? 600 : 0;
  return correctCount * perCorrect + speedBonus + perfectBonus;
}
