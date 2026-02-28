import { Link } from 'react-router-dom';
import { 
  ShieldCheckIcon, 
  ClockIcon, 
  StarIcon,
  ChatBubbleLeftRightIcon,
  AcademicCapIcon,
  CalendarDaysIcon
} from '@heroicons/react/24/outline';

const HomePage = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 to-white py-20 px-6">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-5xl font-bold mb-4">
              Fast,<br />
              Reliable,<br />
              <span className="text-blue-600">Global Connections.</span>
            </h1>
            <p className="text-gray-600 mb-8 leading-relaxed">
              Our extensive network of top mentors and students brings professional learning support and expert guidance right to your city, all within a streamlined process.
            </p>
            <div className="flex gap-4">
              <Link 
                to="/login" 
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Get Started
              </Link>
              <Link 
                to="/register" 
                className="border border-gray-300 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Sign In
              </Link>
            </div>
          </div>
          <div>
            <img 
              src="https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&h=400&fit=crop" 
              alt="Team collaboration" 
              className="rounded-2xl shadow-lg w-full"
            />
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex justify-around items-center flex-wrap gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-blue-600">1000+</div>
              <div className="text-gray-500 text-sm mt-1">Students</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-blue-600">200+</div>
              <div className="text-gray-500 text-sm mt-1">Mentor</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-blue-600">50+</div>
              <div className="text-gray-500 text-sm mt-1">Fields</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-blue-600">98%</div>
              <div className="text-gray-500 text-sm mt-1">Satisfied</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h3 className="text-blue-600 font-semibold mb-2">FEATURES</h3>
            <h2 className="text-3xl font-bold mb-4">Outstanding advantages you will receive</h2>
            <p className="text-gray-600">Our professional learning expertise</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-6 rounded-xl hover:shadow-lg transition-shadow">
              <div className="bg-blue-100 w-14 h-14 rounded-lg flex items-center justify-center mb-4">
                <ShieldCheckIcon className="w-7 h-7 text-blue-600" />
              </div>
              <h4 className="text-xl font-bold mb-2">Secure Payments</h4>
              <p className="text-gray-600 text-sm">
                Escrow wallet ensures safe transactions with full payment protection
              </p>
            </div>
            <div className="p-6 rounded-xl hover:shadow-lg transition-shadow">
              <div className="bg-gray-800 w-14 h-14 rounded-lg flex items-center justify-center mb-4">
                <ClockIcon className="w-7 h-7 text-white" />
              </div>
              <h4 className="text-xl font-bold mb-2">Auto Billing</h4>
              <p className="text-gray-600 text-sm">
                Automatic billing system charges every 15 minutes based on hourly rate
              </p>
            </div>
            <div className="p-6 rounded-xl hover:shadow-lg transition-shadow">
              <div className="bg-green-100 w-14 h-14 rounded-lg flex items-center justify-center mb-4">
                <StarIcon className="w-7 h-7 text-green-600" />
              </div>
              <h4 className="text-xl font-bold mb-2">Transparent Reviews</h4>
              <p className="text-gray-600 text-sm">
                Two-way review system after each learning session
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Our Services</h2>
            <p className="text-gray-600">
              Experience diverse connections with mentors for free. We handle everything from matching, scheduling, payments and delivery.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-shadow">
              <img 
                src="https://images.unsplash.com/photo-1509062522246-3755977927d7?w=400&h=250&fit=crop" 
                alt="Mentor Connection" 
                className="w-full h-48 object-cover"
              />
              <div className="p-6">
                <div className="flex items-center gap-2 mb-3">
                  <AcademicCapIcon className="w-6 h-6 text-blue-600" />
                  <h4 className="text-xl font-bold">Mentor Connection</h4>
                </div>
                <p className="text-gray-600 text-sm">
                  Find and connect with the right mentor for professional learning and personalized guidance
                </p>
              </div>
            </div>
            <div className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-shadow">
              <img 
                src="https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=400&h=250&fit=crop" 
                alt="Real-time Chat" 
                className="w-full h-48 object-cover"
              />
              <div className="p-6">
                <div className="flex items-center gap-2 mb-3">
                  <ChatBubbleLeftRightIcon className="w-6 h-6 text-blue-600" />
                  <h4 className="text-xl font-bold">Real-time Chat</h4>
                </div>
                <p className="text-gray-600 text-sm">
                  Communicate directly, discuss and ask questions, creating learning opportunities
                </p>
              </div>
            </div>
            <div className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-shadow">
              <img 
                src="https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=400&h=250&fit=crop" 
                alt="Schedule Management" 
                className="w-full h-48 object-cover"
              />
              <div className="p-6">
                <div className="flex items-center gap-2 mb-3">
                  <CalendarDaysIcon className="w-6 h-6 text-blue-600" />
                  <h4 className="text-xl font-bold">Schedule Management</h4>
                </div>
                <p className="text-gray-600 text-sm">
                  Flexible scheduling and efficient time management for your learning
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonial Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="flex justify-center mb-4">
              {[...Array(5)].map((_, i) => (
                <StarIcon key={i} className="w-6 h-6 text-yellow-400 fill-yellow-400" />
              ))}
            </div>
            <blockquote className="text-gray-700 text-lg italic mb-6">
              "EduMentor helped me connect with the best mentors in programming. Thanks to their dedicated guidance, I became much more confident and landed my dream job in just 3 months."
            </blockquote>
            <div className="flex items-center justify-center gap-3">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                MT
              </div>
              <div className="text-left">
                <div className="font-bold">Minh Thư</div>
                <div className="text-sm text-gray-500">IT Student</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-gradient-to-br from-gray-900 to-blue-900 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-4">
            We connect globally,<br />
            Ready to connect with us?
          </h2>
          <p className="text-blue-200 mb-8">
            Our team is available 24/7 to serve your mentoring needs anywhere on the planet.
          </p>
          <Link 
            to="/login" 
            className="inline-block bg-blue-600 text-white px-8 py-4 rounded-lg hover:bg-blue-700 transition-colors font-medium text-lg"
          >
            Get Started
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white py-12 px-6 border-t">
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-blue-600 rounded-lg"></div>
              <span className="font-bold text-xl">EduMentor</span>
            </div>
            <p className="text-gray-600 text-sm">
              The leading mentor-student connection platform. Empowering students to grow and develop with the right mentor.
            </p>
          </div>
          <div>
            <h4 className="font-bold mb-4">Services</h4>
            <ul className="space-y-2 text-gray-600 text-sm">
              <li><Link to="/student/find" className="hover:text-blue-600">Mentor Connection</Link></li>
              <li><Link to="/community" className="hover:text-blue-600">Chat Realtime</Link></li>
              <li><Link to="/mentor/schedule" className="hover:text-blue-600">Schedule Management</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4">Support</h4>
            <ul className="space-y-2 text-gray-600 text-sm">
              <li><a href="#" className="hover:text-blue-600">About Us</a></li>
              <li><a href="#" className="hover:text-blue-600">Contact</a></li>
              <li><a href="#" className="hover:text-blue-600">Help Center</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-6xl mx-auto mt-8 pt-8 border-t text-center text-gray-500 text-sm">
          © {new Date().getFullYear()} EduMentor. All rights reserved.
        </div>
      </footer>


    </div>
  );
};

export default HomePage;
