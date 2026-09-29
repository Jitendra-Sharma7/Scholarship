export interface ProviderData {
  id: string;
  name: string;
  type: "Government" | "University" | "Foundation" | "NGO" | "Corporate" | "International Organization";
  country: string;
  website: string;
  description: string;
  verified: boolean;
  scholarshipCount: number;
  established: number;
  focusAreas: string[];
}

export const seedProviders: ProviderData[] = [
  {
    id: "daad",
    name: "DAAD (German Academic Exchange Service)",
    type: "Government",
    country: "Germany",
    website: "https://www.daad.de",
    description: "World's largest funding organization supporting international academic exchange, offering scholarships for study and research in Germany.",
    verified: true,
    scholarshipCount: 18,
    established: 1925,
    focusAreas: ["Master's degrees", "PhD research", "Postdoctoral fellowships", "Research visits"]
  },
  {
    id: "fulbright",
    name: "Fulbright Program",
    type: "Government",
    country: "United States",
    website: "https://www.fulbright.org",
    description: "Flagship international educational exchange program sponsored by the U.S. government, promoting mutual understanding through academic and cultural exchange.",
    verified: true,
    scholarshipCount: 12,
    established: 1946,
    focusAreas: ["Graduate study", "Research", "Teaching assistantships", "Cultural exchange"]
  },
  {
    id: "chevening",
    name: "Chevening Scholarships",
    type: "Government",
    country: "United Kingdom",
    website: "https://www.chevening.org",
    description: "UK government's global scholarship programme funded by the Foreign, Commonwealth & Development Office and partner organizations for one-year master's degrees.",
    verified: true,
    scholarshipCount: 8,
    established: 1983,
    focusAreas: ["Master's degrees", "Leadership development", "Networking", "UK study"]
  },
  {
    id: "commonwealth",
    name: "Commonwealth Scholarship Commission",
    type: "International Organization",
    country: "United Kingdom",
    website: "https://www.cscuk.fcdo.gov.uk",
    description: "Supporting students from low and middle-income Commonwealth countries to study in the UK, promoting development goals and international partnerships.",
    verified: true,
    scholarshipCount: 6,
    established: 1959,
    focusAreas: ["Development studies", "Science & technology", "Strengthening health systems", "PhD research"]
  },
  {
    id: "csc",
    name: "China Scholarship Council",
    type: "Government",
    country: "China",
    website: "http://www.csc.edu.cn",
    description: "Chinese government agency providing full scholarships for international students to study in China at all academic levels.",
    verified: true,
    scholarshipCount: 14,
    established: 1996,
    focusAreas: ["Chinese language", "All academic disciplines", "Bilateral programs", "Belt and Road Initiative"]
  },
  {
    id: "mext",
    name: "MEXT (Japanese Government)",
    type: "Government",
    country: "Japan",
    website: "https://www.mext.go.jp",
    description: "Japanese Ministry of Education scholarship offering full funding including tuition, airfare, and monthly stipend for undergraduate and graduate study.",
    verified: true,
    scholarshipCount: 5,
    established: 1954,
    focusAreas: ["Research students", "Undergraduate", "Master's & PhD", "Japanese language"]
  },
  {
    id: "gks",
    name: "Global Korea Scholarship (GKS)",
    type: "Government",
    country: "South Korea",
    website: "https://www.studyinkorea.go.kr",
    description: "Korean government scholarship program providing full support for international students including tuition, airfare, settlement allowance, and monthly stipend.",
    verified: true,
    scholarshipCount: 7,
    established: 1967,
    focusAreas: ["Korean language training", "Undergraduate", "Graduate programs", "Research"]
  },
  {
    id: "erasmus",
    name: "Erasmus Mundus Joint Masters",
    type: "International Organization",
    country: "European Union",
    website: "https://www.eacea.ec.europa.eu",
    description: "EU-funded prestigious international master's programs taught by consortia of European universities with automatic scholarships for top candidates.",
    verified: true,
    scholarshipCount: 22,
    established: 2004,
    focusAreas: ["Joint master's degrees", "EU mobility", "International cooperation", "Excellence"]
  },
  {
    id: "gates-cambridge",
    name: "Gates Cambridge Trust",
    type: "Foundation",
    country: "United Kingdom",
    website: "https://www.gatescambridge.org",
    description: "Prestigious scholarship funded by the Bill & Melinda Gates Foundation for outstanding applicants from outside the UK to pursue a full-time postgraduate degree at Cambridge.",
    verified: true,
    scholarshipCount: 2,
    established: 2000,
    focusAreas: ["Leadership", "Social commitment", "Academic excellence", "Graduate study"]
  },
  {
    id: "rhodes",
    name: "Rhodes Trust",
    type: "Foundation",
    country: "United Kingdom",
    website: "https://www.rhodeshouse.ox.ac.uk",
    description: "World's oldest international scholarship programme enabling outstanding young people from around the world to study at the University of Oxford.",
    verified: true,
    scholarshipCount: 1,
    established: 1902,
    focusAreas: ["Oxford postgraduate study", "Leadership", "Service", "Global community"]
  },
  {
    id: "australia-awards",
    name: "Australia Awards",
    type: "Government",
    country: "Australia",
    website: "https://www.australiaawards.gov.au",
    description: "Long-term development scholarships funded by the Australian Government for students from developing countries, particularly in Indo-Pacific region.",
    verified: true,
    scholarshipCount: 9,
    established: 1950,
    focusAreas: ["Development priorities", "Leadership", "Indo-Pacific focus", "Postgraduate study"]
  },
  {
    id: "vanier",
    name: "Vanier Canada Graduate Scholarships",
    type: "Government",
    country: "Canada",
    website: "https://vanier.gc.ca",
    description: "Prestigious Canadian federal scholarship attracting and retaining world-class doctoral students demonstrating leadership and high scholarly achievement.",
    verified: true,
    scholarshipCount: 3,
    established: 2008,
    focusAreas: ["PhD research", "Health", "Natural sciences & engineering", "Social sciences & humanities"]
  },
  {
    id: "swedish-institute",
    name: "Swedish Institute",
    type: "Government",
    country: "Sweden",
    website: "https://si.se",
    description: "Swedish government agency promoting interest and trust in Sweden internationally, offering scholarships for global professionals.",
    verified: true,
    scholarshipCount: 4,
    established: 1945,
    focusAreas: ["Master's degrees", "Global professionals", "Leadership", "Sustainability"]
  },
  {
    id: "turkiye-burslari",
    name: "Türkiye Bursları",
    type: "Government",
    country: "Turkey",
    website: "https://www.turkiyeburslari.gov.tr",
    description: "Turkish government scholarship program providing comprehensive support including tuition, accommodation, health insurance, and stipend for international students.",
    verified: true,
    scholarshipCount: 6,
    established: 2012,
    focusAreas: ["Undergraduate", "Master's", "PhD", "Turkish language", "Research"]
  },
  {
    id: "eiffel",
    name: "Eiffel Excellence Scholarship Programme",
    type: "Government",
    country: "France",
    website: "https://www.campusfrance.org/en/eiffel",
    description: "French Ministry for Europe and Foreign Affairs scholarship for international students to pursue master's or PhD at French institutions of higher education.",
    verified: true,
    scholarshipCount: 3,
    established: 1999,
    focusAreas: ["Master's level", "PhD", "Engineering", "Economics & management", "Law & political science"]
  }
];
