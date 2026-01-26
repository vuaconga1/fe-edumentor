import React, { useState } from 'react';
import ReviewSummary from '../../components/review/ReviewSummary';
// import ReviewList from '../../components/review/ReviewList'; // Tạm thời render list trực tiếp hoặc sửa ReviewList để truyền prop
import ReviewCard from '../../components/review/ReviewCard';
import ReportModal from '../../components/review/ReportModal'; // Import Modal mới
import reviewsData from '../../mock/reviews.json';

const MentorReviewsPage = () => {
  const { averageRating, totalReviews, distribution, reviews } = reviewsData;
  
  // State quản lý Modal Report
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState(null);

  // Handler: Mở Modal
  const handleOpenReport = (review) => {
    setSelectedReview(review);
    setIsReportModalOpen(true);
  };

  // Handler: Xử lý Submit
  const handleSubmitReport = (data) => {
    console.log("Report Submitted:", data);
    // TODO: Gọi API gửi báo cáo về server
    // alert("Cảm ơn bạn đã báo cáo. Chúng tôi sẽ xem xét.");
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-white mb-2">
            Mentor Reviews
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400">
            See what students say about this mentor
          </p>
        </div>

        {/* Review Summary */}
        <div className="mb-8">
          <ReviewSummary
            averageRating={averageRating}
            totalReviews={totalReviews}
            distribution={distribution}
          />
        </div>

        {/* Reviews List */}
        <div>
          <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-4">
            Student Reviews
          </h2>
          
          {/* Render List trực tiếp hoặc update component ReviewList để truyền onReport */}
          <div className="space-y-4">
            {reviews.map((review) => (
              <ReviewCard 
                key={review.id} 
                review={review} 
                onReport={handleOpenReport} // Truyền hàm mở modal xuống card
              />
            ))}
          </div>
        </div>

        {/* REPORT MODAL */}
        <ReportModal 
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
          reviewId={selectedReview?.id}
          onSubmit={handleSubmitReport}
        />

      </div>
    </div>
  );
};

export default MentorReviewsPage;
