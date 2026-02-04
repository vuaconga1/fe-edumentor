import { Routes, Route } from 'react-router-dom';

import LandingLayout from '../layouts/LandingLayout';
import AdminLayout from '../layouts/AdminLayout';
import MentorLayout from '../layouts/MentorLayout';
import StudentLayout from '../layouts/StudentLayout';


import LandingPage from '../pages/landing/LandingPage';
import FAQPage from '../pages/landing/FAQPage';
import PrivacyPage from '../pages/landing/PrivacyPage';
import TermsPage from '../pages/landing/TermsPage';
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';
import VerifyEmail from '../pages/auth/VerifyEmail';
import AdminDashboard from '../pages/admin/Dashboard';
import AdminProfilePage from '../pages/admin/AdminProfilePage';
import EditAdminProfilePage from '../pages/admin/EditAdminProfilePage';
import UsersPage from '../pages/admin/UsersPage';
import ReportsPage from '../pages/admin/ReportsPage';
import CategoriesPage from '../pages/admin/CategoriesPage';
import TransactionsPage from '../pages/admin/TransactionsPage';
import OrdersPage from '../pages/admin/OrdersPage';
import RequestsPage from '../pages/admin/RequestsPage';
import ProposalsPage from '../pages/admin/ProposalsPage';
import HashtagsPage from '../pages/admin/HashtagsPage';
import CategoryHashtagsPage from '../pages/admin/CategoryHashtagsPage';
import ReviewsPage from '../pages/admin/ReviewsPage';
import WalletsPage from '../pages/admin/WalletsPage';
import PostsPage from '../pages/admin/PostsPage';
import CommentsPage from '../pages/admin/CommentsPage';
import MentorApplicationsPage from '../pages/admin/MentorApplicationsPage';
import ForgotPassword from '../pages/auth/ForgotPassword';
import ResetPassword from '../pages/auth/ResetPassword';
import ChangePassword from '../pages/auth/ChangePassword';

import StudentHome from '../pages/student/StudentHome';
import FindMentorPage from '../pages/student/FindMentorPage';
import Community from '../pages/common/Community';
import MessagingPage from '../pages/messaging/MessagingPage';
import WalletPage from '../pages/common/WalletPage';
import OrderHistoryPage from '../pages/student/OrderHistoryPage';
import MentorReviewsPage from '../pages/mentor/MentorReviewsPage';
import MentorProfilePage from '../pages/mentor/MentorProfilePage';
import MentorRequestsPage from '../pages/mentor/MentorRequestsPage';
import MentorOrdersPage from '../pages/mentor/MentorOrdersPage';
import StudentProfilePage from '../pages/student/StudentProfilePage';
import EditStudentProfilePage from '../pages/student/EditStudentProfilePage';
import EditMentorProfilePage from '../pages/mentor/EditMentorProfilePage';
import MentorDetailPage from '../pages/student/MentorDetailPage';
import MyRequestsPage from '../pages/student/MyRequestsPage';
import JoinGroupPage from '../pages/JoinGroupPage';

const AppRoutes = () => {
  return (
    <Routes>
      {/* Landing */}
      <Route path="/" element={<LandingLayout />}>
        <Route index element={<LandingPage />} />
        <Route path="faq" element={<FAQPage />} />
        <Route path="privacy" element={<PrivacyPage />} />
        <Route path="terms" element={<TermsPage />} />
      </Route>

      {/* Admin */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminDashboard />} />
        <Route path="profile" element={<AdminProfilePage />} />
        <Route path="profile/edit" element={<EditAdminProfilePage />} />
        <Route path="change-password" element={<ChangePassword />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="mentor-applications" element={<MentorApplicationsPage />} />
        <Route path="categories" element={<CategoriesPage />} />
        <Route path="category-hashtags" element={<CategoryHashtagsPage />} />
        <Route path="hashtags" element={<HashtagsPage />} />
        <Route path="orders" element={<OrdersPage />} />
        <Route path="requests" element={<RequestsPage />} />
        <Route path="proposals" element={<ProposalsPage />} />
        <Route path="transactions" element={<TransactionsPage />} />
        <Route path="wallets" element={<WalletsPage />} />
        <Route path="reviews" element={<ReviewsPage />} />
        <Route path="posts" element={<PostsPage />} />
        <Route path="comments" element={<CommentsPage />} />
        <Route path="reports" element={<ReportsPage />} />
      </Route>

      {/* Mentor */}
      <Route path="/mentor" element={<MentorLayout />}>
        <Route path="community" element={<Community />} />
        <Route path="messaging" element={<MessagingPage />} />
        <Route path="wallet" element={<WalletPage />} />
        <Route path="orders" element={<MentorOrdersPage />} />
        <Route path="reviews" element={<MentorReviewsPage />} />
        <Route path="requests" element={<MentorRequestsPage />} />
        <Route path="profile" element={<MentorProfilePage />} />
        <Route path="profile/edit" element={<EditMentorProfilePage />} />
        <Route path="change-password" element={<ChangePassword />} />
      </Route>

      {/* Student */}
      <Route path="/student" element={<StudentLayout />}>
        <Route index element={<StudentHome />} />
        <Route path="profile" element={<StudentProfilePage />} />
        <Route path="profile/edit" element={<EditStudentProfilePage />} />
        <Route path="find-mentor" element={<FindMentorPage />} />
        <Route path="mentor/:id" element={<MentorDetailPage />} />
        <Route path="my-requests" element={<MyRequestsPage />} />
        <Route path="community" element={<Community />} />
        <Route path="messaging" element={<MessagingPage />} />
        <Route path="wallet" element={<WalletPage />} />
        <Route path="orders" element={<OrderHistoryPage />} />
        <Route path="change-password" element={<ChangePassword />} />
      </Route>

      {/* Group Invite */}
      <Route path="/groups/join/:inviteCode" element={<JoinGroupPage />} />

      {/* Auth */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/change-password" element={<ChangePassword />} />
    </Routes>
  );
};

export default AppRoutes;
