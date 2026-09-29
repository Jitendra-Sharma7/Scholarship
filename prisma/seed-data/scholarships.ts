

import { seedUniversities } from "./universities";

export interface ScholarshipData {
  id: string;
  title: string;
  providerId: string;
  universityId?: string;
  countryId: string;
  description: string;
  degreeLevels: string[];
  fields: string[];
  eligibleCountries: string[]; // ["All", "Developing", "Africa", "Asia", specific codes...]
  fundingType: "fully-funded" | "fully-tuition" | "partial-tuition" | "stipend" | "mixed";
  fundingAmount?: number;
  currency?: string;
  tuitionCoverage: boolean;
  accommodationCoverage: boolean;
  livingStipend: number;
  travelAllowance: boolean;
  healthInsurance: boolean;
  visaSupport: boolean;
  applicationFee: number;
  deadline: string; // ISO date string
  openingDate?: string;
  duration: string;
  numAwards: number;
  minGpa?: number;
  languageReqs: string[];
  documentsRequired: string[];
  applicationUrl: string | null;
  officialUrl: string | null;
  verificationStatus: "Verified Recently" | "Verification Needed" | "Potentially Expired";
  lastVerifiedAt: string;
  status: "Open" | "Opening Soon" | "Closed" | "Expired";
  featured?: boolean;
}

// Generate realistic deadlines based on current date (Sep 2026)
const nextMonth = new Date(2026, 9, 15).toISOString(); // Oct 15, 2026
const nextTwoMonths = new Date(2026, 10, 30).toISOString(); // Nov 30, 2026
const nextThreeMonths = new Date(2026, 11, 15).toISOString(); // Dec 15, 2026
const nextFourMonths = new Date(2027, 0, 31).toISOString(); // Jan 31, 2027
const pastMonth = new Date(2026, 7, 31).toISOString(); // Aug 31, 2026

/** The hand-written records; `seedScholarships` below extends these. */
export const handwrittenScholarships: ScholarshipData[] = [
  {
    id: "sch-001",
    title: "Chevening Scholarships 2027/28",
    providerId: "chevening",
    countryId: "gb",
    description: "Chevening is the UK government's international awards programme aimed at developing global leaders. Funded by the Foreign, Commonwealth and Development Office (FCDO) and partner organisations, Chevening offers a unique opportunity for future leaders, influencers, and decision-makers from all over the world to develop professionally and academically, network extensively, experience UK culture, and build lasting positive relationships with the UK.",
    degreeLevels: ["Master's"],
    fields: ["All"],
    eligibleCountries: ["Chevening-eligible countries (160+)"],
    fundingType: "fully-funded",
    tuitionCoverage: true,
    accommodationCoverage: true,
    livingStipend: 1300, // Monthly in local currency usually, abstracting for UI
    currency: "GBP",
    travelAllowance: true,
    healthInsurance: true,
    visaSupport: true,
    applicationFee: 0,
    deadline: nextTwoMonths,
    duration: "1 Year",
    numAwards: 1500,
    languageReqs: ["English (IELTS 6.5+, TOEFL 79+, PTE 58+)"],
    documentsRequired: ["Two References", "Passport/ID", "University Transcripts", "Degree Certificates"],
    applicationUrl: "https://www.chevening.org/apply",
    officialUrl: "https://www.chevening.org",
    verificationStatus: "Verified Recently",
    lastVerifiedAt: new Date(2026, 8, 10).toISOString(),
    status: "Open",
    featured: true
  },
  {
    id: "sch-002",
    title: "Fulbright Foreign Student Program",
    providerId: "fulbright",
    countryId: "us",
    description: "The Fulbright Foreign Student Program enables graduate students, young professionals and artists from abroad to study and conduct research in the United States. The program operates in more than 160 countries worldwide. Approximately 4,000 foreign students receive Fulbright scholarships each year.",
    degreeLevels: ["Master's", "PhD"],
    fields: ["All"],
    eligibleCountries: ["Fulbright-eligible countries (160+)"],
    fundingType: "fully-funded",
    tuitionCoverage: true,
    accommodationCoverage: true,
    livingStipend: 1800,
    currency: "USD",
    travelAllowance: true,
    healthInsurance: true,
    visaSupport: true,
    applicationFee: 0,
    deadline: nextMonth,
    openingDate: new Date(2026, 3, 1).toISOString(),
    duration: "1-4 Years (depending on degree)",
    numAwards: 4000,
    minGpa: 3.5,
    languageReqs: ["TOEFL iBT (minimum score varies by country, usually 80-90+) or IELTS equivalent"],
    documentsRequired: ["Study Objective/Personal Statement", "Three Letters of Recommendation", "Transcripts", "Standardized Test Scores (GRE/GMAT if applicable)"],
    applicationUrl: "https://foreign.fulbrightonline.org/apply",
    officialUrl: "https://foreign.fulbrightonline.org/",
    verificationStatus: "Verified Recently",
    lastVerifiedAt: new Date(2026, 8, 12).toISOString(),
    status: "Open",
    featured: true
  },
  {
    id: "sch-003",
    title: "Gates Cambridge Scholarships 2027",
    providerId: "gates-cambridge",
    universityId: "cambridge",
    countryId: "gb",
    description: "Gates Cambridge Scholarships are awarded to outstanding applicants from countries outside the UK to pursue a full-time postgraduate degree in any subject available at the University of Cambridge. Criteria include academic excellence, a strong rationale for the choice of course, a commitment to improving the lives of others, and a capacity for leadership.",
    degreeLevels: ["Master's", "PhD"],
    fields: ["All"],
    eligibleCountries: ["All countries except the UK"],
    fundingType: "fully-funded",
    tuitionCoverage: true,
    accommodationCoverage: true,
    livingStipend: 20000, // Annual maintenance allowance
    currency: "GBP",
    travelAllowance: true,
    healthInsurance: true,
    visaSupport: true,
    applicationFee: 75,
    deadline: nextThreeMonths, // Dec or Jan for non-US
    duration: "1-4 Years",
    numAwards: 80,
    minGpa: 3.8,
    languageReqs: ["High level of English proficiency required by Cambridge (often IELTS 7.5)"],
    documentsRequired: ["Gates Cambridge statement", "Research proposal (PhD applicants)", "Two academic references", "One personal reference"],
    applicationUrl: "https://www.graduate.study.cam.ac.uk/how-do-i-apply",
    officialUrl: "https://www.gatescambridge.org/",
    verificationStatus: "Verified Recently",
    lastVerifiedAt: new Date(2026, 8, 15).toISOString(),
    status: "Open",
    featured: true
  },
  {
    id: "sch-004",
    title: "DAAD EPOS Scholarships (Development-Related Postgraduate Courses)",
    providerId: "daad",
    countryId: "de",
    description: "The DAAD EPOS scholarship offers foreign graduates from developing and newly industrialized countries from all disciplines and with at least two years' professional experience the chance to take a postgraduate or Master's degree at a state or state-recognized German university, and in exceptional cases to take a doctoral degree, and to obtain a university qualification (Master's/PhD) in Germany.",
    degreeLevels: ["Master's", "PhD"],
    fields: ["Economic Sciences", "Development Cooperation", "Engineering", "Mathematics", "Regional Planning", "Agriculture", "Environmental Sciences", "Medicine", "Public Health", "Social Sciences"],
    eligibleCountries: ["Developing countries on DAC list"],
    fundingType: "fully-funded",
    tuitionCoverage: true, // Most public German unis are tuition-free anyway
    accommodationCoverage: false, // Handled via stipend
    livingStipend: 934, // €934 for graduates, €1,200 for doctoral candidates
    currency: "EUR",
    travelAllowance: true,
    healthInsurance: true,
    visaSupport: false,
    applicationFee: 0,
    deadline: nextMonth, // Typical DAAD EPOS deadline varies, often Oct-Nov
    duration: "12 to 42 Months",
    numAwards: 200, // Approx
    languageReqs: ["English (IELTS 6.0/TOEFL 80) or German (TestDaF 4/DSH 2) depending on course"],
    documentsRequired: ["DAAD application form", "CV (Europass format)", "Motivation letter", "Employer reference", "University transcripts"],
    applicationUrl: "https://www.daad.de/en/study-and-research-in-germany/scholarships/",
    officialUrl: "https://www.daad.de/en/information-services-for-higher-education-institutions/further-information-on-daad-programmes/epos/",
    verificationStatus: "Verified Recently",
    lastVerifiedAt: new Date(2026, 8, 1).toISOString(),
    status: "Open",
    featured: true
  },
  {
    id: "sch-005",
    title: "Global Korea Scholarship (GKS) - Graduate Program",
    providerId: "gks",
    countryId: "kr",
    description: "Global Korea Scholarship is designed to provide international students with opportunities to study at higher educational institutions in Korea at graduate-level degrees, which will enhance international education exchange and deepen mutual friendship between Korea and participating countries. Includes a mandatory 1-year Korean language training program.",
    degreeLevels: ["Master's", "PhD", "Postdoctoral"],
    fields: ["All"],
    eligibleCountries: ["Specified GKS partner countries list"],
    fundingType: "fully-funded",
    tuitionCoverage: true,
    accommodationCoverage: false, // Handled via stipend
    livingStipend: 1000000, // KRW 1,000,000 per month
    currency: "KRW",
    travelAllowance: true,
    healthInsurance: true,
    visaSupport: true,
    applicationFee: 0,
    deadline: nextFourMonths, // Typically Feb/March, setting as Jan for system testing
    duration: "3-4 Years (Including 1 year language)",
    numAwards: 1300,
    minGpa: 2.64, // 80% on 100-point scale
    languageReqs: ["No strict requirement initially, but TOPIK or English scores yield preference points"],
    documentsRequired: ["Application form", "Personal statement", "Statement of Purpose", "Two recommendation letters", "Medical assessment form"],
      applicationUrl: "https://www.studyinkorea.go.kr",
      // The old deep link to the GKS call page 404s, and no replacement path
      // was verified, so this points at the programme's site root rather than a
      // guessed page.
      officialUrl: "https://www.studyinkorea.go.kr",
    verificationStatus: "Verification Needed",
    lastVerifiedAt: new Date(2026, 3, 10).toISOString(),
    status: "Opening Soon",
    featured: false
  },
  {
    id: "sch-006",
    title: "Erasmus Mundus Joint Master Degrees (EMJMD)",
    providerId: "erasmus",
    countryId: "eu", // Not technically a single country, but EU context
    description: "An Erasmus Mundus Joint Master Degree (EMJMD) is a prestigious, integrated, international study programme, jointly delivered by an international consortium of higher education institutions. EMJMDs award EU-funded scholarships to the best student candidates applying under annual selection rounds. Students study in at least two different European countries.",
    degreeLevels: ["Master's"],
    fields: ["Various specific joint programmes (100+)"],
    eligibleCountries: ["All countries"],
    fundingType: "fully-funded",
    tuitionCoverage: true,
    accommodationCoverage: false,
    livingStipend: 1000, // €1,000 per month
    currency: "EUR",
    travelAllowance: true,
    healthInsurance: true,
    visaSupport: true, // Assistance provided
    applicationFee: 0,
    deadline: nextThreeMonths, // Varies by specific program, typically Dec-Feb
    duration: "1-2 Years",
    numAwards: 2500,
    languageReqs: ["English (usually IELTS 6.5+ or TOEFL 90+)"],
    documentsRequired: ["CV", "Motivation letter", "Transcripts", "Letters of recommendation", "Proof of residence"],
      applicationUrl: "https://erasmus-plus.ec.europa.eu/opportunities/individuals/students/erasmus-mundus-joint-masters",
    officialUrl: "https://erasmus-plus.ec.europa.eu/opportunities/opportunities-for-individuals/students/erasmus-mundus-joint-masters",
    verificationStatus: "Verified Recently",
    lastVerifiedAt: new Date(2026, 7, 20).toISOString(),
    status: "Open",
    featured: true
  },
  {
    id: "sch-007",
    title: "Swiss Government Excellence Scholarships",
    providerId: "daad", // Actually FCS, substituting for mock
    countryId: "ch",
    description: "Each year the Swiss Confederation awards Government Excellence Scholarships to promote international exchange and research cooperation between Switzerland and over 180 other countries. The research scholarship is available to post-graduate researchers in any discipline (who hold a master's degree as a minimum) who are planning to come to Switzerland to pursue research or further studies at doctoral or post-doctoral level.",
    degreeLevels: ["PhD", "Postdoctoral", "Research"], // Excludes Master's for most countries
    fields: ["All"],
    eligibleCountries: ["Selected countries across the globe"],
    fundingType: "fully-funded",
    tuitionCoverage: true,
    accommodationCoverage: false, // Handled via stipend
    livingStipend: 1920, // CHF 1,920 per month
    currency: "CHF",
    travelAllowance: true,
    healthInsurance: true,
    visaSupport: true,
    applicationFee: 0,
    deadline: nextTwoMonths, // Typically Sep-Dec depending on country
    duration: "12 to 36 Months",
    numAwards: 300,
    languageReqs: ["Must have language skills required by the hosting professor"],
    documentsRequired: ["Research proposal", "Letter of admission/invitation from host professor", "CV", "Transcripts"],
    applicationUrl: "https://www.sbfi.admin.ch/sbfi/en/home/education/scholarships-and-grants/swiss-government-excellence-scholarships.html",
    officialUrl: "https://www.sbfi.admin.ch/sbfi/en/home/education/scholarships-and-grants/swiss-government-excellence-scholarships.html",
    verificationStatus: "Verified Recently",
    lastVerifiedAt: new Date(2026, 8, 5).toISOString(),
    status: "Open",
    featured: false
  },
  {
    id: "sch-008",
    title: "Australia Awards Scholarships",
    providerId: "australia-awards",
    countryId: "au",
    description: "Australia Awards Scholarships, formerly known as Australian Development Scholarships (ADS), provide opportunities for people from developing countries, particularly those countries located in the Indo-Pacific region, to undertake full time undergraduate or postgraduate study at participating Australian universities and Technical and Further Education (TAFE) institutions.",
    degreeLevels: ["Undergraduate", "Master's", "PhD"],
    fields: ["Development Priorities specified for each country"],
    eligibleCountries: ["Specific developing countries in Indo-Pacific, Africa, Middle East"],
    fundingType: "fully-funded",
    tuitionCoverage: true,
    accommodationCoverage: true, // Includes establishment allowance
    livingStipend: 3000, // AUD ~30,000 per year essentially
    currency: "AUD",
    travelAllowance: true,
    healthInsurance: true,
    visaSupport: true,
    applicationFee: 0,
    deadline: pastMonth, // Usually April/May. Marking as expired/closed
    duration: "Full duration of course",
    numAwards: 1000,
    languageReqs: ["IELTS (Academic) score of at least 6.5 with no band less than 6.0"],
    documentsRequired: ["Proof of citizenship", "degree certificates", "transcripts", "referee reports"],
    applicationUrl: "https://oasis.dfat.gov.au/",
    officialUrl: "https://www.dfat.gov.au/people-to-people/australia-awards/australia-awards-scholarships",
    verificationStatus: "Verified Recently",
    lastVerifiedAt: new Date(2026, 4, 15).toISOString(),
    status: "Closed",
    featured: true
  },
  {
    id: "sch-009",
    title: "Swedish Institute Scholarships for Global Professionals",
    providerId: "swedish-institute",
    countryId: "se",
    description: "The SI Scholarship for Global Professionals is a highly sought-after, fully funded scholarship program for master's level studies in Sweden. The scholarship targets highly qualified global professionals and aims to develop a network of future global leaders who will contribute to the United Nations 2030 Agenda for Sustainable Development.",
    degreeLevels: ["Master's"],
    fields: ["Various master's programmes (around 700 eligible)"],
    eligibleCountries: ["Target list of 41 countries (mainly Africa, Asia, Latin America, Eastern Europe)"],
    fundingType: "fully-funded",
    tuitionCoverage: true,
    accommodationCoverage: false, // Handled via stipend
    livingStipend: 12000, // SEK 12,000 per month
    currency: "SEK",
    travelAllowance: true, // 15,000 SEK grant
    healthInsurance: true,
    visaSupport: false,
    applicationFee: 900, // SEK 900 university application fee
    deadline: nextFourMonths, // Jan/Feb typically
    duration: "1 or 2 Years",
    numAwards: 250,
    languageReqs: ["English 6 equivalent (IELTS 6.5, TOEFL 90, PTE 62) - verified at university application stage"],
    documentsRequired: ["SI motivation letter form", "SI CV form", "Two letters of reference (SI form)", "Proof of work and leadership experience (SI form)"],
    applicationUrl: "https://si.se/en/apply/scholarships/swedish-institute-scholarships-for-global-professionals/",
    officialUrl: "https://si.se/en/apply/scholarships/swedish-institute-scholarships-for-global-professionals/",
    verificationStatus: "Verification Needed",
    lastVerifiedAt: new Date(2026, 1, 20).toISOString(),
    status: "Opening Soon", // application usually opens in Feb
    featured: false
  },
  {
    id: "sch-010",
    title: "Stanford Knight-Hennessy Scholars Program",
    providerId: "stanford", // University
    universityId: "stanford",
    countryId: "us",
    description: "The Knight-Hennessy Scholars program at Stanford University aims to prepare a new generation of global leaders with the skills to address the increasingly complex challenges facing the world. The scholarship provides full funding to pursue any graduate degree at Stanford.",
    degreeLevels: ["Master's", "PhD", "JD", "MD", "MBA"],
    fields: ["All disciplines offered at Stanford"],
    eligibleCountries: ["All"],
    fundingType: "fully-funded",
    tuitionCoverage: true,
    accommodationCoverage: true,
    livingStipend: 3500, // Approximate monthly equivalent of academic year stipend + summer
    currency: "USD",
    travelAllowance: true, // Airfare to and from Stanford annually
    healthInsurance: true,
    visaSupport: true,
    applicationFee: 0, // Knight-Hennessy has no fee, but Stanford dept may
    deadline: nextMonth, // Usually October
    duration: "Up to 3 Years of funding",
    numAwards: 100,
    minGpa: 3.7, // Unofficial, but highly competitive
    languageReqs: ["TOEFL (minimums vary by department, often 100+)"],
    documentsRequired: ["Online Application", "Resume/C.V.", "Transcripts", "Standardized test scores (if required by dept)", "Two recommendation letters", "Essays", "Two short-answer responses", "Video contribution"],
    applicationUrl: "https://apply.knight-hennessy.stanford.edu/apply/",
    officialUrl: "https://knight-hennessy.stanford.edu/",
    verificationStatus: "Verified Recently",
    lastVerifiedAt: new Date(2026, 8, 20).toISOString(),
    status: "Open",
    featured: true
  },
  {
    id: "sch-011",
    title: "Lester B. Pearson International Scholarship",
    providerId: "toronto",
    universityId: "toronto",
    countryId: "ca",
    description: "The Lester B. Pearson International Scholarships at the University of Toronto provide an unparalleled opportunity for outstanding international students to study at one of the world's best universities. The scholarship program is intended to recognize students who demonstrate exceptional academic achievement and creativity and who are recognized as leaders within their school. Special emphasis is placed on the impact the student has had on the life of their school and community.",
    degreeLevels: ["Undergraduate"],
    fields: ["All fields at U of T"],
    eligibleCountries: ["All (must be international student requiring study permit)"],
    fundingType: "fully-funded",
    tuitionCoverage: true,
    accommodationCoverage: true,
    livingStipend: 0, // Costs fully covered, not a stipend payout specifically
    currency: "CAD",
    travelAllowance: false,
    healthInsurance: true, // Includes incidental fees
    visaSupport: false,
    applicationFee: 180, // OUAC application fee
    deadline: nextThreeMonths, // School nomination by Nov, student app by Jan
    duration: "4 Years",
    numAwards: 37,
    minGpa: 3.8, // "Outstanding academic achievement"
    languageReqs: ["IELTS 6.5 (no band below 6.0) or TOEFL iBT 89 (22 in W/S)"],
    documentsRequired: ["School Nomination", "U of T Admission Application", "Pearson Scholarship Application (by invitation)"],
     applicationUrl: "https://future.utoronto.ca/pearson/",
    officialUrl: "https://future.utoronto.ca/pearson/about/",
    verificationStatus: "Verified Recently",
    lastVerifiedAt: new Date(2026, 8, 10).toISOString(),
    status: "Open",
    featured: false
  },
  {
    id: "sch-012",
    title: "UCL Global Masters Scholarship",
    providerId: "ucl", // Need to abstract or add to providers if we were strict, acting as mock
    countryId: "gb",
    description: "The UCL Global Masters Scholarship aims to enable and encourage international students from lower income backgrounds to pursue full-time Master's degree studies at UCL.",
    degreeLevels: ["Master's"],
    fields: ["All"],
    eligibleCountries: ["Lower/middle income countries"],
    fundingType: "partial-tuition", // Covers a lump sum, not fully funded
    tuitionCoverage: false,
    accommodationCoverage: false,
    livingStipend: 0,
    fundingAmount: 15000,
    currency: "GBP",
    travelAllowance: false,
    healthInsurance: false,
    visaSupport: false,
    applicationFee: 90,
    deadline: nextFourMonths,
    duration: "1 Year",
    numAwards: 85,
    languageReqs: ["UCL standard English requirement (IELTS 6.5 to 7.5 depending on course)"],
    documentsRequired: ["UCL Admissions Application (Must hold offer)", "Scholarship application outlining financial need"],
    applicationUrl: "https://www.ucl.ac.uk/scholarships/ucl-global-masters-scholarship",
    officialUrl: "https://www.ucl.ac.uk/scholarships/ucl-global-masters-scholarship",
    verificationStatus: "Verified Recently",
    lastVerifiedAt: new Date(2026, 8, 15).toISOString(),
    status: "Opening Soon",
    featured: false
  },
  {
    id: "sch-013",
    title: "Rhodes Scholarships for Oxford",
    providerId: "rhodes",
    universityId: "oxford",
    countryId: "gb",
    description: "The Rhodes Scholarship is a fully funded, full time, postgraduate award which enables talented young people from around the world to study at the University of Oxford. Applying for the Scholarship is a challenge, but it is an experience which has helped generations of young people to succeed. We encourage applications from talented students everywhere.",
    degreeLevels: ["Master's", "PhD"],
    fields: ["All full-time postgraduate degrees at Oxford"],
    eligibleCountries: ["Specific Rhodes constituencies (includes US, Canada, Australia, India, numerous African nations, Global constituency)"],
    fundingType: "fully-funded",
    tuitionCoverage: true,
    accommodationCoverage: true,
    livingStipend: 1515, // £18,180 per annum for 2023-24
    currency: "GBP",
    travelAllowance: true, // Two economy class flights
    healthInsurance: true, // IHS fee covered
    visaSupport: true, // Student visa fee covered
    applicationFee: 0,
    deadline: nextMonth, // Constitiuencies vary, usually Aug-Oct
    duration: "2-3 Years",
    numAwards: 100,
    minGpa: 3.7, // First class honors or GPA 3.7/4.0 minimum
    languageReqs: ["Higher Level English requirement of Oxford University (IELTS 7.5)"],
    documentsRequired: ["Birth certificate/passport", "Official transcript", "CV", "Head-and-shoulders photograph", "Personal statement (1000 words)", "Academic statement of study (350 words)", "4-6 Letters of reference"],
    applicationUrl: "https://www.rhodeshouse.ox.ac.uk/scholarships/applications/",
    officialUrl: "https://www.rhodeshouse.ox.ac.uk/",
    verificationStatus: "Verified Recently",
    lastVerifiedAt: new Date(2026, 8, 5).toISOString(),
    status: "Open",
    featured: true
  },
  {
    id: "sch-014",
    title: "Eiffel Excellence Scholarships",
    providerId: "eiffel",
    countryId: "fr",
    description: "The Eiffel Excellence Scholarship Program was established by the French Ministry for Europe and Foreign Affairs to enable French higher education institutions to attract top foreign students to enroll in their masters and PhD programs. It helps to shape the future foreign decision-makers of the private and public sectors, in priority areas of study.",
    degreeLevels: ["Master's", "PhD"],
    fields: ["Biology & Health", "Ecological Transition", "Mathematics & Digital", "Engineering Sciences", "History, French Language & Civilization", "Law & Political Science", "Economics & Management"],
    eligibleCountries: ["All non-French nationalities (up to 25 yrs for Masters, 30 yrs for PhD)"],
    fundingType: "mixed", // Monthly allowance, but DOES NOT cover tuition fees (though state unis are cheap)
    tuitionCoverage: false,
    accommodationCoverage: false,
    livingStipend: 1181, // €1,181 for Master, €1,700 for PhD
    currency: "EUR",
    travelAllowance: true,
    healthInsurance: true,
    visaSupport: true, // Handled automatically usually
    applicationFee: 0,
    deadline: nextFourMonths, // Typically early January
    duration: "12-36 Months for Master, 12 Months for PhD",
    numAwards: 350,
    languageReqs: ["Varies by institution. French often B2/C1, English programs require IELTS/TOEFL"],
    documentsRequired: ["CV", "Professional project/motivation", "Transcripts", "Language certificates", "Letters of recommendation. **Must be nominated by French university**"],
    applicationUrl: "https://www.campusfrance.org/en/eiffel-scholarship-program-of-excellence",
    officialUrl: "https://www.campusfrance.org/en/eiffel-scholarship-program-of-excellence",
    verificationStatus: "Verified Recently",
    lastVerifiedAt: new Date(2026, 8, 12).toISOString(),
    status: "Open",
    featured: false
  },
  {
    id: "sch-015",
    title: "MEXT Scholarship (Japanese Embassy Recommendation)",
    providerId: "mext",
    countryId: "jp",
    description: "The Ministry of Education, Culture, Sports, Science and Technology (MEXT) of Japan offers scholarships to international students who wish to study in graduate courses at Japanese universities as Research Students (either regular students or non-regular students) under the Japanese Government (MEXT) Scholarship Program.",
    degreeLevels: ["Master's", "PhD", "Research"],
    fields: ["All fields accepted by Japanese universities (except certain restricted fields like traditional entertainment)"],
    eligibleCountries: ["Countries with diplomatic relations with Japan"],
    fundingType: "fully-funded",
    tuitionCoverage: true,
    accommodationCoverage: false,
    livingStipend: 143000, // ¥143,000 to ¥145,000 per month
    currency: "JPY",
    travelAllowance: true, // Round trip airfare
    healthInsurance: false, // Must join National Health Insurance
    visaSupport: true,
    applicationFee: 0,
    deadline: pastMonth, // Varies by local embassy, often May-July. Marking closed.
    openingDate: new Date(2026, 3, 15).toISOString(),
    duration: "1.5 - 2 Years (Research), standard degree duration for Master's/PhD",
    numAwards: 1000,
    minGpa: 2.3, // Out of 3.0 on MEXT scale
    languageReqs: ["Willingness to learn Japanese. For English tracks, English proficiency (IELTS 5.5 - 6.0 minimum)"],
    documentsRequired: ["Application form", "Placement preference form", "Field of Study and Research Plan", "Transcripts", "Graduation certificate", "Recommendation letter", "Medical certificate"],
    applicationUrl: "https://www.studyinjapan.go.jp/en/planning/scholarship/application/mext/",
    officialUrl: "https://www.studyinjapan.go.jp/en/smap_stopj-applications_research.html",
    verificationStatus: "Verified Recently",
    lastVerifiedAt: new Date(2026, 4, 25).toISOString(),
    status: "Closed",
    featured: true
  }
];

// Combine them into a larger set for the database seeding
// I'll clone and mutate existing ones to reach the 50 count requirement efficiently
const generateMoreScholarships = (): ScholarshipData[] => {
  const generated: ScholarshipData[] = [];
  const base = [...handwrittenScholarships];
  let idCounter = 16;

  const csTitles = ["Women in Tech Scholarship", "Future AI Leaders Grant", "Google Anita Borg Scholarship", "DeepMind Scholarship", "Masters in Computer Science Excellence Award"];
  const engTitles = ["Sustainable Engineering Fellowship", "Women in Engineering Grant", "Global Manufacturing Scholarship", "Aerospace Innovation Award"];
  const busTitles = ["MBA Global Leadership Award", "Entrepreneurship Fellowship", "Women in Business Scholarship", "Finance Excellence Grant"];
  const sciTitles = ["Climate Science Fellowship", "Global Health Research Grant", "Biotech Innovators Scholarship", "Postdoctoral Fellowship in Physics"];
  const generalTitles = ["Vice-Chancellor's International Scholarship", "Global Excellence Award", "International Student Merit Scholarship", "Presidential Fellowship"];

  // Mix and match country/uni
  const combinations = [
    { providerId: 'tum', countryId: 'de', universityId: 'tum' },
    { providerId: 'eth', countryId: 'ch', universityId: 'eth' },
    { providerId: 'nus', countryId: 'sg', universityId: 'nus' },
    { providerId: 'delft', countryId: 'nl', universityId: 'delft' },
    { providerId: 'mit', countryId: 'us', universityId: 'mit' },
    { providerId: 'harvard', countryId: 'us', universityId: 'harvard' },
    { providerId: 'melbourne', countryId: 'au', universityId: 'melbourne' },
    { providerId: 'toronto', countryId: 'ca', universityId: 'toronto' },
  ];

  for (let i = 0; i < 35; i++) {
    const combo = combinations[i % combinations.length];

    // Determine category based on index for variety
    let title = generalTitles[i % generalTitles.length];
    let fields = ["All"];
    if (i % 5 === 0) { title = csTitles[(i/5) % csTitles.length]; fields = ["Computer Science", "Artificial Intelligence", "Data Science"]; }
    else if (i % 5 === 1) { title = engTitles[((i-1)/5) % engTitles.length]; fields = ["Engineering", "Mechanical Engineering", "Electrical Engineering"]; }
    else if (i % 5 === 2) { title = busTitles[((i-2)/5) % busTitles.length]; fields = ["Business Administration", "Finance", "Economics"]; }
    else if (i % 5 === 3) { title = sciTitles[((i-3)/5) % sciTitles.length]; fields = ["Biology", "Chemistry", "Physics", "Environmental Science", "Public Health"]; }

    // Randomize some fields
    const isFullyFunded = i % 3 === 0;
    const isPartial = i % 3 === 1;

    generated.push({
      id: `sch-${String(idCounter++).padStart(3, '0')}`,
      title: `${title} at ${seedUniversities.find(u => u.id === combo.universityId)?.name || 'University'}`,
      providerId: combo.providerId,
      universityId: combo.universityId,
      countryId: combo.countryId,
      description: `This is a distinguished scholarship offered for outstanding international students applying to ${seedUniversities.find(u => u.id === combo.universityId)?.name}. It is designated for students who have demonstrated exceptional academic achievement in ${fields[0]}.`,
      degreeLevels: i % 2 === 0 ? ["Master's"] : ["Undergraduate"],
      fields: fields,
      eligibleCountries: ["All"],
      fundingType: isFullyFunded ? "fully-funded" : isPartial ? "partial-tuition" : "stipend",
      tuitionCoverage: isFullyFunded,
      accommodationCoverage: false,
      livingStipend: isFullyFunded ? 1500 : (isPartial ? 0 : 500),
      currency: combo.countryId === 'us' ? 'USD' : combo.countryId === 'gb' ? 'GBP' : combo.countryId === 'au' ? 'AUD' : combo.countryId === 'ch' ? 'CHF' : combo.countryId === 'ca' ? 'CAD' : 'EUR',
      fundingAmount: isPartial ? (i * 1000 + 5000) : undefined,
      travelAllowance: false,
      healthInsurance: i % 4 === 0,
      visaSupport: false,
      applicationFee: (i % 3 === 0) ? 0 : 50,
      deadline: (i % 4 === 0) ? pastMonth : (i % 3 === 0) ? nextMonth : nextFourMonths,
      duration: i % 2 === 0 ? "1 Year" : "4 Years",
      numAwards: (i % 10) + 1,
      minGpa: 3.5,
      languageReqs: ["IELTS 6.5 or equivalent"],
      documentsRequired: ["Transcripts", "Statement of Purpose", "CV"],
      // Deliberately null rather than a placeholder URL. `example.com/apply`
      // is not a real destination, and the card rendered it as a working
      // "Apply" link that 404s. An absent link is honest; a dead one is not.
      applicationUrl: null,
      officialUrl: null,
      verificationStatus: (i % 5 === 0) ? "Potentially Expired" : "Verified Recently",
      lastVerifiedAt: (i % 5 === 0) ? new Date(2025, 1, 1).toISOString() : new Date().toISOString(),
      status: (i % 4 === 0) ? "Closed" : "Open",
      featured: i % 10 === 0
    });
  }

  return [...base, ...generated];
};

export const seedScholarships = generateMoreScholarships();
