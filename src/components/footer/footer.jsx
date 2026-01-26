import { Link } from "react-router-dom";
import { HiMail, HiPhone, HiLocationMarker } from "react-icons/hi";

export default function AppFooter() {
  return (
    <footer className="bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white border-t border-neutral-200 dark:border-neutral-800 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-3 gap-12">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-6">
              <img src="/edumentor-logo.png" className="h-8 sm:h-10 transition-transform group-hover:scale-105" alt="EduMentor Logo" />
              <span className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-sky-500 bg-clip-text text-transparent">EduMentor</span>
            </div>
            <p className="text-neutral-600 dark:text-neutral-400 text-sm leading-relaxed mb-6">
              Empowering your career journey with guidance from industry-leading experts.
            </p>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-semibold mb-6 text-lg">Support</h4>
            <ul className="space-y-4">
              <li><Link to="/faq" className="text-neutral-500 dark:text-neutral-400 hover:text-primary-600 dark:hover:text-white transition-colors">FAQ</Link></li>
              <li><Link to="/privacy" className="text-neutral-500 dark:text-neutral-400 hover:text-primary-600 dark:hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms" className="text-neutral-500 dark:text-neutral-400 hover:text-primary-600 dark:hover:text-white transition-colors">Terms of Service</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-6 text-lg">Contact</h4>
            <ul className="space-y-4">
              <li className="flex items-center gap-3 text-neutral-500 dark:text-neutral-400">
                <HiMail className="text-lg text-primary-600 dark:text-primary-400" />
                <span>contact@edumentor.com</span>
              </li>
              <li className="flex items-center gap-3 text-neutral-500 dark:text-neutral-400">
                <HiPhone className="text-lg text-primary-600 dark:text-primary-400" />
                <span>+1 (555) 123-4567</span>
              </li>
              <li className="flex items-start gap-3 text-neutral-500 dark:text-neutral-400">
                <HiLocationMarker className="text-lg mt-1 text-primary-600 dark:text-primary-400" />
                <span>San Francisco, CA</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-neutral-200 dark:border-neutral-800 mt-16 pt-8 text-center text-neutral-500 text-sm">
          <p>&copy; {new Date().getFullYear()} EduMentor. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
