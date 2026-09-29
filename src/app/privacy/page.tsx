import type { Metadata } from "next";
import { Container } from "@/components/layout/Layout";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How Global Scholarship Hub collects, uses, stores, and protects your personal data. Learn about your rights and how to control your information.",
};

export default function PrivacyPolicyPage() {
  const lastUpdated = "September 26, 2026";

  const sections = [
    {
      id: "introduction",
      title: "Introduction",
      paragraphs: [
        `At Global Scholarship Hub ("us", "we", "our" or the "Company"), we highly value your privacy and the importance of safeguarding your information. When you use our website and its services, you consent to share certain information with us. This information may include personal information relating to you. The term "Personal Data" used in this Policy refers to information such as your name, age, email address, and any other data relating to you as a person.`,
        `If you have any questions regarding the use of your Personal Data, please don't hesitate to contact us. We will gladly assist you.`,
      ],
    },
    {
      id: "scope",
      title: "Scope of this Policy",
      paragraphs: [
        `This Policy applies to Global Scholarship Hub' websites, domains, and services.`,
        `In this Policy, we discuss the basis of why we collect information and how we use it. We also explain how we collect, process, and disclose your information. Through this Policy, you'll have more knowledge on how you can protect or control your Personal Data.`,
        `We also connect to third-party websites or services. Please be reminded that information shared with third-party websites is not covered in this Policy. Hence, your information will be protected by the third-party websites' own Privacy Policies.`,
      ],
    },
    {
      id: "information-we-collect",
      title: "Information We Collect",
      paragraphs: [
        `To give you a more enhanced experience while using the website, we collect different types of information about you. In this section, we categorize the types of information we collect from you.`,
      ],
      subsections: [
        {
          title: "Technical Information",
          paragraphs: [
            `When you use or visit our website, we automatically record some technical information about you. With the help of this data, we are able to track your preferences and activities on the website.`,
          ],
        },
        {
          title: "Web Server Log Information",
          paragraphs: [
            `We automatically collect your device's IP address when you visit our website. Our servers record your device's information and activities on the website. This involves the collection of dates, locations, duration, and the source of your access to our website. We also track the web pages you've visited and other activities inside the website.`,
          ],
        },
        {
          title: "Cookies Information and Similar Technologies",
          paragraphs: [
            `When you visit our website, we send cookies — small text files that a website stores on your computer. Through cookies, we can record some of your activities on the website and we can also save your preferences.`,
          ],
        },
        {
          title: "Third-Party Ad Monetization",
          paragraphs: [
            `We may use third-party agencies to provide monetization technologies for our site. Where we do this, those agencies may set cookies on your device to measure advertising performance and, in some cases, deliver targeted advertising based on your prior browsing on this and other websites. You can review the applicable privacy and cookie policies on each provider's own privacy policy page.`,
          ],
        },
      ],
    },
    {
      id: "personal-data",
      title: "Personal Data",
      paragraphs: [
        `Aside from technical information, we may collect Personal Data about you. Please note that we need your permission before collecting this data from you.`,
        `If you want to receive information from us, you will need to share your Personal Data. For example, we send an email newsletter, and if you want to receive it, you need to provide your email address. You can unsubscribe at any time using the link in the footer of every email.`,
        `On the other hand, if you plan to contact us, we will be receiving your name, contact number, email address, or other educational information relevant to your question.`,
        `You may also choose to create an account and build a student profile. The information you provide in your profile — such as your country of citizenship, academic level, field of study, grades, and language test scores — is used only to generate scholarship matches and recommendations for you. It is not published publicly and is never shared with scholarship providers without your explicit action.`,
      ],
    },
    {
      id: "use-and-processing",
      title: "Use and Processing of Information",
      paragraphs: [
        `As we aim to provide the best resource for international students, we are committed to showing you content that's updated and relevant to you. By providing technical and personal data, we can do the following:`,
      ],
      list: [
        {
          title: "To provide more personalized content",
          text: `To help you achieve your academic goals, we use your Personal Data to give recommendations or suggestions when you're looking for courses, universities, or scholarships. We also use location information to show you options relevant to your studies.`,
        },
        {
          title: "To send email newsletters",
          text: `To keep you updated with scholarships, universities, and other educational content, we send an email newsletter. By providing your email address, we are able to send these newsletters. You can unsubscribe at any time.`,
        },
        {
          title: "To communicate with you",
          text: `When you reply to our posts, send queries, or use other forms of contacting us, we are able to reply and answer you.`,
        },
        {
          title: "To improve our website",
          text: `As we move towards our goal of being the best resource for international students, we strive to improve our website. Through your activities on the website, we can measure the quality of our posts, pages, and content. In that way, we are able to develop features and services that are useful for international students.`,
        },
      ],
      note: `Please be reminded that we don't knowingly collect information from children under the age of 13 years old. If you think that your child has subscribed to one of our email newsletters or campaigns, please contact us to help your child unsubscribe.`,
    },
    {
      id: "disclosure",
      title: "Disclosure of Information",
      paragraphs: [
        `We work with partner universities and organizations that publish scholarship opportunities. You can submit your personal details — such as name, email address, phone number, and interested degree and programs — through an electronic form on a partner's own website.`,
        `Once you submit that information and agree for us to send it to a partner university or organization, your information will be submitted directly to that partner institution. Once the data is submitted, it is processed by the individual university or organization under their privacy policy. We cannot be held responsible for how they process your data.`,
        `ScholarsorAtlas is an information platform. We do not accept applications on behalf of scholarship providers, and we do not transmit your Personal Data to a provider unless you complete a form on that provider's own official website.`,
      ],
    },
    {
      id: "security",
      title: "Security, Retention, and Deletion of Data",
      paragraphs: [
        `Your privacy is important to us and we highly value your Personal Data. As we strive to protect your confidentiality, we take various measures to ensure personal information is safely stored on our servers.`,
        `We store your information for 48 months after your last activity on our website. After that time period, we will consider deletion of your data.`,
        `If you wish to delete your Personal Data stored in our email database, you can unsubscribe from our email newsletter. You can also contact us and we will assist you in deleting your data so that all your data has been deleted if you wish.`,
      ],
    },
    {
      id: "your-rights",
      title: "Knowing Your Rights",
      paragraphs: [
        `Depending on your citizenship and location, your rights are subject to national law and regulations.`,
        `In general, you have the right to request access to the Personal Data collected by Global Scholarship Hub. This also includes the right to delete or edit your information stored on our website.`,
        `You can exercise these rights at any time by contacting us using the details in the Contact Us section below. We will respond to your request within 24–48 hours.`,
      ],
    },
    {
      id: "changes",
      title: "Changes and Updates to this Policy",
      paragraphs: [
        `We update our Privacy Policy from time to time. If we do, we will post these changes and update the "Last updated" date at the top of this page. We will notify you of material changes through an announcement on our website.`,
      ],
    },
  ];

  return (
    <div className="bg-gray-50/50 min-h-screen py-12">
      <Container size="md">
        {/* Header */}
        <div className="mb-10 text-center">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-950">Privacy Policy</h1>
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

                {/* Subsections */}
                {section.subsections?.map((sub) => (
                  <div key={sub.title}>
                    <h3 className="text-base font-semibold text-gray-900 mb-2">{sub.title}</h3>
                    {sub.paragraphs.map((paragraph, i) => (
                      <p key={i} className="text-sm text-gray-700 leading-relaxed">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                ))}

                {/* Numbered purpose list */}
                {section.list && (
                  <ul className="space-y-4">
                    {section.list.map((item, i) => (
                      <li key={item.title} className="flex gap-3">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-50 text-xs font-bold text-primary-700">
                          {i + 1}
                        </span>
                        <div>
                          <h3 className="text-sm font-semibold text-gray-900">{item.title}</h3>
                          <p className="mt-1 text-sm text-gray-700 leading-relaxed">{item.text}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}

                {/* Inline note */}
                {section.note && (
                  <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 leading-relaxed">
                    {section.note}
                  </p>
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
              If you have any questions or concerns about this Privacy Policy, feel free to contact
              us. The Global Scholarship Hub team will respond within 24–48 hours.
            </p>
            <a
              href="mailto:privacy@globalscholarshiphub.com"
              className="mt-4 inline-flex items-center rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-700"
            >
              privacy@globalscholarshiphub.com
            </a>
          </section>
        </div>
      </Container>
    </div>
  );
}
