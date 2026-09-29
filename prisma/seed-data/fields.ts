export interface FieldData {
  id: string;
  name: string;
  slug: string;
  category: string;
  scholarshipCount: number;
  description: string;
  popularDegrees: string[];
  careerPaths: string[];
  avgSalary: string;
}

export const seedFields: FieldData[] = [
  {
    id: "cs",
    name: "Computer Science",
    slug: "computer-science",
    category: "Technology",
    scholarshipCount: 42,
    description: "Study algorithms, software development, AI, data structures, and computational theory at world-leading institutions.",
    popularDegrees: ["BSc Computer Science", "MSc Computer Science", "PhD Computer Science", "MS in AI/ML"],
    careerPaths: ["Software Engineer", "Data Scientist", "AI Researcher", "Cloud Architect", "DevOps Engineer"],
    avgSalary: "$95,000 - $180,000"
  },
  {
    id: "ai",
    name: "Artificial Intelligence",
    slug: "artificial-intelligence",
    category: "Technology",
    scholarshipCount: 38,
    description: "Master machine learning, neural networks, natural language processing, computer vision, and robotics.",
    popularDegrees: ["MS Artificial Intelligence", "MS Machine Learning", "PhD AI", "MS Data Science"],
    careerPaths: ["ML Engineer", "AI Research Scientist", "Computer Vision Engineer", "NLP Specialist"],
    avgSalary: "$110,000 - $200,000"
  },
  {
    id: "ds",
    name: "Data Science",
    slug: "data-science",
    category: "Technology",
    scholarshipCount: 35,
    description: "Analyze complex data, build predictive models, and extract actionable insights using statistics and programming.",
    popularDegrees: ["MS Data Science", "MS Analytics", "MS Big Data", "PhD Data Science"],
    careerPaths: ["Data Scientist", "Data Analyst", "Business Intelligence Analyst", "Quantitative Analyst"],
    avgSalary: "$90,000 - $160,000"
  },
  {
    id: "eng",
    name: "Engineering",
    slug: "engineering",
    category: "STEM",
    scholarshipCount: 48,
    description: "Apply mathematics and science to design, build, and maintain structures, machines, systems, and processes.",
    popularDegrees: ["BEng Engineering", "MEng Engineering", "MS Engineering", "PhD Engineering"],
    careerPaths: ["Mechanical Engineer", "Civil Engineer", "Electrical Engineer", "Aerospace Engineer"],
    avgSalary: "$75,000 - $140,000"
  },
  {
    id: "ee",
    name: "Electrical Engineering",
    slug: "electrical-engineering",
    category: "STEM",
    scholarshipCount: 31,
    description: "Study electronics, electromagnetism, power systems, control systems, and telecommunications.",
    popularDegrees: ["BEng Electrical Engineering", "MS Electrical Engineering", "PhD EE"],
    careerPaths: ["Electrical Engineer", "Power Systems Engineer", "Electronics Design Engineer", "Controls Engineer"],
    avgSalary: "$80,000 - $145,000"
  },
  {
    id: "me",
    name: "Mechanical Engineering",
    slug: "mechanical-engineering",
    category: "STEM",
    scholarshipCount: 29,
    description: "Design, analyze, manufacture, and maintain mechanical systems using principles of motion, energy, and force.",
    popularDegrees: ["BEng Mechanical Engineering", "MS Mechanical Engineering", "PhD ME"],
    careerPaths: ["Mechanical Engineer", "Automotive Engineer", "Robotics Engineer", "HVAC Engineer"],
    avgSalary: "$75,000 - $135,000"
  },
  {
    id: "med",
    name: "Medicine",
    slug: "medicine",
    category: "Health Sciences",
    scholarshipCount: 34,
    description: "Train as a physician to diagnose, treat, and prevent human disease and promote health.",
    popularDegrees: ["MBBS", "MD", "DO", "PhD Medicine"],
    careerPaths: ["Medical Doctor", "Surgeon", "Physician", "Medical Researcher", "Specialist"],
    avgSalary: "$180,000 - $400,000+"
  },
  {
    id: "ph",
    name: "Public Health",
    slug: "public-health",
    category: "Health Sciences",
    scholarshipCount: 27,
    description: "Study disease prevention, health promotion, epidemiology, and healthcare policy to improve population health.",
    popularDegrees: ["MPH", "MSc Public Health", "DrPH", "PhD Public Health"],
    careerPaths: ["Epidemiologist", "Public Health Analyst", "Health Policy Advisor", "Global Health Specialist"],
    avgSalary: "$60,000 - $120,000"
  },
  {
    id: "bus",
    name: "Business Administration",
    slug: "business-administration",
    category: "Business",
    scholarshipCount: 40,
    description: "Learn management, marketing, finance, operations, strategy, and leadership to run organizations effectively.",
    popularDegrees: ["BBA", "MBA", "EMBA", "DBA"],
    careerPaths: ["Business Manager", "Consultant", "Entrepreneur", "Operations Manager", "Product Manager"],
    avgSalary: "$70,000 - $180,000"
  },
  {
    id: "fin",
    name: "Finance",
    slug: "finance",
    category: "Business",
    scholarshipCount: 32,
    description: "Master corporate finance, investment banking, financial analysis, portfolio management, and risk assessment.",
    popularDegrees: ["BSc Finance", "MS Finance", "MSc Financial Economics", "PhD Finance"],
    careerPaths: ["Financial Analyst", "Investment Banker", "Portfolio Manager", "Risk Manager", "Quantitative Analyst"],
    avgSalary: "$80,000 - $200,000+"
  },
  {
    id: "econ",
    name: "Economics",
    slug: "economics",
    category: "Social Sciences",
    scholarshipCount: 28,
    description: "Analyze how societies allocate scarce resources, study markets, trade, policy, and economic development.",
    popularDegrees: ["BA Economics", "MSc Economics", "MA Economics", "PhD Economics"],
    careerPaths: ["Economist", "Policy Analyst", "Economic Consultant", "Data Analyst", "Research Analyst"],
    avgSalary: "$70,000 - $150,000"
  },
  {
    id: "law",
    name: "Law",
    slug: "law",
    category: "Social Sciences",
    scholarshipCount: 26,
    description: "Study legal systems, jurisprudence, constitutional law, international law, and dispute resolution.",
    popularDegrees: ["LLB", "JD", "LLM", "PhD Law"],
    careerPaths: ["Lawyer", "Legal Counsel", "Judge", "Legal Consultant", "Human Rights Advocate"],
    avgSalary: "$80,000 - $200,000+"
  },
  {
    id: "ir",
    name: "International Relations",
    slug: "international-relations",
    category: "Social Sciences",
    scholarshipCount: 24,
    description: "Examine diplomacy, foreign policy, global governance, conflict resolution, and international development.",
    popularDegrees: ["BA International Relations", "MA IR", "MSc Global Affairs", "PhD IR"],
    careerPaths: ["Diplomat", "Policy Analyst", "International Development Specialist", "NGO Manager", "Political Analyst"],
    avgSalary: "$55,000 - $120,000"
  },
  {
    id: "env",
    name: "Environmental Science",
    slug: "environmental-science",
    category: "Natural Sciences",
    scholarshipCount: 22,
    description: "Study ecosystems, climate change, conservation, sustainability, and environmental policy.",
    popularDegrees: ["BSc Environmental Science", "MS Environmental Science", "MSc Sustainability", "PhD Environmental Studies"],
    careerPaths: ["Environmental Scientist", "Conservation Specialist", "Climate Analyst", "Sustainability Consultant"],
    avgSalary: "$55,000 - $100,000"
  },
  {
    id: "bio",
    name: "Biology",
    slug: "biology",
    category: "Natural Sciences",
    scholarshipCount: 30,
    description: "Explore living organisms, genetics, molecular biology, ecology, evolution, and biotechnology.",
    popularDegrees: ["BSc Biology", "MS Biology", "MSc Molecular Biology", "PhD Biology"],
    careerPaths: ["Biologist", "Research Scientist", "Biotechnologist", "Microbiologist", "Genetic Counselor"],
    avgSalary: "$60,000 - $120,000"
  },
  {
    id: "chem",
    name: "Chemistry",
    slug: "chemistry",
    category: "Natural Sciences",
    scholarshipCount: 25,
    description: "Study matter, chemical reactions, compounds, synthesis, analytical methods, and material science.",
    popularDegrees: ["BSc Chemistry", "MS Chemistry", "MSc Chemical Engineering", "PhD Chemistry"],
    careerPaths: ["Chemist", "Chemical Engineer", "Pharmaceutical Scientist", "Materials Scientist", "Analytical Chemist"],
    avgSalary: "$65,000 - $130,000"
  },
  {
    id: "phys",
    name: "Physics",
    slug: "physics",
    category: "Natural Sciences",
    scholarshipCount: 28,
    description: "Investigate the fundamental laws of nature, from quantum mechanics to cosmology and everything in between.",
    popularDegrees: ["BSc Physics", "MS Physics", "MSc Theoretical Physics", "PhD Physics"],
    careerPaths: ["Physicist", "Research Scientist", "Astrophysicist", "Data Scientist", "Quantum Computing Researcher"],
    avgSalary: "$75,000 - $150,000"
  },
  {
    id: "math",
    name: "Mathematics",
    slug: "mathematics",
    category: "Natural Sciences",
    scholarshipCount: 23,
    description: "Master pure and applied mathematics, statistics, computational methods, and mathematical modeling.",
    popularDegrees: ["BSc Mathematics", "MS Mathematics", "MSc Applied Mathematics", "PhD Mathematics"],
    careerPaths: ["Mathematician", "Actuary", "Data Scientist", "Quantitative Analyst", "Cryptographer"],
    avgSalary: "$70,000 - $140,000"
  },
  {
    id: "arch",
    name: "Architecture",
    slug: "architecture",
    category: "Arts & Design",
    scholarshipCount: 18,
    description: "Design buildings and spaces combining aesthetics, functionality, sustainability, and cultural context.",
    popularDegrees: ["BArch", "MArch", "MSc Architecture", "PhD Architecture"],
    careerPaths: ["Architect", "Urban Planner", "Landscape Architect", "Interior Designer", "Sustainable Design Consultant"],
    avgSalary: "$65,000 - $120,000"
  },
  {
    id: "edu",
    name: "Education",
    slug: "education",
    category: "Social Sciences",
    scholarshipCount: 21,
    description: "Study pedagogy, curriculum development, educational psychology, policy, and leadership to transform learning.",
    popularDegrees: ["BEd", "MEd", "MA Education", "EdD", "PhD Education"],
    careerPaths: ["Teacher", "School Administrator", "Curriculum Developer", "Education Consultant", "Academic Researcher"],
    avgSalary: "$50,000 - $100,000"
  },
  {
    id: "psy",
    name: "Psychology",
    slug: "psychology",
    category: "Social Sciences",
    scholarshipCount: 26,
    description: "Understand human behavior, cognition, emotions, mental health, and psychological development.",
    popularDegrees: ["BA Psychology", "MS Psychology", "MA Clinical Psychology", "PsyD", "PhD Psychology"],
    careerPaths: ["Psychologist", "Clinical Psychologist", "Counselor", "Research Psychologist", "Organizational Psychologist"],
    avgSalary: "$60,000 - $130,000"
  },
  {
    id: "agri",
    name: "Agriculture",
    slug: "agriculture",
    category: "Applied Sciences",
    scholarshipCount: 19,
    description: "Study crop science, soil management, sustainable farming, food security, and agricultural economics.",
    popularDegrees: ["BSc Agriculture", "MS Agriculture", "MSc Agronomy", "PhD Agricultural Sciences"],
    careerPaths: ["Agricultural Scientist", "Agronomist", "Farm Manager", "Food Security Specialist", "Agricultural Economist"],
    avgSalary: "$55,000 - $95,000"
  }
];
