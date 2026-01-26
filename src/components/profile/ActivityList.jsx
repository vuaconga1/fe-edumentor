import React from 'react';
import { Clock } from 'lucide-react';

const ActivityList = ({ activities = [] }) => {
  if (activities.length === 0) {
    return (
      <div className="text-center py-8 text-neutral-500 dark:text-neutral-400 text-sm">
        No recent activities
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {activities.map((activity, index) => (
        <div
          key={index}
          className="flex items-start gap-3 p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
        >
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
            {activity.text.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-neutral-900 dark:text-white text-sm mb-1">
              {activity.text}
            </h4>
            <p className="text-neutral-600 dark:text-neutral-400 text-xs mb-2">
              {activity.detail}
            </p>
            <div className="flex items-center gap-1 text-neutral-500 dark:text-neutral-500 text-xs">
              <Clock size={12} />
              <span>{activity.time}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ActivityList;
