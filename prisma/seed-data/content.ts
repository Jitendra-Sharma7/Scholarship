export interface GuideData {
  slug: string;
  title: string;
  category: string;
  excerpt: string;
  readMinutes: number;
  updated: string;
  sections: { heading: string; body: string[] }[];
}

export interface PostData {
  slug: string;
  title: string;
  category: string;
  excerpt: string;
  author: string;
  published: string;
  readMinutes: number;
  sections: { heading: string; body: string[] }[];
}

export const guides: GuideData[] = [
  {
    slug: "how-to-find-fully-funded-scholarships",
    title: "How to Find Fully Funded Scholarships",
    category: "Scholarship Guides",
    excerpt:
      "A repeatable method for locating scholarships that cover tuition, living costs, and travel — and how to tell genuine full funding apart from partial awards.",
    readMinutes: 8,
    updated: "2026-09-01",
    sections: [
      {
        heading: "Start with the funding definition, not the headline",
        body: [
          "A scholarship advertised as fully funded may cover tuition only. Before you invest time in an application, establish exactly which costs the award pays: tuition, accommodation, a living stipend, travel, insurance, and research or equipment expenses.",
          "Listings that state a single lump-sum figure rarely describe the whole award. Look for a breakdown instead. If a provider publishes only an approximate value, treat that figure as an upper bound rather than a promise.",
        ],
      },
      {
        heading: "Work backwards from your deadline, not your target date",
        body: [
          "Most application cycles open eight to twelve months before the start of the academic year. Working forward from a start date leaves you searching for opportunities that are already closed.",
          "Build a calendar running backward from your intended start date. Mark the typical closing window for each country and level, then begin monitoring sources at least nine months ahead.",
        ],
      },
      {
        heading: "Prioritise official sources",
        body: [
          "Government and university websites are the most reliable places to confirm a program exists, since a third-party listing can be outdated without anyone removing it. Treat a scholarship as real only once you have located the awarding body's own page.",
          "Record the date you last confirmed the details. Programs change their funding, deadlines, and eligibility rules without notice, and an award verified a year ago may no longer exist in the same form.",
        ],
      },
      {
        heading: "Check what the application actually requires from you",
        body: [
          "Full funding usually carries heavier conditions than a partial award. Expect stronger academic thresholds, proof of financial need, and sometimes an interview or research proposal.",
          "Read the full eligibility criteria before drafting anything. Applying to a program you cannot satisfy on a technicality wastes the fee and the deadline slot.",
        ],
      },
    ],
  },
  {
    slug: "writing-a-strong-statement-of-purpose",
    title: "Writing a Strong Statement of Purpose",
    category: "Application Tips",
    excerpt:
      "How to structure a statement of purpose that answers what the committee is actually reading for, and the common mistakes that weaken an otherwise strong application.",
    readMinutes: 9,
    updated: "2026-09-01",
    sections: [
      {
        heading: "Answer the question the prompt sets",
        body: [
          "Committees provide the prompt for a reason. An essay that ignores the specific question and delivers a generic account of your ambition is easy to set aside, however well written it is.",
          "Re-read the prompt before you write and outline against it directly. If the prompt limits you to 500 words, every sentence must earn its place inside that limit.",
        ],
      },
      {
        heading: "Build around a single concrete thread",
        body: [
          "A focused story with specific detail is more persuasive than a broad summary of your entire academic history. Choose one experience, question, or project and follow it through.",
          "Use concrete particulars: what you built, what failed, what you changed, and what you would do differently. Admissions readers see many polished summaries of achievements; specificity is what stays with them.",
        ],
      },
      {
        heading: "Show how you think, not only what you achieved",
        body: [
          "Results matter, but the reasoning behind them matters more. Explaining why you chose a method, or why a failure taught you something specific, demonstrates the judgment a programme is trying to develop.",
          "Avoid the trophy narrative — a list of accomplishments with no reflection. Each achievement should reveal a trait you would bring to the programme.",
        ],
      },
      {
        heading: "Revise against a clear brief",
        body: [
          "Draft early and revise more than once. Read it aloud to catch sentences that do not survive being spoken, and cut anything that does not directly support your argument.",
          "Ask someone outside your field to read it. If they cannot summarise your thread in a sentence, the essay is not yet focused enough.",
        ],
      },
    ],
  },
  {
    slug: "ielts-vs-toefl-which-test",
    title: "IELTS vs TOEFL: Which Test Should You Take?",
    category: "Language Tests",
    excerpt:
      "A practical comparison of the two major English proficiency tests, including scoring differences, availability, and which programmes accept which test.",
    readMinutes: 6,
    updated: "2026-09-01",
    sections: [
      {
        heading: "They measure similar things on different scales",
        body: [
          "Both assess reading, writing, listening, and speaking, and both are accepted widely for study visa purposes. The difference that matters most in practice is how scores are scaled, since a raw score means nothing without knowing the target threshold.",
          "Check your target programme's stated minimum on its own scale. The same proficiency corresponds to a higher number on one test than the other, so comparing raw scores across tests is misleading.",
        ],
      },
      {
        heading: "Availability is often the deciding factor",
        body: [
          "Test centres for both exams are concentrated in larger cities. If you live far from a major centre, one of the two may simply not be reachable within your deadline.",
          "Book early regardless of which test you choose. Seats fill quickly near application deadlines, and a late test date can push you past a closing date even if the application itself is ready.",
        ],
      },
      {
        heading: "Some programmes accept only one",
        body: [
          "A number of institutions specify IELTS Academic, TOEFL iBT, or a named alternative such as PTE, and a few accept only one of them. Confirm before you register, paying for an examination that will not be accepted costs both money and weeks.",
          "Where a programme lists several accepted tests, choose the one that matches the test format you are strongest in rather than the one you think is more familiar.",
        ],
      },
    ],
  },
  {
    slug: "complete-guide-to-recommendation-letters",
    title: "Complete Guide to Recommendation Letters",
    category: "Application Tips",
    excerpt:
      "How to choose referees, what to give them, and how to follow up — the steps that turn a routine request into a letter that strengthens your application.",
    readMinutes: 7,
    updated: "2026-09-01",
    sections: [
      {
        heading: "Choose for specific knowledge, not seniority",
        body: [
          "The most useful referee is someone who can speak to a particular strength with evidence. A senior figure who has barely observed your work cannot do that, however impressive their title.",
          "Where the form asks for a mix — for example one academic and one professional referee — honour that combination rather than defaulting to two people from the same environment.",
        ],
      },
      {
        heading: "Give your referees everything they need",
        body: [
          "A referee writing from scratch will produce a generic letter. Provide your CV, the programme details, the application deadline, a short statement of the qualities the programme values, and a reminder of specific work they witnessed.",
          "Supply a draft of your statement of purpose where the form allows it, so the letter can reinforce rather than repeat your application.",
        ],
      },
      {
        heading: "Follow up before the deadline, not after",
        body: [
          "Letters are a frequent cause of incomplete applications. Ask your referees to confirm they have received the materials, then check in again roughly two weeks before the deadline.",
          "Agree a submission date with each referee explicitly, and leave yourself enough time to follow up if a letter has not arrived.",
        ],
      },
    ],
  },
  {
    slug: "how-to-prepare-for-scholarship-interviews",
    title: "How to Prepare for Scholarship Interviews",
    category: "Interviews",
    excerpt:
      "What scholarship interview panels typically look for, how to prepare answers about your motivation and your weaknesses, and what to ask them.",
    readMinutes: 7,
    updated: "2026-09-01",
    sections: [
      {
        heading: "Panels test reasoning, not memorised statements",
        body: [
          "Expect to discuss the content of your written application, in depth. A panel that asks you to explain a decision in your statement of purpose is testing whether you wrote it and understood it.",
          "Prepare explanations for every claim in your written materials, including anything you presented as a group achievement.",
        ],
      },
      {
        heading: "Rehearse your motivation specifically",
        body: [
          "A vague answer about wanting to study abroad will not distinguish you. State what about this particular programme — a course, a laboratory, a supervisor — made you apply there rather than elsewhere.",
          "Be able to say what you would do with the opportunity, and what you would contribute in return.",
        ],
      },
      {
        heading: "Prepare for questions about weaknesses",
        body: [
          "Questions about a weak grade, a gap in your study, or a failed project are common. Answer directly, explain the circumstances briefly, and describe what you changed as a result.",
          "Deflection reads as evasion. A measured account of a setback usually strengthens an application rather than weakening it.",
        ],
      },
      {
        heading: "Use the questions you ask",
        body: [
          "Prepare two or three questions that show you have read the programme documentation. Asking what research the faculty are currently conducting is far stronger than asking about workload.",
          "This is also a chance to assess whether the programme fits you. Treat it as a two-way conversation.",
        ],
      },
    ],
  },
  {
    slug: "financial-aid-vs-scholarships",
    title: "Understanding Financial Aid vs Scholarships",
    category: "Financial Aid",
    excerpt:
      "The difference between scholarships, grants, bursaries, loans, and tuition waivers, and why the label on an award determines who is eligible to receive it.",
    readMinutes: 6,
    updated: "2026-09-01",
    sections: [
      {
        heading: "The labels encode the eligibility rules",
        body: [
          "A scholarship is usually awarded on merit, though it may also have a need component. A grant is almost always need-based and rarely repayable. A bursary is institutionally funded and commonly restricted to home or local students.",
          "A waiver removes a cost rather than giving you cash, and a loan must be repaid. Reading the label tells you which evidence you will need to provide.",
        ],
      },
      {
        heading: "Merit and need-based awards combine",
        body: [
          "Many programmes are described as need-aware, meaning you must satisfy an academic threshold and then demonstrate financial need. These usually require income documentation rather than a grade list alone.",
          "Gather proof of household income early. Requested documents are often country-specific and can take weeks to obtain.",
        ],
      },
      {
        heading: "Budget the full cost, not just tuition",
        body: [
          "Tuition is rarely the largest expense for an international student. Living costs, insurance, travel, and sometimes a compulsory deposit determine the real figure you must fund.",
          "Some countries require proof of funds for the visa that must come from your own savings, separate from any scholarship. Check the visa requirement independently of your award.",
        ],
      },
    ],
  },
  {
    slug: "common-scholarship-application-mistakes",
    title: "Common Scholarship Application Mistakes",
    category: "Common Mistakes",
    excerpt:
      "The errors that most often disqualify otherwise competitive applications, and how to avoid each one before you submit.",
    readMinutes: 6,
    updated: "2026-09-01",
    sections: [
      {
        heading: "Submitting after the deadline",
        body: [
          "This is the single most common reason for a lost application. Online portals close on the stated date and time, and do not accept late submissions regardless of circumstances.",
          "Submit at least several days early, and verify that the portal shows your submission as complete. A confirmation email is your evidence.",
        ],
      },
      {
        heading: "Failing the eligibility rules",
        body: [
          "Re-read the criteria against your own situation before investing effort. Age limits, citizenship conditions, year-of-study restrictions, and GPA thresholds are checked strictly and early.",
          "Where a criterion is ambiguous, contact the awarding body in writing and keep their reply. Do not assume a favourable interpretation.",
        ],
      },
      {
        heading: "Incomplete or inconsistent documents",
        body: [
          "A missing transcript, an expired language certificate, or a name spelled differently across documents will cause an application to be rejected or delayed.",
          "Use exactly the format requested, check certification and translation requirements, and ensure your name matches across every uploaded file.",
        ],
      },
      {
        heading: "Overlooking smaller conditions",
        body: [
          "Age ceilings, residency requirements, and restrictions on concurrent study are easy to skim past. They appear in the eligibility section, not the funding section.",
          "Read the entire page including footnotes. The disqualifying condition is rarely in the part you expect.",
        ],
      },
    ],
  },
  {
    slug: "student-visa-requirements-by-country",
    title: "Student Visa Requirements by Country",
    category: "Visa Information",
    excerpt:
      "An overview of the main student visa routes for popular study destinations, and the proof-of-funds and document requirements that commonly delay applications.",
    readMinutes: 8,
    updated: "2026-09-01",
    sections: [
      {
        heading: "The acceptance letter drives the process",
        body: [
          "Most student visa applications require an unconditional offer or an enrolment confirmation from a recognised institution before you can apply. The sequence is nearly always the same: apply to study, receive confirmation, then apply for the visa.",
          "Check whether your programme issues the specific document your visa route needs, and how quickly it is issued after enrolment.",
        ],
      },
      {
        heading: "Proof of funds is a separate requirement",
        body: [
          "Many destinations require you to demonstrate you can cover tuition and living costs personally. A scholarship letter sometimes satisfies this, but many authorities require funds held in your own name for a set period before applying.",
          "Where a blocked account is required, the deposit must sit in an account in the required form and is released to you only after enrolment. Check the current amount and holding period on the official immigration website.",
        ],
      },
      {
        heading: "Language and document certification",
        body: [
          "Visa applications commonly require certified translations of anything not in the local language, and sometimes a specific certificate format or a single-use code. A document accepted for a university may not satisfy immigration.",
          "Verify requirements on the official immigration site before arranging certified copies, since the cost and lead time of certification can be significant.",
        ],
      },
      {
        heading: "Apply with time to spare",
        body: [
          "Visa processing varies substantially by country and by the time of year, and embassies may require appointments weeks in advance. Do not book non-refundable travel or accommodation around an assumed visa date.",
          "Visa policy changes. Treat the information here as orientation and confirm every requirement on the official government website before you apply.",
        ],
      },
    ],
  },
];

export interface FaqItem {
  question: string;
  answer: string;
  category: string;
}

export const faqs: FaqItem[] = [
  {
    category: "About the Platform",
    question: "What is Global Scholarship Hub?",
    answer:
      "It is a discovery platform that brings together scholarship, grant, fellowship, tuition waiver, and financial aid opportunities from governments, universities, foundations, NGOs, and other organisations worldwide. We help you search, filter, compare, save, and track opportunities, and then direct you to the awarding body's own website to apply.",
  },
  {
    category: "About the Platform",
    question: "Do you accept applications on my behalf?",
    answer:
      "No. We do not award funding, administer scholarships, or process applications. Every application is submitted directly to the official website of the awarding organisation. Our role is to help you find credible opportunities and organise your search.",
  },
  {
    category: "About the Platform",
    question: "Is Global Scholarship Hub affiliated with any university or scholarship provider?",
    answer:
      "No. We are an independent information platform. A listing does not imply endorsement by, or any relationship with, the university or provider named. Provider names and logos remain the property of their respective owners.",
  },
  {
    category: "Trust and Verification",
    question: "What does the verification status mean?",
    answer:
      "Each listing shows whether we confirmed the details against an official source and when. Verified means we checked the record against the awarding body's own website on the date shown. Verification Needed means we have not yet confirmed it. Potentially Expired means the deadline has passed and we have not yet checked whether the programme is running again.",
  },
  {
    category: "Trust and Verification",
    question: "How current is the information?",
    answer:
      "Scholarship programmes change frequently. Deadlines are extended, funding is adjusted, and programmes are discontinued without notice. We record a last verified date on every listing, but you must confirm the details with the official provider before applying.",
  },
  {
    category: "Eligibility and Matching",
    question: "What does a match score mean?",
    answer:
      "A match score is an automated estimate based on the information you entered and the data we hold about a programme. It indicates how closely your stated circumstances resemble the published criteria. It is informational only and is never a determination of eligibility.",
  },
  {
    category: "Eligibility and Matching",
    question: "Does a high match score mean I am eligible?",
    answer:
      "No. Only the awarding organisation can determine your eligibility. A high score means the published criteria appear to match what you told us — it does not mean your application will succeed, that you will be shortlisted, or that you will be admitted.",
  },
  {
    category: "Eligibility and Matching",
    question: "Why does a listing say there is not enough information?",
    answer:
      "That means we do not hold enough of your profile details to assess the programme. Providing more information about your nationality, degree level, field, and grades produces a more useful match.",
  },
  {
    category: "Using the Platform",
    question: "How do I save and compare scholarships?",
    answer:
      "Use the Save button on any listing to add it to your saved list. Use Compare to place up to four opportunities side by side. The comparison shows objective information only, such as funding, coverage, deadline, and requirements, so you can make your own assessment.",
  },
  {
    category: "Using the Platform",
    question: "What is the application tracker for?",
    answer:
      "It lets you record each opportunity you are pursuing, set a status such as preparing or submitted, track required documents, and set reminders before deadlines. It is an organisational tool — you still submit your application on the provider's own website.",
  },
  {
    category: "Privacy",
    question: "How is my personal data handled?",
    answer:
      "Information you enter is used to generate matches and recommendations and to keep your saved items and tracker working. It is not published publicly and is not shared with scholarship providers unless you complete a form on a provider's own official website. Read our Privacy Policy and Cookie Policy for detail.",
  },
  {
    category: "Privacy",
    question: "How do I change my cookie choices?",
    answer:
      "Use the cookie settings control available on every page, or the manage consent link in the footer. You can accept all categories, keep only strictly necessary ones, or choose individually, and you can change your selection at any time.",
  },
  {
    category: "Privacy",
    question: "Is my profile visible to other users?",
    answer:
      "No. Your saved scholarships, application tracker, and profile are private to your account and are never shown publicly. Sponsored listings are labelled as such and never affect the ordering of organic results.",
  },
  {
    category: "Submitting and Advertising",
    question: "How do I submit a scholarship?",
    answer:
      "Use the submit a scholarship form to send us the programme name, awarding organisation, official website, application link, and deadline. Every submission enters an editorial review queue and is not published automatically. We verify the organisation and source before listing it.",
  },
  {
    category: "Submitting and Advertising",
    question: "Do you accept paid placement?",
    answer:
      "We support sponsored listings and partnerships, and they are always labelled. Paid placement can never change the ranking or ordering of organic search results, and being sponsored is not an indication that we have verified the opportunity.",
  },
];

export const guideCategories = Array.from(new Set(guides.map((g) => g.category)));

export const posts: PostData[] = [
  {
    slug: "reading-a-scholarship-listing-critically",
    title: "How to Read a Scholarship Listing Critically",
    category: "Application Tips",
    excerpt:
      "A five-minute check that catches most unreliable listings before you spend an evening on a doomed application.",
    author: "Global Scholarship Hub Editorial",
    published: "2026-09-10",
    readMinutes: 6,
    sections: [
      {
        heading: "Find the official source first",
        body: [
          "Before reading any detail, locate the awarding body's own page. If you cannot find a government, university, or provider website for the programme, that is the most important fact you have learned.",
          "Third-party listings are useful for discovery and unreliable as evidence. They are frequently copied, outdated, or filled in with placeholder values.",
        ],
      },
      {
        heading: "Treat suspiciously round numbers as a warning",
        body: [
          "Generic funding figures, vague eligibility criteria, and a missing deadline are all signs of a listing that was written from memory rather than from a source document.",
          "A real programme has specifics: a stated closing date, named documents, defined award criteria, and a contact point.",
        ],
      },
      {
        heading: "Check the deadline against the academic year",
        body: [
          "A deadline that does not correspond to a plausible intake is a strong signal. Confirm which academic year the programme funds, because a listing left over from a previous cycle will show an expired date with no explanation.",
        ],
      },
    ],
  },
  {
    slug: "organising-a-scholarship-search",
    title: "Organising a Scholarship Search That You Can Keep Up",
    category: "Scholarship Guides",
    excerpt:
      "Why large search lists fail, and a smaller system built around tiers, deadlines, and a fixed weekly review.",
    author: "Global Scholarship Hub Editorial",
    published: "2026-09-03",
    readMinutes: 7,
    sections: [
      {
        heading: "Tiers beat one long list",
        body: [
          "Saving forty opportunities you will never apply to produces no outcome. Sort everything into three tiers: apply this cycle, apply next cycle, and monitor only.",
          "Work the first tier properly instead of scanning all three. Most successful searches involve a small number of well-prepared applications rather than many rushed ones.",
        ],
      },
      {
        heading: "Anchor everything to the deadline",
        body: [
          "Organise your list by closing date, working backward from your intended start date. Your genuine deadline is several months before the provider's, because documents, references, and revisions take time.",
          "Set an internal deadline at least two weeks ahead of the official one.",
        ],
      },
      {
        heading: "Fix a weekly review",
        body: [
          "Block one recurring session to check new listings, verify what you have saved, and confirm nothing approaching has changed. Searching continuously produces more results and no progress.",
          "Verification is the part to keep: re-check every saved listing on your list at least once a term.",
        ],
      },
    ],
  },
  {
    slug: "understanding-scholarship-funding-types",
    title: "Understanding Scholarship Funding Types",
    category: "Financial Aid",
    excerpt:
      "Fully funded, partial tuition, stipend, and travel grant are not interchangeable. What each one actually leaves you to pay.",
    author: "Global Scholarship Hub Editorial",
    published: "2026-08-27",
    readMinutes: 6,
    sections: [
      {
        heading: "Fully funded still needs checking",
        body: [
          "The term is used loosely. Confirm whether it covers tuition, accommodation, a living stipend, travel, and insurance, or only some combination. A fully funded award that excludes living costs still requires a substantial personal budget.",
          "Check whether the funding is for the full duration of the programme or for an initial period with renewal conditions attached.",
        ],
      },
      {
        heading: "Partial awards compound",
        body: [
          "A tuition-only award of 50 per cent often leaves a gap larger than it appears once living costs, insurance, and travel are added. Model the remaining cost over the full programme length, not per year in isolation.",
          "Some applicants combine a partial award with savings or part-time work, which is permissible under some programmes and explicitly prohibited under others. Check.",
        ],
      },
      {
        heading: "Stipends may be conditional",
        body: [
          "A monthly living stipend is often tied to satisfactory academic progress, attendance, or enrolment status. Read the renewal conditions, and be clear about what happens if the award is suspended mid-programme.",
        ],
      },
    ],
  },
];

export const postCategories = Array.from(new Set(posts.map((p) => p.category)));
