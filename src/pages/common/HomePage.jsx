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
              Nhanh chóng,<br />
              Đáng tin cậy,<br />
              <span className="text-blue-600">Kết nối Toàn cầu.</span>
            </h1>
            <p className="text-gray-600 mb-8 leading-relaxed">
              Mang lưới lớn các mentor-student hàng đầu của chúng tôi lớp vào thành phố, cùng cấp hỗ trợ học tập chuyên nghiệp và quản lý chuyển gia trong quy định hợp lý.
            </p>
            <div className="flex gap-4">
              <Link 
                to="/login" 
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Bắt đầu ngay
              </Link>
              <Link 
                to="/register" 
                className="border border-gray-300 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Đăng nhập
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

      {/* Partners Section */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-center text-gray-500 mb-8">Chúng tôi đã hợp tác với các công ty hàng đầu</p>
          <div className="flex justify-around items-center flex-wrap gap-8 opacity-60">
            <div className="text-gray-400 font-bold text-xl">UPS</div>
            <div className="text-gray-400 font-bold text-xl">FedEx</div>
            <div className="text-gray-400 font-bold text-xl">DHL</div>
            <div className="text-gray-400 font-bold text-xl">Amazon</div>
            <div className="text-gray-400 font-bold text-xl">Maersk</div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h3 className="text-blue-600 font-semibold mb-2">TÍNH NĂNG</h3>
            <h2 className="text-3xl font-bold mb-4">Lợi thế vượt trội bạn sẽ nhận được</h2>
            <p className="text-gray-600">Tự chuyên môn học tập của chúng tôi</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-6 rounded-xl hover:shadow-lg transition-shadow">
              <div className="bg-blue-100 w-14 h-14 rounded-lg flex items-center justify-center mb-4">
                <ShieldCheckIcon className="w-7 h-7 text-blue-600" />
              </div>
              <h4 className="text-xl font-bold mb-2">Thanh toán An toàn</h4>
              <p className="text-gray-600 text-sm">
                Ví escrow đảm bảo giao dịch, chi trả ngăn kín toàn thành
              </p>
            </div>
            <div className="p-6 rounded-xl hover:shadow-lg transition-shadow">
              <div className="bg-gray-800 w-14 h-14 rounded-lg flex items-center justify-center mb-4">
                <ClockIcon className="w-7 h-7 text-white" />
              </div>
              <h4 className="text-xl font-bold mb-2">Tinh thì Tư động</h4>
              <p className="text-gray-600 text-sm">
                Hệ thống tự động tính phí mỗi nửa 15k + theo giờ
              </p>
            </div>
            <div className="p-6 rounded-xl hover:shadow-lg transition-shadow">
              <div className="bg-green-100 w-14 h-14 rounded-lg flex items-center justify-center mb-4">
                <StarIcon className="w-7 h-7 text-green-600" />
              </div>
              <h4 className="text-xl font-bold mb-2">Đánh giá Minh bạch</h4>
              <p className="text-gray-600 text-sm">
                Hệ thống đánh giá 2 chiều sau mỗi buổi học
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Dịch vụ của chúng tôi</h2>
            <p className="text-gray-600">
              Trải nghiệm sự đa dạng trong kết nối với mentor miễn phí. Chúng tôi xử lý tất cả các bước từ kết nối, lịch hẹn, thanh toán và giao hàng delivery.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-shadow">
              <img 
                src="https://images.unsplash.com/photo-1509062522246-3755977927d7?w=400&h=250&fit=crop" 
                alt="Kết nối Mentor" 
                className="w-full h-48 object-cover"
              />
              <div className="p-6">
                <div className="flex items-center gap-2 mb-3">
                  <AcademicCapIcon className="w-6 h-6 text-blue-600" />
                  <h4 className="text-xl font-bold">Kết nối Mentor</h4>
                </div>
                <p className="text-gray-600 text-sm">
                  Tìm kiếm và kết nối với mentor phù hợp để học tập chuyên môn và nhận bảo đặn hàn
                </p>
              </div>
            </div>
            <div className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-shadow">
              <img 
                src="https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=400&h=250&fit=crop" 
                alt="Chat Thời gian thực" 
                className="w-full h-48 object-cover"
              />
              <div className="p-6">
                <div className="flex items-center gap-2 mb-3">
                  <ChatBubbleLeftRightIcon className="w-6 h-6 text-blue-600" />
                  <h4 className="text-xl font-bold">Chat Thời gian thực</h4>
                </div>
                <p className="text-gray-600 text-sm">
                  Giao tiếp trực tiếp, thương thảo và hỏi đáp, trao cơ hội học tập
                </p>
              </div>
            </div>
            <div className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-shadow">
              <img 
                src="https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=400&h=250&fit=crop" 
                alt="Quản lý Lịch học" 
                className="w-full h-48 object-cover"
              />
              <div className="p-6">
                <div className="flex items-center gap-2 mb-3">
                  <CalendarDaysIcon className="w-6 h-6 text-blue-600" />
                  <h4 className="text-xl font-bold">Quản lý Lịch học</h4>
                </div>
                <p className="text-gray-600 text-sm">
                  Đặt lịch học linh hoạt, quản lý thời gian học tập hiệu quả
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
              "Chúng tôi đã sử dụng dịch vụ từ năm ngoái. Hàng hóa của chúng tôi đến trong tình trạng hoàn hảo. Qua trình giao hàng trong suốt với trình diễn tâm lý mạnh, và thật giao nhận rất chuyên nghiệp."
            </blockquote>
            <div className="flex items-center justify-center gap-3">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                JC
              </div>
              <div className="text-left">
                <div className="font-bold">Jane Cooper</div>
                <div className="text-sm text-gray-500">CEO, Workcation</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-gradient-to-br from-gray-900 to-blue-900 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-4">
            Chúng tôi kết nối toàn cầu,<br />
            Sẵn sàng kết nối với chúng tôi?
          </h2>
          <p className="text-blue-200 mb-8">
            Đội ngũ của chúng tôi sẵn sàng 24/7 phục vụ kỳ tiêu cầu mentor của bạn bất cứ nơi đâu trên hành tinh.
          </p>
          <Link 
            to="/login" 
            className="inline-block bg-blue-600 text-white px-8 py-4 rounded-lg hover:bg-blue-700 transition-colors font-medium text-lg"
          >
            Bắt đầu ngay
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
              Nền tảng kết nối mentor - student hàng đầu Việt Nam. Nâm try sinh viên, phát triển và mentor cùa bạn theo đúng.
            </p>
          </div>
          <div>
            <h4 className="font-bold mb-4">Dịch vụ</h4>
            <ul className="space-y-2 text-gray-600 text-sm">
              <li><Link to="/student/find" className="hover:text-blue-600">Kết nối Mentor</Link></li>
              <li><Link to="/community" className="hover:text-blue-600">Chat Realtime</Link></li>
              <li><Link to="/mentor/schedule" className="hover:text-blue-600">Quản lý Lịch</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4">Hỗ trợ</h4>
            <ul className="space-y-2 text-gray-600 text-sm">
              <li><a href="#" className="hover:text-blue-600">Về chúng tôi</a></li>
              <li><a href="#" className="hover:text-blue-600">Liên hệ</a></li>
              <li><a href="#" className="hover:text-blue-600">Trợ giúp</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-6xl mx-auto mt-8 pt-8 border-t text-center text-gray-500 text-sm">
          © 2025 MentorConnect. All rights reserved.
        </div>
      </footer>

      {/* Test Links - Development Only */}
      <div className="fixed bottom-4 right-4 bg-white shadow-lg rounded-lg p-4 border border-gray-200">
        <div className="text-xs font-bold mb-2 text-gray-700">Test Routes:</div>
        <div className="flex flex-col gap-1 text-xs">
          <Link to="/admin" className="text-blue-600 hover:underline">Admin Dashboard</Link>
          <Link to="/mentor" className="text-blue-600 hover:underline">Mentor Dashboard</Link>
          <Link to="/student" className="text-blue-600 hover:underline">Student Dashboard</Link>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
