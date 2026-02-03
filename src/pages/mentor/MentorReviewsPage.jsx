import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import ReviewSummary from '../../components/review/ReviewSummary';
import ReviewCard from '../../components/review/ReviewCard';
import ReportModal from '../../components/review/ReportModal';
import reviewApi from '../../api/reviewApi';
import { normalizeAvatarUrl, buildDefaultAvatarUrl } from '../../utils/avatar';

const MentorReviewsPage = () => {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Summary data
  const [summary, setSummary] = useState({
    averageRating: 0,
    totalReviews: 0,
    distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  });

  // Reviews list
  const [reviews, setReviews] = useState([]);

  // Report modal state
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadReviews();
    }
  }, [user?.id]);

  const loadReviews = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError('');

      // Fetch summary and reviews in parallel
      const [summaryRes, reviewsRes] = await Promise.all([
        reviewApi.getMentorReviewSummary(user.id),
        reviewApi.getMentorReviews(user.id, { pageNumber: 1, pageSize: 50 })
      ]);

      // Process summary
      const summaryData = summaryRes?.data?.data;
      if (summaryData) {
        setSummary({
          averageRating: summaryData.averageRating || 0,
          totalReviews: summaryData.totalReviews || 0,
          distribution: {
            5: summaryData.fiveStarCount || 0,
            4: summaryData.fourStarCount || 0,
            3: summaryData.threeStarCount || 0,
            2: summaryData.twoStarCount || 0,
            1: summaryData.oneStarCount || 0
          }
        });
      }

      // Process reviews
      const reviewItems = reviewsRes?.data?.data?.items || [];
      const mappedReviews = reviewItems.map(r => ({
        id: r.id,
        studentId: r.studentId, // từ backend MentorReviewDto.StudentId
        studentName: r.studentName || 'Anonymous',
        studentAvatar: normalizeAvatarUrl(r.studentAvatar) || buildDefaultAvatarUrl({ fullName: r.studentName }),
        courseName: r.orderTitle || 'Mentoring Session',
        rating: r.rating,
        date: r.createdAt,
        comment: r.comment || '',
        tags: []
      }));

      setReviews(mappedReviews);
    } catch (e) {
      console.error('Load reviews failed:', e);
      setError('Failed to load reviews. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenReport = (review) => {
    setSelectedReview(review);
    setIsReportModalOpen(true);
  };

  const handleSubmitReport = async (data) => {
    if (!selectedReview) return;

    try {
      setReportLoading(true);

      await reviewApi.createReport({
        reportedUserId: selectedReview.studentId,
        reviewId: selectedReview.id,
        reason: data.reason,
        details: data.details
      });

      setIsReportModalOpen(false);
      setSelectedReview(null);
    } catch (e) {
      console.error('Submit report failed:', e);
      alert('Failed to submit report. Please try again.');
    } finally {
      setReportLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center">
        <p className="text-neutral-500 dark:text-neutral-400">Loading reviews...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 p-4 md:p-8">
        <div className="max-w-5xl mx-auto">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 text-red-600 dark:text-red-400">
            {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-white mb-2">
            My Reviews
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400">
            See what students say about your mentoring
          </p>
        </div>

        {/* Review Summary */}
        <div className="mb-8">
          <ReviewSummary
            averageRating={summary.averageRating}
            totalReviews={summary.totalReviews}
            distribution={summary.distribution}
          />
        </div>

        {/* Reviews List */}
        <div>
          <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-4">
            Student Reviews ({reviews.length})
          </h2>

          {reviews.length === 0 ? (
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-12 text-center">
              <p className="text-neutral-500 dark:text-neutral-400">
                No reviews yet. Complete some mentoring sessions to receive reviews!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <ReviewCard
                  key={review.id}
                  review={review}
                  onReport={handleOpenReport}
                />
              ))}
            </div>
          )}
        </div>

        {/* Report Modal */}
        <ReportModal
          isOpen={isReportModalOpen}
          onClose={() => {
            setIsReportModalOpen(false);
            setSelectedReview(null);
          }}
          reviewId={selectedReview?.id}
          onSubmit={handleSubmitReport}
          loading={reportLoading}
        />
      </div>
    </div>
  );
};

export default MentorReviewsPage;
