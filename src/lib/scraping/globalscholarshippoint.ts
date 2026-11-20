import { chromium } from "playwright";
import { PublishStatus } from "@prisma/client";
import { slugify } from "@/lib/slug";

export interface ScrapedScholarship {
  title: string;
  university: string;
  country: string;
  studyLevels: string[];
  description: string;
  fundingType: string;
  fundingAmount?: string;
  tuitionCoverage: boolean;
  accommodationCoverage: boolean;
  livingAllowance?: string;
  travelAllowance: boolean;
  eligibilityCriteria: string[];
  nationalityRequirements: string[];
  academicRequirements: string[];
  englishRequirements: string[];
  openingDate?: Date;
  deadline?: Date;
  intake: string;
  officialUrl: string;
  sourceUrl: string;
  lastVerifiedAt: Date;
  fields: string[];
  numberOfAwards?: number;
}

const BASE_URL = "https://globalscholarshippoint.com";

function cleanText(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function extractDate(text: string): Date | null {
  const patterns = [
    /(\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4})/i,
    /(\d{1,2}\/\d{1,2}\/\d{4})/,
    /(\d{4}-\d{2}-\d{2})/,
    /((?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4})/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const date = new Date(match[1]);
      if (!isNaN(date.getTime())) return date;
    }
  }
  return null;
}

function extractAmount(text: string): string | undefined {
  const patterns = [
    /[£$€¥]\s*[\d,]+(?:\.\d+)?/g,
    /(?:USD|GBP|EUR|AUD|CAD|CHF|JPY|KRW|SEK|CNY|INR)\s*[\d,]+/gi,
    /(?:tuition|stipend|allowance|award|funding|amount|value).*?[£$€¥]\s*[\d,]+/gi,
  ];

  for (const pattern of patterns) {
    const matches = text.match(pattern);
    if (matches && matches.length > 0) {
      return matches.join(", ");
    }
  }
  return undefined;
}

function determineFundingType(text: string): string {
  const lower = text.toLowerCase();
  if (lower.includes("fully funded") || lower.includes("full funding") || 
      (lower.includes("tuition") && lower.includes("stipend") && lower.includes("accommodation"))) {
    return "fully-funded";
  }
  if (lower.includes("full tuition") || lower.includes("100% tuition") || 
      lower.includes("full tuition fee")) {
    return "fully-tuition";
  }
  if (lower.includes("partial tuition") || lower.includes("tuition fee reduction") || 
      lower.includes("tuition discount") || lower.includes("tuition waiver")) {
    return "partial-tuition";
  }
  if (lower.includes("stipend") || lower.includes("monthly allowance") || 
      lower.includes("living allowance")) {
    return "stipend";
  }
  return "mixed";
}

async function scrapeScholarshipPage(page: any, url: string): Promise<ScrapedScholarship | null> {
  try {
    await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForSelector("article, .post-content, .entry-content, main", { timeout: 10000 });

    const title = await page.locator("h1.entry-title, h1.post-title, article h1, .post-header h1").first().textContent() || "";
    const content = await page.locator(".entry-content, .post-content, article .content, main").first().textContent() || "";

    if (!title || title.length < 5) return null;

    const universityMatch = title.match(/(?:University of|College of|Institute of)\s+[A-Za-z\s]+/i) || 
                            content.match(/(?:University of|College of|Institute of)\s+[A-Za-z\s]+/i);
    const university = universityMatch ? cleanText(universityMatch[0]) : "Not Specified";

    const countryMatch = content.match(/(?:UK|United Kingdom|USA|United States|Canada|Australia|New Zealand|Germany|France|Netherlands|Ireland|China|Hungary|Belgium|Netherlands|Switzerland|Sweden|Norway|Denmark|Finland|Italy|Spain|Japan|South Korea|Singapore|Hong Kong|Malaysia)/i);
    const country = countryMatch ? countryMatch[0] : "Not Specified";

    const studyLevels: string[] = [];
    const levelKeywords = ["Undergraduate", "Bachelor", "Postgraduate", "Master", "PhD", "Doctoral", "Postdoctoral", "Research"];
    for (const level of levelKeywords) {
      if (content.toLowerCase().includes(level.toLowerCase())) {
        studyLevels.push(level);
      }
    }

    const fundingType = determineFundingType(content);
    const fundingAmount = extractAmount(content);

    const tuitionCoverage = /tuition\s+(?:covered|waived|free|100%|full)/i.test(content);
    const accommodationCoverage = /accommodation\s+(?:covered|provided|free|included)/i.test(content);
    const travelAllowance = /(?:travel|airfare|flight)\s+(?:covered|provided|included|allowance)/i.test(content);

    const livingAllowanceMatch = content.match(/(?:monthly\s+(?:stipend|allowance)|stipend\s+of|allowance\s+of).*?[£$€¥]\s*[\d,]+/i);
    const livingAllowance = livingAllowanceMatch ? cleanText(livingAllowanceMatch[0]) : undefined;

    const eligibilitySection = content.match(/(?:eligibility|eligible|requirements|criteria)[:\s]*([\s\S]*?)(?:\n\n|$)/i);
    const eligibilityCriteria = eligibilitySection ? cleanText(eligibilitySection[1]).split(/[,\n;]/).filter(Boolean) : [];

    const nationalityMatch = content.match(/(?:nationality|citizen of|open to|eligible countries)[:\s]*([\s\S]*?)(?:\n\n|$)/i);
    const nationalityRequirements = nationalityMatch ? cleanText(nationalityMatch[1]).split(/[,\n;]/).filter(Boolean) : [];

    const academicMatch = content.match(/(?:academic|gpa|grade|percentage|degree)[:\s]*([\s\S]*?)(?:\n\n|$)/i);
    const academicRequirements = academicMatch ? cleanText(academicMatch[1]).split(/[,\n;]/).filter(Boolean) : [];

    const englishMatch = content.match(/(?:english|ielts|toefl|pte|language)[:\s]*([\s\S]*?)(?:\n\n|$)/i);
    const englishRequirements = englishMatch ? cleanText(englishMatch[1]).split(/[,\n;]/).filter(Boolean) : [];

    const deadlineMatch = content.match(/(?:deadline|closing date|apply by)[:\s]*([\s\S]*?)(?:\n|$)/i);
    const deadline = deadlineMatch ? extractDate(deadlineMatch[1]) : undefined;

    const openingMatch = content.match(/(?:opening|applications open|open date)[:\s]*([\s\S]*?)(?:\n|$)/i);
    const openingDate = openingMatch ? extractDate(openingMatch[1]) : undefined;

    const intakeMatch = content.match(/(?:intake|entry|start|begin)[:\s]*(September|January|May|Autumn|Fall|Spring)\s*(\d{4})?/i);
    const intake = intakeMatch ? `${intakeMatch[1]} ${intakeMatch[2] || new Date().getFullYear()}` : "September 2027";

    const officialUrlMatch = content.match(/(?:official|apply|application)\s*(?:website|url|link|page)[:\s]*(https?:\/\/[^\s]+)/i);
    const officialUrl = officialUrlMatch ? officialUrlMatch[1] : url;

    const fieldKeywords = ["Engineering", "Computer Science", "Business", "Medicine", "Law", "Arts", "Science", "Economics", "Management", "Data Science", "AI", "Artificial Intelligence", "Machine Learning", "Public Policy", "International Relations", "Environmental", "Health", "Education"];
    const fields: string[] = [];
    for (const field of fieldKeywords) {
      if (content.toLowerCase().includes(field.toLowerCase())) {
        fields.push(field);
      }
    }

    const awardsMatch = content.match(/(?:awards|scholarships|places|slots|recipients)[:\s]*(\d+)/i);
    const numberOfAwards = awardsMatch ? parseInt(awardsMatch[1], 10) : undefined;

    return {
      title: cleanText(title),
      university,
      country,
      studyLevels: studyLevels.length > 0 ? studyLevels : ["Not Specified"],
      description: cleanText(content.slice(0, 5000)),
      fundingType,
      fundingAmount,
      tuitionCoverage,
      accommodationCoverage,
      livingAllowance,
      travelAllowance,
      eligibilityCriteria,
      nationalityRequirements,
      academicRequirements,
      englishRequirements,
      openingDate: openingDate || undefined,
      deadline: deadline || undefined,
      intake,
      officialUrl,
      sourceUrl: url,
      lastVerifiedAt: new Date(),
      fields: fields.length > 0 ? fields : ["General"],
      numberOfAwards,
    };
  } catch (error) {
    console.error(`Error scraping ${url}:`, error);
    return null;
  }
}

async function getScholarshipLinks(page: any, listingUrl: string): Promise<string[]> {
  try {
    await page.goto(listingUrl, { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForSelector("a", { timeout: 10000 });

    const links = await page.evaluate(() => {
      const anchors = Array.from(document.querySelectorAll("a"));
      return anchors
        .map((a) => a.href)
        .filter((href) => 
          href.includes("/scholarship") || 
          href.includes("/grant") || 
          href.includes("/fellowship") ||
          href.includes("/award") ||
          href.includes("/funding")
        )
        .filter((href) => !href.includes("#") && !href.includes("?replytocom"));
    });

    return Array.from(new Set(links));
  } catch (error) {
    console.error(`Error getting links from ${listingUrl}:`, error);
    return [];
  }
}

export async function scrapeGlobalScholarshipPoint(
  targetIntake: string = "September 2027",
  maxPages: number = 10
): Promise<{ scholarships: ScrapedScholarship[]; errors: string[] }> {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const scholarships: ScrapedScholarship[] = [];
  const errors: string[] = [];
  const visitedUrls = new Set<string>();

  try {
    const searchUrls = [
      `${BASE_URL}/scholarships/`,
      `${BASE_URL}/category/uk-scholarships/`,
      `${BASE_URL}/category/usa-scholarships/`,
      `${BASE_URL}/category/canada-scholarships/`,
      `${BASE_URL}/category/australia-scholarships/`,
      `${BASE_URL}/category/germany-scholarships/`,
      `${BASE_URL}/category/france-scholarships/`,
      `${BASE_URL}/category/netherlands-scholarships/`,
      `${BASE_URL}/category/china-scholarships/`,
      `${BASE_URL}/category/europe-scholarships/`,
      `${BASE_URL}/category/fully-funded-scholarships/`,
      `${BASE_URL}/search?q=2027`,
      `${BASE_URL}/search?q=September+2027`,
    ];

    for (const searchUrl of searchUrls) {
      if (scholarships.length >= 100) break;

      try {
        const links = await getScholarshipLinks(page, searchUrl);
        
        for (const link of links.slice(0, maxPages)) {
          if (visitedUrls.has(link)) continue;
          visitedUrls.add(link);

          const scholarship = await scrapeScholarshipPage(page, link);
          if (scholarship) {
            if (scholarship.intake?.includes("2027") || (scholarship.deadline && scholarship.deadline.getFullYear() >= 2026)) {
              scholarships.push(scholarship);
            }
          }

          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      } catch (error) {
        errors.push(`Failed to process ${searchUrl}: ${error}`);
      }
    }
  } finally {
    await browser.close();
  }

  return { scholarships, errors };
}

export function mapScrapedToPrisma(scraped: ScrapedScholarship) {
  return {
    title: scraped.title,
    slug: slugify(scraped.title),
    shortTitle: scraped.title.length > 80 ? scraped.title.slice(0, 77) + "..." : undefined,
    description: scraped.description,
    shortDescription: scraped.description.slice(0, 400),
    universityNameLegacy: scraped.university,
    countryNameLegacy: scraped.country,
    region: scraped.country,
    fundingType: scraped.fundingType.toUpperCase().replace(/-/g, "_") as any,
    isFullyFunded: scraped.fundingType === "fully-funded",
    currency: scraped.fundingAmount?.match(/[A-Z]{3}/)?.[0] || "USD",
    tuitionCoverage: scraped.tuitionCoverage,
    accommodationCoverage: scraped.accommodationCoverage,
    travelAllowance: scraped.travelAllowance,
    monthlyStipend: scraped.livingAllowance ? parseFloat(scraped.livingAllowance.replace(/[^\d.]/g, "")) : null,
    eligibleCountries: scraped.nationalityRequirements.length > 0 ? scraped.nationalityRequirements : ["All"],
    nationalityRestrictions: [],
    degreeLevels: scraped.studyLevels,
    fieldLabels: scraped.fields,
    minGpa: null,
    openingDate: scraped.openingDate,
    deadline: scraped.deadline,
    duration: "Not Specified",
    numAwards: scraped.numberOfAwards,
    languageReqs: scraped.englishRequirements.length > 0 ? scraped.englishRequirements : ["Not Specified"],
    documentsRequired: ["Transcripts", "CV/Resume", "Personal Statement", "References", "Language Test Scores"],
    applicationProcess: ["Check eligibility", "Prepare documents", "Apply for university admission", "Submit scholarship application", "Interview (if required)", "Await results"],
    applicationUrl: scraped.officialUrl,
    officialUrl: scraped.officialUrl,
    source: scraped.sourceUrl,
    verificationStatus: "VERIFICATION_NEEDED" as const,
    publishStatus: PublishStatus.DRAFT,
    intake: scraped.intake,
  };
}