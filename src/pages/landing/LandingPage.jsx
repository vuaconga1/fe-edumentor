import { Link } from 'react-router-dom';
import { HiArrowRight } from 'react-icons/hi';
import { useEffect, useRef, useState } from 'react';

// Custom hook for scroll animation with parallax
const useScrollAnimation = (threshold = 0.1) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold, rootMargin: '0px 0px -100px 0px' }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [threshold]);

  return [ref, isVisible];
};

// Parallax scroll hook
const useParallax = () => {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return scrollY;
};

const LandingPage = () => {
  const scrollY = useParallax();
  const [heroRef, heroVisible] = useScrollAnimation();
  const [feature1Ref, feature1Visible] = useScrollAnimation(0.2);
  const [feature2Ref, feature2Visible] = useScrollAnimation(0.2);
  const [feature3Ref, feature3Visible] = useScrollAnimation(0.2);
  const [feature4Ref, feature4Visible] = useScrollAnimation(0.2);
  const [ctaRef, ctaVisible] = useScrollAnimation(0.3);

  return (
    <div className="w-full overflow-hidden bg-white dark:bg-neutral-950 transition-colors duration-300">

      {/* Hero Section */}
      <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Animated gradient background */}
        <div className="absolute inset-0">
          <div
            className="absolute inset-0 bg-gradient-to-br from-primary-100 via-white to-sky-100 dark:from-primary-900/20 dark:via-neutral-950 dark:to-primary-900/10 transition-colors duration-300"
            style={{ transform: `translateY(${scrollY * 0.3}px)` }}
          />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary-200/40 dark:from-primary-900/30 via-transparent to-transparent" />

          {/* Floating orbs */}
          <div
            className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-400/20 dark:bg-primary-500/20 rounded-full blur-3xl animate-pulse"
            style={{ transform: `translate(${scrollY * 0.1}px, ${scrollY * -0.05}px)` }}
          />
          <div
            className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-sky-400/20 dark:bg-sky-500/20 rounded-full blur-3xl animate-pulse"
            style={{ animationDelay: '1s', transform: `translate(${scrollY * -0.1}px, ${scrollY * 0.05}px)` }}
          />
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary-500/10 dark:bg-primary-600/10 rounded-full blur-3xl"
            style={{ transform: `translate(-50%, -50%) scale(${1 + scrollY * 0.0005})` }}
          />
        </div>

        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none"
          style={{
            backgroundImage: `linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)`,
            backgroundSize: '64px 64px',
          }}
        />

        {/* Content */}
        <div
          ref={heroRef}
          className={`relative z-10 text-center px-6 max-w-5xl mx-auto transition-all duration-1000 ease-out ${heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-20'}`}
        >
          {/* Badge */}
          <div
            className={`inline-flex items-center gap-2 px-4 py-2 mb-8 rounded-full bg-primary-50 dark:bg-white/5 backdrop-blur-xl border border-primary-100 dark:border-white/10 transition-all duration-1000 delay-200 ${heroVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}
          >
            <span className="w-2 h-2 bg-primary-500 rounded-full animate-pulse" />
            <span className="text-sm text-primary-700 dark:text-neutral-300 font-medium">Next-gen mentoring platform</span>
          </div>

          {/* Main heading */}
          <h1 className={`text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold text-neutral-900 dark:text-white mb-8 leading-[0.95] tracking-tight transition-all duration-1000 delay-300 ${heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <span className="block">Learn from</span>
            <span className="block bg-gradient-to-r from-primary-600 via-sky-500 to-primary-400 bg-clip-text text-transparent pb-2">
              the very best
            </span>
          </h1>

          {/* Subtitle */}
          <p className={`text-lg md:text-xl text-neutral-600 dark:text-neutral-400 mb-12 max-w-2xl mx-auto leading-relaxed transition-all duration-1000 delay-500 ${heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            Connect directly with industry-leading experts.
            Get personalized mentoring for your career journey.
          </p>

          {/* CTA Button */}
          <div className={`flex flex-col sm:flex-row gap-4 justify-center transition-all duration-1000 delay-700 ${heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <Link
              to="/register"
              className="group relative inline-flex items-center justify-center gap-2 px-10 py-5 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-full font-semibold text-lg overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-primary-500/20"
            >
              <span className="relative z-10">Get Started</span>
              <HiArrowRight className="relative z-10 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* Feature 1 - Find Mentor */}
      <section
        id="features"
        ref={feature1Ref}
        className="relative py-32 lg:py-48 overflow-hidden"
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
            {/* Text Content */}
            <div className={`transition-all duration-1000 ${feature1Visible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-20'}`}>
              <span className="inline-block text-primary-600 dark:text-primary-400 font-semibold text-sm uppercase tracking-widest mb-4">Find Mentors</span>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-neutral-900 dark:text-white mb-6 leading-tight">
                Find the right guide
                <span className="block text-neutral-500">for your career</span>
              </h2>
              <p className="text-lg text-neutral-600 dark:text-neutral-400 mb-8 leading-relaxed">
                Discover hundreds of mentors from top companies. Filter by expertise,
                experience, and teaching style that fits you best.
              </p>
              <Link
                to="/student/find-mentor"
                className="group inline-flex items-center gap-2 text-primary-600 dark:text-primary-400 font-semibold hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
              >
                Explore mentors
                <HiArrowRight className="group-hover:translate-x-2 transition-transform" />
              </Link>
            </div>

            {/* Image with glass card */}
            <div className={`relative transition-all duration-1000 delay-200 ${feature1Visible ? 'opacity-100 translate-x-0 rotate-0' : 'opacity-0 translate-x-20 rotate-3'}`}>
              <div className="relative aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl shadow-primary-900/10 dark:shadow-none">
                <img
                  src="https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1200&q=80"
                  alt="Mentor and student discussing"
                  className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                {/* Glass card overlay */}
                <div className="absolute bottom-6 left-6 right-6 p-5 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20">
                  <div className="flex items-center gap-4">
                    <img
                      src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=facearea&facepad=2&w=80&h=80&q=80"
                      alt="Mentor"
                      className="w-12 h-12 rounded-full object-cover border-2 border-white/30"
                    />
                    <div>
                      <p className="text-white font-semibold">Your perfect mentor awaits</p>
                      <p className="text-neutral-200 text-sm">From Google, Meta, Amazon...</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Decorative elements */}
              <div className="absolute -top-8 -right-8 w-32 h-32 bg-primary-500/20 rounded-full blur-2xl" />
              <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-sky-500/20 rounded-full blur-2xl" />
            </div>
          </div>
        </div>
      </section>

      {/* Feature 2 - Community */}
      <section
        id="community"
        ref={feature2Ref}
        className="relative py-32 lg:py-48 overflow-hidden bg-neutral-50 dark:bg-neutral-900/50 transition-colors duration-300"
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
            {/* Image with 3D effect */}
            <div className={`relative order-2 lg:order-1 transition-all duration-1000 delay-200 ${feature2Visible ? 'opacity-100 translate-x-0 rotate-0' : 'opacity-0 -translate-x-20 -rotate-3'}`}>
              <div
                className="relative aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl shadow-primary-900/10 dark:shadow-none"
                style={{
                  transform: `perspective(1000px) rotateY(${feature2Visible ? 0 : -10}deg)`,
                  transition: 'transform 1s ease-out'
                }}
              >
                <img
                  src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80"
                  alt="Group of people learning together"
                  className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                {/* Floating glass cards */}
                <div className="absolute top-6 right-6 p-4 rounded-xl bg-white/10 backdrop-blur-xl border border-white/20 animate-float">
                  <p className="text-white text-sm font-medium">#ReactJS</p>
                  <p className="text-neutral-200 text-xs">Trending today</p>
                </div>
              </div>

              <div className="absolute -top-8 -left-8 w-32 h-32 bg-primary-500/20 rounded-full blur-2xl" />
            </div>

            {/* Text Content */}
            <div className={`order-1 lg:order-2 transition-all duration-1000 ${feature2Visible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-20'}`}>
              <span className="inline-block text-primary-600 dark:text-primary-400 font-semibold text-sm uppercase tracking-widest mb-4">Community</span>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-neutral-900 dark:text-white mb-6 leading-tight">
                A community
                <span className="block text-neutral-500">to share and learn</span>
              </h2>
              <p className="text-lg text-neutral-600 dark:text-neutral-400 mb-8 leading-relaxed">
                Join an active community with thousands of posts from mentors and learners.
                Ask questions, share experiences, grow together.
              </p>
              <Link
                to="/community"
                className="group inline-flex items-center gap-2 text-primary-600 dark:text-primary-400 font-semibold hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
              >
                Join community
                <HiArrowRight className="group-hover:translate-x-2 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Feature 3 - Messaging */}
      <section
        id="messaging"
        ref={feature3Ref}
        className="relative py-32 lg:py-48 overflow-hidden"
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
            {/* Text Content */}
            <div className={`transition-all duration-1000 ${feature3Visible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-20'}`}>
              <span className="inline-block text-primary-600 dark:text-primary-400 font-semibold text-sm uppercase tracking-widest mb-4">Messaging</span>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-neutral-900 dark:text-white mb-6 leading-tight">
                Connect directly
                <span className="block text-neutral-500">anytime, anywhere</span>
              </h2>
              <p className="text-lg text-neutral-600 dark:text-neutral-400 mb-8 leading-relaxed">
                Message mentors directly before booking a session.
                Discuss, ask questions, and build lasting mentor-mentee relationships.
              </p>
              <Link
                to="/messages"
                className="group inline-flex items-center gap-2 text-primary-600 dark:text-primary-400 font-semibold hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
              >
                Start chatting
                <HiArrowRight className="group-hover:translate-x-2 transition-transform" />
              </Link>
            </div>

            {/* Chat mockup with glass effect */}
            <div className={`relative transition-all duration-1000 delay-200 ${feature3Visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-20'}`}>
              <div className="relative">
                <img
                  src="https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=1200&q=80"
                  alt="Mentor consulting via video call"
                  className="w-full aspect-[4/3] object-cover rounded-3xl shadow-2xl shadow-primary-900/10 dark:shadow-none"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent rounded-3xl" />

                {/* Glass chat bubbles */}
                <div className="absolute bottom-32 left-6 max-w-[70%] p-4 rounded-2xl rounded-bl-md bg-white/10 backdrop-blur-xl border border-white/20">
                  <p className="text-white text-sm">Hi! How can I help you with your career path today?</p>
                </div>
                <div className="absolute bottom-6 right-6 max-w-[60%] p-4 rounded-2xl rounded-br-md bg-white/10 backdrop-blur-xl border border-white/20">
                  <p className="text-white text-sm">I'd like to ask about the path to becoming a Senior Developer</p>
                </div>
              </div>

              <div className="absolute -top-8 -right-8 w-32 h-32 bg-primary-500/20 rounded-full blur-2xl" />
            </div>
          </div>
        </div>
      </section>

      {/* Feature 4 - Payment */}
      <section
        id="payment"
        ref={feature4Ref}
        className="relative py-32 lg:py-48 overflow-hidden bg-neutral-50 dark:bg-neutral-900/50 transition-colors duration-300"
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
            {/* Image */}
            <div className={`relative order-2 lg:order-1 transition-all duration-1000 delay-200 ${feature4Visible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
              <div className="relative aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl shadow-primary-900/10 dark:shadow-none">
                <img
                  src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&w=1200&q=80"
                  alt="Secure payment"
                  className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                {/* Glass wallet card */}
                <div className="absolute bottom-6 left-6 right-6 p-5 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-white/90 text-sm">Your Wallet</span>
                    <span className="px-2 py-1 rounded-full bg-white/20 text-white text-xs">Secure</span>
                  </div>
                  <p className="text-white text-2xl font-bold">Escrow Protection</p>
                  <p className="text-white/80 text-sm mt-1">100% money-back guarantee</p>
                </div>
              </div>

              <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-primary-500/20 rounded-full blur-2xl" />
            </div>

            {/* Text Content */}
            <div className={`order-1 lg:order-2 transition-all duration-1000 ${feature4Visible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-20'}`}>
              <span className="inline-block text-primary-600 dark:text-primary-400 font-semibold text-sm uppercase tracking-widest mb-4">Payment</span>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-neutral-900 dark:text-white mb-6 leading-tight">
                Safe and
                <span className="block text-neutral-500">transparent</span>
              </h2>
              <p className="text-lg text-neutral-600 dark:text-neutral-400 mb-8 leading-relaxed">
                Payment system with Escrow protection.
                Money is only transferred to the mentor when you're satisfied with the session.
              </p>
              <Link
                to="/wallet"
                className="group inline-flex items-center gap-2 text-primary-600 dark:text-primary-400 font-semibold hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
              >
                Learn more
                <HiArrowRight className="group-hover:translate-x-2 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section
        ref={ctaRef}
        className="relative py-32 lg:py-48 overflow-hidden"
      >
        {/* Background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-b from-white via-primary-50 to-white dark:from-neutral-950 dark:via-primary-900/20 dark:to-neutral-950 transition-colors duration-300" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary-500/10 rounded-full blur-3xl pointer-events-none" />
        </div>

        <div className={`relative z-10 max-w-4xl mx-auto px-6 text-center transition-all duration-1000 ${ctaVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-20'}`}>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-neutral-900 dark:text-white mb-6 leading-tight">
            Ready to start
            <span className="block bg-gradient-to-r from-primary-600 to-sky-500 bg-clip-text text-transparent pb-2">your new journey?</span>
          </h2>
          <p className="text-lg text-neutral-600 dark:text-neutral-400 mb-12 max-w-2xl mx-auto">
            Join thousands of learners who found the right mentor and
            are growing their careers every day.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="group relative inline-flex items-center justify-center gap-2 px-10 py-5 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-full font-semibold text-lg overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-primary-500/20"
            >
              <span className="relative z-10">Create free account</span>
              <HiArrowRight className="relative z-10 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* Custom animation keyframes */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        html { scroll-behavior: smooth; }
      `}</style>
    </div>
  );
};

export default LandingPage;
