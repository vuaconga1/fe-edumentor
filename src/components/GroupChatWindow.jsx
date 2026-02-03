import { useState, useEffect } from 'react';
import groupApi from "../api/groupApi";
import { joinGroupRoom, leaveGroupRoom, sendGroupMessage, on } from '../signalr/chatHub';
import { toast } from 'react-toastify';
import { Send, Users } from 'lucide-react';

export default function GroupChatWindow({ groupId, onClose }) {
    const [group, setGroup] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!groupId) return;

        loadGroupData();
        loadMessages();
        joinGroupRoom(groupId);

        // Listen for new messages
        const unsubscribe = on('ReceiveGroupMessage', (message) => {
            if (message.groupId === groupId) {
                setMessages((prev) => [...prev, message]);
            }
        });

        return () => {
            leaveGroupRoom(groupId);
            unsubscribe();
        };
    }, [groupId]);

    const loadGroupData = async () => {
        try {
            const response = await groupApi.getGroup(groupId);
            if (response.success) {
                setGroup(response.data);
            }
        } catch (error) {
            console.error('Error loading group:', error);
        }
    };

    const loadMessages = async () => {
        try {
            const response = await groupApi.getGroupMessages(groupId);
            if (response.success) {
                setMessages(response.data.reverse()); // Reverse to show oldest first
            }
        } catch (error) {
            console.error('Error loading messages:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        try {
            await sendGroupMessage({
                groupId,
                content: newMessage,
                messageType: 0
            });
            setNewMessage('');
        } catch (error) {
            console.error('Error sending message:', error);
            toast.error('Không thể gửi tin nhắn');
        }
    };

    if (loading) {
        return <div className="p-4">Đang tải...</div>;
    }

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="p-4 border-b flex items-center justify-between">
                <div>
                    <h2 className="font-bold text-lg">{group?.name}</h2>
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Users size={14} />
                        <span>{group?.memberCount} thành viên</span>
                    </div>
                </div>
                {onClose && (
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        ✕
                    </button>
                )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((msg) => (
                    <div key={msg.id} className="flex gap-2">
                        <div className="w-8 h-8 rounded-full bg-gray-300 flex-shrink-0" />
                        <div>
                            <div className="flex items-baseline gap-2">
                                <span className="font-semibold text-sm">{msg.senderName}</span>
                                <span className="text-xs text-gray-500">
                                    {new Date(msg.createdAt).toLocaleTimeString('vi-VN', {
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </span>
                            </div>
                            <p className="text-sm mt-1">{msg.content}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Input */}
            <form onSubmit={handleSendMessage} className="p-4 border-t">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Nhập tin nhắn..."
                        className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                        type="submit"
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        disabled={!newMessage.trim()}
                    >
                        <Send size={20} />
                    </button>
                </div>
            </form>
        </div>
    );
}
