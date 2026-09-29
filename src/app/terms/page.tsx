import type { Metadata } from "next";
import { Container } from "@/components/layout/Layout";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "The terms and conditions governing your use of Global Scholarship Hub, including acceptable use, intellectual property, disclaimers, and limitation of liability.",
};

export default function TermsOfServicePage() {
  const lastUpdated = "September 26, 2026";

  const sections = [
    {
      id: "acceptance",
      title: "Acceptance of Terms",
      paragraphs: [
        `By accessing or using Global Scholarship Hub ("the Platform", "we", "us", or "our"), you agree to be bound by these Terms of Service. If you do not agree with any part of these terms, you must not use the Platform.`,
        `These Terms apply to all visitors, registered users, and organizations that access the Platform. If you are using the Platform on behalf of an institution or organization, you represent that you have the authority to accept these Terms on its behalf.`,
      ],
    },
    {
      id: "platform-nature",
      title: "Nature of the Platform",
      paragraphs: [
        `Global Scholarship Hub is an information and discovery platform. We compile, organize, and present publicly available information about scholarships, grants, fellowships, tuition waivers, and other education funding opportunities.`,
        `We are not a university, government body, scholarship provider, or educational institution. We do not award funding, do not administer scholarships, and do not accept, review, or process applications on behalf of any provider.`,
        `All applications are submitted directly to the official website of the relevant provider. We strongly encourage you to verify all information, requirements, and deadlines with the official source before applying.`,
      ],
    },
    {
      id: "information-accuracy",
      title: "Accuracy of Information",
      paragraphs: [
        `We work to keep scholarship information accurate, current, and sourced from official providers. However, scholarship programs change frequently — deadlines are extended, funding amounts are adjusted, eligibility rules are revised, and programs may be discontinued without notice.`,
        `We do not warrant that any information on the Platform is complete, accurate, current, or error-free. Each opportunity displays a verification status and a "last verified" date to indicate the extent of our review. A listing marked as verified reflects that we confirmed the record against an official source on that date; it is not a guarantee that the information remains accurate thereafter.`,
        `It is your sole responsibility to confirm all details — including eligibility, deadlines, funding amounts, required documents, and application procedures — directly with the official scholarship provider before submitting an application or making any financial commitment.`,
      ],
    },
    {
      id: "eligibility",
      title: "No Guarantee of Eligibility or Admission",
      paragraphs: [
        `Scholarship matches, recommendations, and match scores shown on the Platform are informational and automated. They are produced by a matching system based on the information you provide and the data we hold about a program.`,
        `A match does not mean you are eligible. It does not mean you will be shortlisted, admitted, awarded funding, or accepted to any institution. Only the official provider can make an eligibility determination, and only the relevant university or institution can make an admission decision.`,
        `Where you have not provided enough information for the system to assess a program, the Platform will indicate that there is not enough information rather than assume a match.`,
      ],
    },
    {
      id: "eligible-users",
      title: "Eligible Users and Accounts",
      paragraphs: [
        `You must be at least 13 years old to use this Platform. If you are between 13 and 17 years old, you must have the consent of a parent or legal guardian. Users under 13 are not permitted to create an account.`,
        `You are responsible for the accuracy of the information you provide in your profile, and for keeping your account credentials secure. You are solely responsible for all activity that occurs under your account.`,
        `You must be legally capable of entering into a binding agreement. If you do not meet this requirement, you may use the Platform only with the involvement and supervision of a parent or legal guardian.`,
        `We may suspend, limit, or terminate access to any account that we reasonably believe is being used fraudulently, to violate these Terms, or to infringe the rights of others.`,
      ],
    },
    {
      id: "acceptable-use",
      title: "Acceptable Use",
      paragraphs: [
        `When using the Platform, you agree not to:`,
      ],
      list: [
        "Use the Platform for any unlawful purpose or in violation of any applicable law or regulation.",
        "Submit false, misleading, or fraudulent information in your profile, applications, or scholarship submissions.",
        "Attempt to access, probe, or test the vulnerability of the Platform, or interfere with its proper operation.",
        "Scrape, crawl, harvest, or extract Platform content by automated means without our prior written permission.",
        "Republish, resell, or redistribute substantial portions of Platform content for commercial purposes without our written consent.",
        "Upload malware, or transmit malicious code of any kind.",
        "Impersonate any person or entity, or misrepresent your affiliation with a provider.",
        "Use the Platform to send unsolicited communications, or to harvest personal information from other users.",
      ],
    },
    {
      id: "intellectual-property",
      title: "Intellectual Property",
      paragraphs: [
        `The Platform, including its design, layout, code, databases, text, graphics, logos, and trademarks, is owned by Global Scholarship Hub or its licensors and is protected by intellectual property laws.`,
        `We grant you a limited, revocable, non-exclusive, non-transferable licence to access and use the Platform for your personal, non-commercial use. You may not copy, reproduce, modify, or distribute the Platform or its content without our prior written permission.`,
        `Scholarship names, logos, and programme names are the property of their respective providers. Their appearance on the Platform does not imply endorsement of, or affiliation with, Global Scholarship Hub.`,
      ],
    },
    {
      id: "third-party-links",
      title: "Third-Party Links and Providers",
      paragraphs: [
        `The Platform contains links to external websites operated by scholarship providers, universities, governments, and other organizations. We do not control these third-party websites and are not responsible for their content, accuracy, availability, or privacy practices.`,
        `Once you follow an external link and submit information on a third-party website, that information is governed by that provider's own privacy policy and terms. We strongly encourage you to review those documents before submitting any personal data.`,
        `A listing on the Platform is not an endorsement, recommendation, or guarantee of quality by Global Scholarship Hub. Inclusion of an opportunity does not imply that we have verified the provider beyond the checks described on the listing.`,
      ],
    },
    {
      id: "third-party-content",
      title: "User-Submitted Content",
      paragraphs: [
        `You may submit scholarship opportunities to us for review through our submission form. All user-submitted content is subject to editorial review before publication, and we may reject, edit, or remove any submission at our discretion.`,
        `By submitting content, you confirm that you have the right to submit it, that it is accurate, and that submitting it does not infringe the intellectual property rights of any third party. You grant us a non-exclusive licence to publish and display the content.`,
        `Scholarship details, including deadlines, funding amounts, and eligibility criteria, are controlled entirely by the issuing provider. We cannot guarantee that a provider will honour a program as previously described, and we are not responsible for any decision a provider makes regarding an application.`,
      ],
    },
    {
      id: "disclaimers",
      title: "Disclaimers",
      paragraphs: [
        `The Platform is provided on an "as is" and "as available" basis, without warranties of any kind, whether express or implied, including but not limited to implied warranties of merchantability, fitness for a particular purpose, accuracy, and non-infringement.`,
        `We do not warrant that the Platform will be uninterrupted, error-free, or that any information obtained through it will be accurate or current. You use the Platform at your own risk.`,
        `Nothing on the Platform constitutes professional, financial, legal, or immigration advice. Decisions about your education, funding, and immigration status should be made with qualified professional advisers.`,
      ],
    },
    {
      id: "liability",
      title: "Limitation of Liability",
      paragraphs: [
        `To the maximum extent permitted by applicable law, Global Scholarship Hub and its officers, directors, employees, and agents shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of data, loss of profits, or loss of opportunities, arising out of or in connection with your use of the Platform.`,
        `We are not liable for any loss or damage resulting from your reliance on information published on the Platform, from your inability to secure funding, or from any decision made by a scholarship provider or educational institution.`,
        `Where liability cannot be excluded by law, our total aggregate liability to you for all claims relating to the Platform is limited to the greater of the amount you paid us, if any, or one hundred United States dollars (US$100).`,
        `Nothing in these Terms excludes liability that cannot lawfully be excluded, including liability for fraud, wilful misconduct, or death or personal injury caused by negligence.`,
      ],
    },
    {
      id: "indemnity",
      title: "Indemnification",
      paragraphs: [
        `You agree to indemnify, defend, and hold harmless Global Scholarship Hub and its officers, directors, employees, and agents from and against any and all claims, damages, losses, liabilities, costs, and expenses — including reasonable legal fees — arising out of or related to your use of the Platform, your breach of these Terms, your violation of any law, or your infringement of any third-party right.`,
      ],
    },
    {
      id: "advertising",
      title: "Advertising and Sponsorship",
      paragraphs: [
        `The Platform may display sponsored listings and third-party advertising. Sponsored content is labelled as such and is visually distinct from organic scholarship information.`,
        `Paid placement does not alter, and must not be used to alter, the ranking or ordering of organic search results. Sponsored listings do not imply that we have verified the opportunity, and they are not a recommendation or endorsement.`,
      ],
    },
    {
      id: "modifications",
      title: "Modifications to the Platform and Terms",
      paragraphs: [
        `We reserve the right to modify, update, or discontinue any part of the Platform, including suspending or withdrawing features, at any time and without prior notice.`,
        `We also reserve the right to update these Terms from time to time. When we do, we will revise the "Last updated" date at the top of this page and post an announcement on the Platform. Your continued use of the Platform after changes take effect constitutes acceptance of the updated Terms.`,
      ],
    },
    {
      id: "termination",
      title: "Termination",
      paragraphs: [
        `You may stop using the Platform and delete your account at any time. Where account deletion is available, we will remove your profile and associated personal data in accordance with our Privacy Policy.`,
        `We may terminate or suspend your access to the Platform at our discretion, including where you breach these Terms. Upon termination, your right to use the Platform ceases immediately, and provisions that by their nature should survive termination — including limitation of liability and indemnification — will remain in effect.`,
      ],
    },
    {
      id: "governing-law",
      title: "Governing Law",
      paragraphs: [
        `These Terms are governed by and construed in accordance with the applicable laws of the jurisdiction in which Global Scholarship Hub is established, without regard to its conflict of law provisions.`,
        `Any dispute arising out of or in connection with these Terms will be subject to the exclusive jurisdiction of the competent courts of that jurisdiction. Nothing in this clause limits any mandatory consumer protections available to you under the law of your country of residence.`,
      ],
    },
  ];

  return (
    <div className="bg-gray-50/50 min-h-screen py-12">
      <Container size="md">
        {/* Header */}
        <div className="mb-10 text-center">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-950">
            Terms of Service
          </h1>
          <p className="mt-3 text-sm text-gray-500">Last updated: {lastUpdated}</p>
        </div>

        <div className="space-y-6">
          {sections.map((section) => (
            <section
              key={section.id}
              id={section.id}
              className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8 shadow-xs scroll-mt-24"
            >
              <h2 className="text-xl font-bold text-gray-900 mb-4">{section.title}</h2>

              <div className="space-y-4">
                {section.paragraphs?.map((paragraph, i) => (
                  <p key={i} className="text-sm text-gray-700 leading-relaxed">
                    {paragraph}
                  </p>
                ))}

                {/* Bullet list (acceptable use) */}
                {section.list && (
                  <ul className="space-y-2.5">
                    {section.list.map((item, i) => (
                      <li key={i} className="flex gap-3">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary-500" />
                        <span className="text-sm text-gray-700 leading-relaxed">{item}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
          ))}

          {/* Contact Us */}
          <section
            id="contact"
            className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8 shadow-xs scroll-mt-24"
          >
            <h2 className="text-xl font-bold text-gray-900 mb-4">Contact Us</h2>
            <p className="text-sm text-gray-700 leading-relaxed">
              If you have any questions or concerns about these Terms of Service, feel free to
              contact us. The Global Scholarship Hub team will respond within 24–48 hours.
            </p>
            <a
              href="mailto:legal@globalscholarshiphub.com"
              className="mt-4 inline-flex items-center rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-700"
            >
              legal@globalscholarshiphub.com
            </a>
          </section>
        </div>
      </Container>
    </div>
  );
}
