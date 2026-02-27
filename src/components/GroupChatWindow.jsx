import { useState, useEffect, useRef } from 'react';
import groupApi from "../api/groupApi";
import { joinGroupRoom, leaveGroupRoom, sendGroupMessage, on } from '../signalr/chatHub';
import { toast } from 'react-toastify';
import { Send, Users, Image as ImageIcon } from 'lucide-react';
import { formatTime } from '../utils/dateUtils';
import MessageBubble from './messaging/MessageBubble';

export default function GroupChatWindow({ groupId, onClose, onSendImage, currentUserId }) {
    const [group, setGroup] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [showImagePicker, setShowImagePicker] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [imageCaption, setImageCaption] = useState('');
    const [imagePreview, setImagePreview] = useState(null);
    const fileInputRef = useRef(null);

    // Cleanup image preview
    useEffect(() => {
        if (!selectedFile) {
            setImagePreview(null);
            return;
        }
        const url = URL.createObjectURL(selectedFile);
        setImagePreview(url);
        return () => URL.revokeObjectURL(url);
    }, [selectedFile]);

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
            toast.error('Failed to send message');
        }
    };

    if (loading) {
        return <div className="p-4">Loading...</div>;
    }

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="p-4 border-b flex items-center justify-between">
                <div>
                    <h2 className="font-bold text-lg">{group?.name}</h2>
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Users size={14} />
                        <span>{group?.memberCount} members</span>
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
                {messages.map((msg) => {
                    const isMine = msg.senderId === currentUserId || msg.isOwn;
                    return (
                        <MessageBubble
                            key={msg.id}
                            message={msg}
                            isMine={isMine}
                        />
                    );
                })}
            </div>

            {/* Input */}
            <div className="p-4 border-t relative">
                {/* Image Modal */}
                {showImagePicker && (
                    <div className="absolute bottom-full left-0 right-0 bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800 shadow-lg p-4 z-10">
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="font-semibold text-neutral-900 dark:text-white">Send image</h3>
                            <button
                                onClick={() => {
                                    setShowImagePicker(false);
                                    setSelectedFile(null);
                                    setImageCaption('');
                                    if (fileInputRef.current) fileInputRef.current.value = '';
                                }}
                                className="text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
                            >
                                ✕
                            </button>
                        </div>
                        
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={(e) => setSelectedFile(e.target.files?.[0])}
                            className="hidden"
                        />
                        
                        {!selectedFile ? (
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full py-8 border-2 border-dashed border-neutral-300 dark:border-neutral-700 rounded-lg hover:border-blue-500 dark:hover:border-blue-500 transition-colors"
                            >
                                <ImageIcon className="w-8 h-8 mx-auto mb-2 text-neutral-400" />
                                <p className="text-sm text-neutral-600 dark:text-neutral-400">Click to select image</p>
                            </button>
                        ) : (
                            <div className="space-y-3">
                                <div className="relative">
                                    <img src={imagePreview} alt="Preview" className="w-full h-48 object-cover rounded-lg" />
                                    <button
                                        onClick={() => {
                                            setSelectedFile(null);
                                            if (fileInputRef.current) fileInputRef.current.value = '';
                                        }}
                                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                                    >
                                        ✕
                                    </button>
                                </div>
                                <input
                                    type="text"
                                    value={imageCaption}
                                    onChange={(e) => setImageCaption(e.target.value)}
                                    placeholder="Add caption (optional)..."
                                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-neutral-800 dark:border-neutral-700"
                                />
                                <button
                                    onClick={() => {
                                        if (selectedFile && onSendImage) {
                                            onSendImage({ file: selectedFile, desc: imageCaption });
                                            setShowImagePicker(false);
                                            setSelectedFile(null);
                                            setImageCaption('');
                                            if (fileInputRef.current) fileInputRef.current.value = '';
                                        }
                                    }}
                                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                >
                                    Send image
                                </button>
                            </div>
                        )}
                    </div>
                )}

                <form onSubmit={handleSendMessage} className="flex gap-2">
                    <button
                        type="button"
                        onClick={() => setShowImagePicker(!showImagePicker)}
                        className="h-10 w-10 rounded-xl border border-neutral-300 dark:border-neutral-700
                                 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition flex items-center justify-center"
                    >
                        +
                    </button>
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-neutral-800 dark:border-neutral-700"
                    />
                    <button
                        type="submit"
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        disabled={!newMessage.trim()}
                    >
                        <Send size={20} />
                    </button>
                </form>
            </div>
        </div>
    );
}
