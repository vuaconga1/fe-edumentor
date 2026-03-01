import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

// Animation hook
const useScrollAnimation = () => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true);
      },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return [ref, isVisible];
};

const PrivacyPage = () => {
  const [heroRef, heroVisible] = useScrollAnimation();
  const lastUpdated = 'January 1, 2026';

  const sections = [
    {
      title: 'Information We Collect',
      content: `When you use EduMentor, we collect information to provide and improve our services. This includes:

**Account Information** — Your name, email address, profile picture, and professional details when you create an account.

**Usage Data** — How you interact with our platform, including pages visited, features used, session duration, and device information.

**Payment Information** — Billing details processed securely by our payment partners. We never store complete credit card numbers.

**Communications** — Messages exchanged with mentors and our support team.`
    },
    {
      title: 'How We Use Your Information',
      content: `We use your information to:

**Deliver Our Services** — Create and manage your account, facilitate mentoring sessions, and process payments.

**Personalize Your Experience** — Recommend mentors and content based on your preferences and goals.

**Communicate With You** — Send service updates, security alerts, and relevant promotional content (you can opt out anytime).

**Ensure Safety** — Detect and prevent fraud, abuse, and security threats.

**Comply With Law** — Meet legal obligations and respond to lawful requests.`
    },
    {
      title: 'Information Sharing',
      content: `We respect your privacy and limit sharing to:

**Mentors & Mentees** — Relevant profile information to facilitate mentoring relationships.

**Service Providers** — Trusted partners who help operate our platform (payment processors, hosting, analytics).

**Legal Requirements** — When required by law or to protect rights and safety.

**Business Transfers** — In connection with mergers, acquisitions, or asset sales, with appropriate confidentiality protections.

We never sell your personal information to third parties.`
    },
    {
      title: 'Data Security',
      content: `We implement industry-standard security measures:

• SSL/TLS encryption for all data transmission
• Encrypted storage for sensitive information
• Regular security audits and penetration testing
• Strict access controls and authentication
• Employee training on data protection

While we work hard to protect your data, no system is 100% secure. We encourage you to use strong passwords and keep your account credentials safe.`
    },
    {
      title: 'Your Rights & Choices',
      content: `You have control over your data:

**Access & Update** — View and edit your information through account settings.

**Data Portability** — Request a copy of your data in a standard format.

**Deletion** — Request account and data deletion, subject to legal retention requirements.

**Marketing Opt-Out** — Unsubscribe from promotional emails anytime.

**Cookie Preferences** — Manage cookies through your browser or our consent tool.`
    },
    {
      title: 'Cookies & Tracking',
      content: `We use cookies to:

• Keep you logged in and remember preferences
• Analyze platform usage and improve features
• Deliver personalized content
• Measure marketing effectiveness

You can control cookies through your browser settings. Note that disabling certain cookies may affect your experience.`
    },
    {
      title: 'Data Retention',
      content: `We retain your information while your account is active or as needed to provide services. After deletion, we may retain certain data for:

• Legal compliance
• Dispute resolution
• Fraud prevention

Session recordings are kept for 90 days unless you request earlier deletion.`
    },
    {
      title: 'International Transfers',
      content: `EduMentor operates globally. Your data may be processed in countries with different privacy laws. We ensure appropriate safeguards through standard contractual clauses and other legal mechanisms.`
    },
    {
      title: 'Children\'s Privacy',
      content: `EduMentor is not intended for users under 16. We don't knowingly collect data from children. If you believe we have, please contact us immediately.`
    },
    {
      title: 'Changes to This Policy',
      content: `We may update this policy periodically. We'll notify you of significant changes via email or platform notice. Continued use after changes constitutes acceptance.`
    },
    {
      title: 'Contact Us',
      content: `Questions about privacy? Reach out:

    **Email:** nguyentranminhthu322@gmail.com

    **Email:** letrongtinnn@gmail.com

    **Address:** Ho Chi Minh City, Vietnam`
    }
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950">
      {/* Hero Section */}
      <section 
        ref={heroRef}
        className="relative pt-32 pb-20 overflow-hidden"
      >
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 right-1/4 w-72 h-72 bg-primary-100 dark:bg-primary-900/20 rounded-full blur-3xl opacity-60"></div>
          <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-primary-50 dark:bg-primary-900/10 rounded-full blur-3xl opacity-40"></div>
        </div>

        <div className={`relative z-10 max-w-4xl mx-auto px-4 text-center transition-all duration-1000 ${heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <span className="inline-block px-4 py-2 bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 text-sm font-medium rounded-full mb-6">
            Legal
          </span>
          <h1 className="text-4xl md:text-6xl font-bold text-neutral-900 dark:text-white mb-6">
            Privacy
            <span className="block text-primary-600 dark:text-primary-400">Policy</span>
          </h1>
          <p className="text-lg text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto mb-4">
            Your privacy matters to us. This policy explains how we collect, use, and protect your information.
          </p>
          <p className="text-sm text-neutral-500">Last updated: {lastUpdated}</p>
        </div>
      </section>

      {/* Content */}
      <section className="py-16 px-4">
        <div className="max-w-3xl mx-auto">
          {/* Quick summary */}
          <div className="p-6 bg-primary-50 dark:bg-primary-900/20 rounded-2xl mb-12">
            <h3 className="font-semibold text-neutral-900 dark:text-white mb-2">Quick Summary</h3>
            <p className="text-neutral-600 dark:text-neutral-400 text-sm leading-relaxed">
              We collect information to provide our mentoring platform. We don't sell your data. 
              You can access, update, or delete your information anytime. We use industry-standard 
              security to protect your data.
            </p>
          </div>

          {/* Sections */}
          <div className="space-y-12">
            {sections.map((section, index) => (
              <SectionBlock key={index} title={section.title} content={section.content} index={index} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

// Section component with animation
const SectionBlock = ({ title, content, index }) => {
  const [ref, isVisible] = useScrollAnimation();

  // Simple markdown-like parsing
  const parseContent = (text) => {
    return text.split('\n\n').map((paragraph, i) => {
      // Bold text
      const parts = paragraph.split(/\*\*(.*?)\*\*/g);
      return (
        <p key={i} className="text-neutral-600 dark:text-neutral-400 leading-relaxed mb-4 last:mb-0">
          {parts.map((part, j) => 
            j % 2 === 1 ? <strong key={j} className="text-neutral-900 dark:text-white font-medium">{part}</strong> : part
          )}
        </p>
      );
    });
  };

  return (
    <div 
      ref={ref}
      className={`transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}
      style={{ transitionDelay: `${index * 50}ms` }}
    >
      <div className="flex items-start gap-4 mb-4">
        <span className="flex-shrink-0 w-8 h-8 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-lg flex items-center justify-center text-sm font-bold">
          {index + 1}
        </span>
        <h2 className="text-xl font-bold text-neutral-900 dark:text-white pt-0.5">{title}</h2>
      </div>
      <div className="pl-12">
        {parseContent(content)}
      </div>
    </div>
  );
};

// Re-export animation hook for SectionBlock
const useScrollAnimation2 = () => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true);
      },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return [ref, isVisible];
};

export default PrivacyPage;
