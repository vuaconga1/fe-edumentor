import React from 'react';
import MentorCard from '../mentor/MentorCard';
import mentorsData from '../../mock/mentors.json';

/**
 * MentorList - Component hiển thị danh sách mentor
 */
const MentorList = () => {
  const mentors = mentorsData.mentors || [];

  if (mentors.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">Không tìm thấy mentor nào.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {mentors.map((mentor) => (
        <MentorCard key={mentor.mentorId} mentor={mentor} />
      ))}
    </div>
  );
};

export default MentorList;
