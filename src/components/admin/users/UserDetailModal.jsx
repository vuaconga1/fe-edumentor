import React from 'react';
import Modal from '../../admin/Modal';
import { HiShieldCheck } from 'react-icons/hi';
import { getRoleName } from '../../../utils/userRole';
import { getRoleColor, getStatusColor } from '../../../utils/userUtils';

export default function UserDetailModal({
    isOpen,
    onClose,
    viewingUser
}) {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="User Details"
        >
            {viewingUser && (
                <div className="space-y-4">
                    <div className="flex items-center gap-4 pb-4 border-b border-neutral-200 dark:border-neutral-800">
                        <img
                            src={viewingUser.avatar}
                            alt={viewingUser.name}
                            className="w-20 h-20 rounded-full object-cover"
                        />
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-xl font-semibold text-neutral-900 dark:text-white">{viewingUser.name}</h3>
                                {viewingUser.isVerified && (
                                    <HiShieldCheck className="w-5 h-5 text-blue-500" title="Verified" />
                                )}
                            </div>
                            <p className="text-neutral-500">{viewingUser.email}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-neutral-500 mb-1">User ID</label>
                            <p className="text-neutral-900 dark:text-white">{viewingUser.id}</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-neutral-500 mb-1">Role</label>
                            <span className={`inline-block px-2.5 py-1 text-xs font-medium rounded-full capitalize ${getRoleColor(viewingUser.role)}`}>
                                {getRoleName(viewingUser.role)}
                            </span>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-neutral-500 mb-1">Status</label>
                            <span className={`inline-block px-2.5 py-1 text-xs font-medium rounded-full capitalize ${getStatusColor(viewingUser.status)}`}>
                                {viewingUser.status}
                            </span>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-neutral-500 mb-1">Verified</label>
                            <p className="text-neutral-900 dark:text-white">{viewingUser.isVerified ? 'Yes' : 'No'}</p>
                        </div>
                        {viewingUser.phone && (
                            <div>
                                <label className="block text-sm font-medium text-neutral-500 mb-1">Phone</label>
                                <p className="text-neutral-900 dark:text-white">{viewingUser.phone}</p>
                            </div>
                        )}
                        {viewingUser.gender && (
                            <div>
                                <label className="block text-sm font-medium text-neutral-500 mb-1">Gender</label>
                                <p className="text-neutral-900 dark:text-white capitalize">{viewingUser.gender}</p>
                            </div>
                        )}
                        {viewingUser.school && (
                            <div>
                                <label className="block text-sm font-medium text-neutral-500 mb-1">School</label>
                                <p className="text-neutral-900 dark:text-white">{viewingUser.school}</p>
                            </div>
                        )}
                        {viewingUser.major && (
                            <div>
                                <label className="block text-sm font-medium text-neutral-500 mb-1">Major</label>
                                <p className="text-neutral-900 dark:text-white">{viewingUser.major}</p>
                            </div>
                        )}
                        {(viewingUser.city || viewingUser.country) && (
                            <div>
                                <label className="block text-sm font-medium text-neutral-500 mb-1">Location</label>
                                <p className="text-neutral-900 dark:text-white">{[viewingUser.city, viewingUser.country].filter(Boolean).join(', ')}</p>
                            </div>
                        )}
                        {viewingUser.bio && (
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-neutral-500 mb-1">Bio</label>
                                <p className="text-neutral-900 dark:text-white whitespace-pre-wrap">{viewingUser.bio}</p>
                            </div>
                        )}
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-neutral-500 mb-1">Joined Date</label>
                            <p className="text-neutral-900 dark:text-white">
                                {new Date(viewingUser.createdAt?.endsWith?.('Z') ? viewingUser.createdAt : viewingUser.createdAt + 'Z').toLocaleDateString('en-US', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </p>
                        </div>
                    </div>

                    <div className="flex justify-end pt-4 border-t border-neutral-200 dark:border-neutral-800">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </Modal>
    );
}
