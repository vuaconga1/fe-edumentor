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

const TermsPage = () => {
  const [heroRef, heroVisible] = useScrollAnimation();
  const [activeSection, setActiveSection] = useState(null);
  const lastUpdated = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const sections = [
    {
      id: 'acceptance',
      title: 'Acceptance of Terms',
      content: `By accessing EduMentor, you agree to these Terms of Service. If you don't agree, please don't use our platform.

These Terms form a binding agreement between you and EduMentor Inc. We may update these Terms periodically, and continued use constitutes acceptance of changes.`
    },
    {
      id: 'services',
      title: 'Our Services',
      content: `EduMentor connects learners with expert mentors for professional development. Our services include:

• One-on-one video mentoring sessions
• Messaging and scheduling tools
• Payment processing
• Community features and resources

We don't guarantee specific outcomes from mentoring. Results depend on the effort and engagement of both parties.`
    },
    {
      id: 'accounts',
      title: 'User Accounts',
      content: `**Registration** — Provide accurate, current information when creating your account.

**Security** — You're responsible for your account credentials. Notify us immediately of unauthorized access.

**Termination** — We may suspend or terminate accounts for Terms violations, fraud, or at our discretion.`
    },
    {
      id: 'conduct',
      title: 'User Conduct',
      content: `You agree NOT to:

• Use the platform for illegal purposes
• Impersonate others or misrepresent yourself
• Upload malware or malicious code
• Harass, abuse, or harm other users
• Collect others' data without consent
• Circumvent security features
• Share account credentials
• Post false or misleading content

Violations may result in immediate account termination.`
    },
    {
      id: 'mentors',
      title: 'Mentor Requirements',
      content: `Mentors must:

• Provide accurate qualifications and experience
• Maintain professionalism in all interactions
• Honor scheduled sessions or give timely notice
• Protect mentee information
• Comply with professional standards
• Not solicit mentees outside the platform

We verify credentials and remove mentors who violate these requirements.`
    },
    {
      id: 'payments',
      title: 'Payments & Refunds',
      content: `**Pricing** — Displayed on our platform in USD. We may change prices with notice.

**Processing** — Payments handled by trusted third-party processors.

**Refunds** — 7-day money-back guarantee for first subscriptions. Session refunds considered case-by-case for technical issues or no-shows. Request within 48 hours.

**Mentor Payouts** — Per the Mentor Agreement schedule. Platform fees apply.`
    },
    {
      id: 'ip',
      title: 'Intellectual Property',
      content: `**Platform Content** — All content, logos, and software belong to EduMentor and are protected by law.

**Your Content** — You retain ownership but grant us license to use content you submit on the platform.

**Session Content** — Belongs to the creator. Recordings are jointly owned unless otherwise agreed.`
    },
    {
      id: 'disclaimers',
      title: 'Disclaimers',
      content: `The platform is provided "AS IS" without warranties. We don't guarantee:

• Uninterrupted or error-free service
• That defects will be corrected
• Specific results from mentoring
• That mentors' advice is accurate

Users interact with mentors at their own risk. We're not responsible for mentor actions or advice.`
    },
    {
      id: 'liability',
      title: 'Limitation of Liability',
      content: `To the maximum extent allowed by law, EduMentor isn't liable for indirect, incidental, special, or consequential damages.

Our total liability won't exceed what you paid us in the 12 months before your claim.`
    },
    {
      id: 'disputes',
      title: 'Dispute Resolution',
      content: `**First Step** — Contact us to resolve issues informally at nguyentranminhthu322@gmail.com.

**Arbitration** — Unresolved disputes go to binding arbitration under applicable rules.

**No Class Actions** — Disputes are resolved individually, not as class or representative actions.`
    },
    {
      id: 'governing',
      title: 'Governing Law',
      content: `These Terms are governed by the laws of Vietnam.`
    },
    {
      id: 'contact',
      title: 'Contact',
      content: `Questions about these Terms?

**Email:** nguyentranminhthu322@gmail.com
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
          <div className="absolute top-20 left-1/3 w-72 h-72 bg-primary-100 dark:bg-primary-900/20 rounded-full blur-3xl opacity-60"></div>
          <div className="absolute bottom-0 right-1/3 w-96 h-96 bg-primary-50 dark:bg-primary-900/10 rounded-full blur-3xl opacity-40"></div>
        </div>

        <div className={`relative z-10 max-w-4xl mx-auto px-4 text-center transition-all duration-1000 ${heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <span className="inline-block px-4 py-2 bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 text-sm font-medium rounded-full mb-6">
            Legal
          </span>
          <h1 className="text-4xl md:text-6xl font-bold text-neutral-900 dark:text-white mb-6">
            Terms of
            <span className="block text-primary-600 dark:text-primary-400">Service</span>
          </h1>
          <p className="text-lg text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto mb-4">
            Please read these terms carefully before using EduMentor.
          </p>
          <p className="text-sm text-neutral-500">Last updated: {lastUpdated}</p>
        </div>
      </section>

      {/* Two-column layout */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-[280px,1fr] gap-12">
            {/* Sticky sidebar - Table of Contents */}
            <div className="hidden lg:block">
              <div className="sticky top-24">
                <h3 className="text-sm font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-4">
                  Contents
                </h3>
                <nav className="space-y-1">
                  {sections.map((section, index) => (
                    <a
                      key={section.id}
                      href={`#${section.id}`}
                      onClick={() => setActiveSection(section.id)}
                      className={`block py-2 px-3 text-sm rounded-lg transition-all ${
                        activeSection === section.id
                          ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 font-medium'
                          : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-900 hover:text-neutral-900 dark:hover:text-white'
                      }`}
                    >
                      {index + 1}. {section.title}
                    </a>
                  ))}
                </nav>
              </div>
            </div>

            {/* Main content */}
            <div className="space-y-16">
              {/* Quick summary */}
              <div className="p-6 bg-primary-50 dark:bg-primary-900/20 rounded-2xl">
                <h3 className="font-semibold text-neutral-900 dark:text-white mb-2">Quick Summary</h3>
                <p className="text-neutral-600 dark:text-neutral-400 text-sm leading-relaxed">
                  By using EduMentor, you agree to these terms. Be respectful, don't misuse the platform, 
                  and understand that mentoring results vary. We provide the platform "as is" and aren't 
                  liable for mentor advice.
                </p>
              </div>

              {/* Sections */}
              {sections.map((section, index) => (
                <TermSection 
                  key={section.id} 
                  id={section.id}
                  title={section.title} 
                  content={section.content} 
                  index={index} 
                />
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

// Section component
const TermSection = ({ id, title, content, index }) => {
  const [ref, isVisible] = useScrollAnimation();

  const parseContent = (text) => {
    return text.split('\n\n').map((paragraph, i) => {
      const parts = paragraph.split(/\*\*(.*?)\*\*/g);
      return (
        <p key={i} className="text-neutral-600 dark:text-neutral-400 leading-relaxed mb-4 last:mb-0 whitespace-pre-line">
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
      id={id}
      className={`scroll-mt-24 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}
      style={{ transitionDelay: `${index * 30}ms` }}
    >
      <div className="flex items-center gap-3 mb-4">
        <span className="text-4xl font-bold text-primary-100 dark:text-primary-900/50">
          {String(index + 1).padStart(2, '0')}
        </span>
        <h2 className="text-xl font-bold text-neutral-900 dark:text-white">{title}</h2>
      </div>
      <div className="pl-14">
        {parseContent(content)}
      </div>
    </div>
  );
};

export default TermsPage;
