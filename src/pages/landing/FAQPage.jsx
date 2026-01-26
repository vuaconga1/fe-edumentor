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

const FAQPage = () => {
  const [openIndex, setOpenIndex] = useState(null);
  const [heroRef, heroVisible] = useScrollAnimation();
  const [contentRef, contentVisible] = useScrollAnimation();

  const faqs = [
    {
      q: 'What is EduMentor and how does it work?',
      a: 'EduMentor is a professional mentoring platform that connects learners with industry experts. You can browse mentor profiles, book one-on-one video sessions, and receive personalized guidance for your career development. Simply create an account, find a mentor that matches your goals, and schedule a session.'
    },
    {
      q: 'How do I sign up for an account?',
      a: 'Signing up takes less than 2 minutes. Click "Get Started" on our homepage, enter your email and create a password. You\'ll receive a verification email, and once confirmed, you can immediately start browsing mentors and booking sessions.'
    },
    {
      q: 'Is EduMentor free to use?',
      a: 'We offer a free Starter plan that lets you browse mentor profiles and access community features. For one-on-one mentoring sessions, you can choose from our affordable pricing plans starting at $19 per session, or subscribe to our Pro plan for better value.'
    },
    {
      q: 'How are mentors verified?',
      a: 'Every mentor undergoes a thorough verification process including identity verification, professional background checks, and skills assessment. We also display authentic reviews from previous mentees so you can make informed decisions.'
    },
    {
      q: 'Can I reschedule or cancel a session?',
      a: 'Yes, you can reschedule or cancel up to 24 hours before your scheduled session at no cost. For cancellations within 24 hours, our standard cancellation policy applies. We understand plans change, so we try to be as flexible as possible.'
    },
    {
      q: 'What happens during a mentoring session?',
      a: 'Sessions are conducted via video call and typically last 30-60 minutes. You can discuss career goals, get code reviews, practice interviews, or receive guidance on specific challenges. Each session is tailored to your needs.'
    },
    {
      q: 'Can I become a mentor?',
      a: 'Absolutely! If you have 3+ years of professional experience and expertise to share, we\'d love to have you. Apply through our "Become a Mentor" page, complete the verification process, and start earning while helping others grow.'
    },
    {
      q: 'What payment methods do you accept?',
      a: 'We accept all major credit cards (Visa, MasterCard, American Express), PayPal, and bank transfers. All payments are processed securely through our trusted payment partners.'
    },
    {
      q: 'What if I\'m not satisfied with a session?',
      a: 'Your satisfaction is our priority. If you\'re unhappy with a session, contact our support team within 48 hours. We offer a satisfaction guarantee and will work to resolve any issues, including providing credits or refunds when appropriate.'
    },
    {
      q: 'How do I contact support?',
      a: 'Our support team is available via email at support@edumentor.com or through the live chat on our website. Enterprise customers enjoy priority support with guaranteed response times. We typically respond within 24 hours.'
    }
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950">
      {/* Hero Section */}
      <section 
        ref={heroRef}
        className="relative pt-32 pb-20 overflow-hidden"
      >
        {/* Background decoration */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-1/4 w-72 h-72 bg-primary-100 dark:bg-primary-900/20 rounded-full blur-3xl opacity-60"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary-50 dark:bg-primary-900/10 rounded-full blur-3xl opacity-40"></div>
        </div>

        <div className={`relative z-10 max-w-4xl mx-auto px-4 text-center transition-all duration-1000 ${heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <span className="inline-block px-4 py-2 bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 text-sm font-medium rounded-full mb-6">
            Help Center
          </span>
          <h1 className="text-4xl md:text-6xl font-bold text-neutral-900 dark:text-white mb-6">
            Frequently Asked
            <span className="block text-primary-600 dark:text-primary-400">Questions</span>
          </h1>
          <p className="text-lg text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto">
            Everything you need to know about EduMentor. Can't find what you're looking for? 
            Feel free to contact our support team.
          </p>
        </div>
      </section>

      {/* FAQ Content */}
      <section 
        ref={contentRef}
        className="py-16 px-4"
      >
        <div className="max-w-3xl mx-auto">
          <div className="space-y-4">
            {faqs.map((faq, index) => {
              const isOpen = openIndex === index;
              return (
                <div
                  key={index}
                  className={`transition-all duration-500 ${contentVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}
                  style={{ transitionDelay: `${index * 50}ms` }}
                >
                  <button
                    onClick={() => setOpenIndex(isOpen ? null : index)}
                    className={`w-full text-left p-6 rounded-2xl transition-all duration-300 ${
                      isOpen 
                        ? 'bg-primary-50 dark:bg-primary-900/20 shadow-lg' 
                        : 'bg-neutral-50 dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <span className={`font-semibold transition-colors ${isOpen ? 'text-primary-600 dark:text-primary-400' : 'text-neutral-900 dark:text-white'}`}>
                        {faq.q}
                      </span>
                      <span className={`text-2xl font-light transition-transform duration-300 ${isOpen ? 'rotate-45 text-primary-600' : 'text-neutral-400'}`}>
                        +
                      </span>
                    </div>
                    <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-96 mt-4 opacity-100' : 'max-h-0 opacity-0'}`}>
                      <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
                        {faq.a}
                      </p>
                    </div>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="relative p-12 md:p-16 rounded-3xl overflow-hidden">
            {/* Gradient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-neutral-900 to-neutral-800 dark:from-neutral-800 dark:to-neutral-900"></div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary-600/20 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary-500/10 rounded-full blur-3xl"></div>

            <div className="relative z-10 text-center">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Still have questions?
              </h2>
              <p className="text-neutral-300 mb-8 max-w-xl mx-auto">
                Can't find the answer you're looking for? Our friendly support team is here to help.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <a 
                  href="mailto:support@edumentor.com"
                  className="px-8 py-4 bg-white text-neutral-900 font-semibold rounded-xl hover:bg-neutral-100 transition-all duration-300 hover:scale-105"
                >
                  Contact Support
                </a>
                <Link 
                  to="/#contact"
                  className="px-8 py-4 text-white font-semibold rounded-xl border border-white/20 hover:bg-white/10 transition-all duration-300"
                >
                  Send a Message
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default FAQPage;
