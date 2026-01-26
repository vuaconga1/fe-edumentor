import React from 'react';

const ProfileSection = ({ title, children, icon: Icon }) => {
  return (
    <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 shadow-sm border border-neutral-200 dark:border-neutral-800">
      <div className="flex items-center gap-2 mb-4">
        {Icon && <Icon size={20} className="text-blue-600 dark:text-blue-400" />}
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">
          {title}
        </h2>
      </div>
      <div className="text-gray-700 dark:text-gray-300">
        {children}
      </div>
    </div>
  );
};

export default ProfileSection;
