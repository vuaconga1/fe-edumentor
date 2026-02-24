import { useState } from 'react';
import groupApi from "../api/groupApi";
import { toast } from 'react-toastify';

export default function CreateGroupModal({ isOpen, onClose, onGroupCreated }) {
    const [formData, setFormData] = useState({
        name: ''
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.name.trim()) {
            toast.error('Vui lòng nhập tên nhóm');
            return;
        }

        setLoading(true);
        try {
            console.log('[CreateGroup] Sending request:', formData);
            const response = await groupApi.createGroup(formData);
            console.log('[CreateGroup] Response received:', response);
            console.log('[CreateGroup] Response.success:', response.success);
            console.log('[CreateGroup] Response.message:', response.message);
            console.log('[CreateGroup] Response.data:', response.data);
            
            if (response.success) {
              
                onGroupCreated(response.data);
                setFormData({ name: '' });
                onClose();
            } else {
                console.error('[CreateGroup] Failed with message:', response.message);
         
            }
        } catch (error) {
            console.error('[CreateGroup] EXCEPTION occurred:', error);
            console.error('[CreateGroup] Error.response:', error.response);
            console.error('[CreateGroup] Error.response.data:', JSON.stringify(error.response?.data, null, 2));
            console.error('[CreateGroup] Error.response.status:', error.response?.status);

            const msg = error.response?.data?.message || 'Đã xảy ra lỗi khi tạo nhóm';
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Tạo nhóm chat mới</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        ✕
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-2">
                            Tên nhóm <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Nhập tên nhóm"
                            maxLength={100}
                        />
                    </div>

                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                            disabled={loading}
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                            disabled={loading}
                        >
                            {loading ? 'Đang tạo...' : 'Tạo nhóm'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
