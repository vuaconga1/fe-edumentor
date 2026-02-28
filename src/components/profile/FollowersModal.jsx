import React, { useState } from 'react';
import { X, Search, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const FollowersModal = ({ isOpen, onClose, followers = [], title = "Followers" }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const { user } = useAuth();

  if (!isOpen) return null;

  const basePath = user?.role === 'Mentor' || user?.role === 1 ? '/mentor' : '/student';

  const handleUserClick = (followerId) => {
    onClose();
    navigate(`${basePath}/user/${followerId}`);
  };

  // Filter followers based on search query
  const filteredFollowers = followers.filter((follower) =>
    follower.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRoleBadge = (role) => {
    if (role === 'mentor') {
      return (
        <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-xs font-medium rounded-full">
          Mentor
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-medium rounded-full">
        Student
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-neutral-900 w-full max-w-lg rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden transform transition-all">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-neutral-900 dark:to-neutral-900">
          <div className="flex items-center gap-2 text-neutral-900 dark:text-white">
            <Users size={20} />
            <h3 className="font-bold text-lg">{title}</h3>
            <span className="text-sm text-neutral-500 dark:text-neutral-400">
              ({followers.length})
            </span>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-neutral-400 hover:bg-white dark:hover:bg-neutral-800 hover:text-neutral-600 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-neutral-200 dark:border-neutral-800">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search ${title.toLowerCase()}...`}
              className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-neutral-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>
        </div>

        {/* Followers List */}
        <div className="max-h-96 overflow-y-auto p-4">
          {filteredFollowers.length > 0 ? (
            <div className="space-y-3">
              {filteredFollowers.map((follower) => (
                <div
                  key={follower.id}
                  onClick={() => handleUserClick(follower.id)}
                  className="flex items-center gap-3 p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                >
                  <img
                    src={follower.avatar}
                    alt={follower.name}
                    className="w-12 h-12 rounded-full object-cover border-2 border-white dark:border-neutral-700 shadow-sm"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-neutral-900 dark:text-white text-sm truncate">
                      {follower.name}
                    </h4>
                    <div className="mt-1">
                      {getRoleBadge(follower.role)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Users size={48} className="mx-auto text-neutral-300 dark:text-neutral-600 mb-3" />
              <p className="text-neutral-500 dark:text-neutral-400 text-sm">
                No followers found
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950/50">
          <button
            onClick={onClose}
            className="w-full py-2.5 text-sm font-semibold text-neutral-600 dark:text-neutral-300 bg-white dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-xl transition-colors border border-neutral-200 dark:border-neutral-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default FollowersModal;
