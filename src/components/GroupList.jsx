import { useState, useEffect } from 'react';
import groupApi from "../api/groupApi";
import { toast } from 'react-toastify';
import { Users, Copy, Check } from 'lucide-react';

export default function GroupList({ onSelectGroup }) {
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [copiedCode, setCopiedCode] = useState(null);

    useEffect(() => {
        loadGroups();
    }, []);

    const loadGroups = async () => {
        try {
            const response = await groupApi.getMyGroups();
            if (response.success) {
                setGroups(response.data);
            }
        } catch (error) {
            console.error('Error loading groups:', error);
            toast.error('Failed to load groups');
        } finally {
            setLoading(false);
        }
    };

    const copyInviteCode = (inviteCode) => {
        const inviteLink = `${window.location.origin}/groups/join/${inviteCode}`;
        navigator.clipboard.writeText(inviteLink);
        setCopiedCode(inviteCode);
        toast.success('Invite link copied!');
        setTimeout(() => setCopiedCode(null), 2000);
    };

    if (loading) {
        return <div className="p-4 text-center">Loading...</div>;
    }

    return (
        <div className="space-y-2">
            {groups.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                    No groups yet
                </div>
            ) : (
                groups.map((group) => (
                    <div
                        key={group.id}
                        className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                        onClick={() => onSelectGroup(group)}
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <h3 className="font-semibold">{group.name}</h3>
                                {group.description && (
                                    <p className="text-sm text-gray-600 mt-1">{group.description}</p>
                                )}
                                <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                                    <Users size={14} />
                                    <span>{group.memberCount} members</span>
                                </div>
                            </div>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    copyInviteCode(group.inviteCode);
                                }}
                                className="p-2 hover:bg-gray-200 rounded"
                                title="Copy invite link"
                            >
                                {copiedCode === group.inviteCode ? (
                                    <Check size={16} className="text-green-600" />
                                ) : (
                                    <Copy size={16} />
                                )}
                            </button>
                        </div>
                    </div>
                ))
            )}
        </div>
    );
}
