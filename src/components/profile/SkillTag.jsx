import React from 'react';

const SkillTag = ({ skill }) => {
  return (
    <span className="px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 text-blue-700 dark:text-blue-300 text-sm font-medium rounded-full border border-blue-200 dark:border-blue-800 hover:shadow-md hover:scale-105 transition-all cursor-default">
      {skill}
    </span>
  );
};

export default SkillTag;
