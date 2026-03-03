import { useState, useEffect, useCallback } from "react";
import adminApi from "../api/adminApi";
import { mapUser, mapRoleToAPI } from "../utils/userUtils";

export default function useUsers() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

    // Pagination
    const [pageNumber, setPageNumber] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalCount, setTotalCount] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    // Filters
    const [filterRole, setFilterRole] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    const [searchKeyword, setSearchKeyword] = useState('');
    const [debouncedKeyword, setDebouncedKeyword] = useState('');

    // Modals & Selection states
    const [isActionOpen, setIsActionOpen] = useState(false);
    const [actionType, setActionType] = useState(''); // 'activate', 'deactivate', 'ban', 'verify'
    const [actionReason, setActionReason] = useState('');
    const [selectedUser, setSelectedUser] = useState(null);

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [createError, setCreateError] = useState('');
    const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [viewingUser, setViewingUser] = useState(null);

    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        role: 'Student'
    });

    const showToast = useCallback((message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
    }, []);

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const roleParam = filterRole === 'all' ? null : mapRoleToAPI(filterRole);
            const statusParam = filterStatus === 'all' ? null : (filterStatus === 'active');

            const res = await adminApi.getUsers({
                pageNumber,
                pageSize,
                role: roleParam,
                isActive: statusParam,
                keyword: debouncedKeyword
            });

            const data = res.data?.data;
            if (data) {
                setUsers(data.items.map(mapUser));
                setTotalCount(data.totalCount);
                setTotalPages(data.totalPages);
            }
        } catch {
            console.error("Failed to fetch users");
            setError("Failed to load users");
            showToast("Failed to load users", "error");
        } finally {
            setLoading(false);
        }
    }, [pageNumber, pageSize, filterRole, filterStatus, debouncedKeyword, showToast]);

    useEffect(() => {
        const handler = setTimeout(() => setDebouncedKeyword(searchKeyword), 400);
        return () => clearTimeout(handler);
    }, [searchKeyword]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const handleCreate = () => {
        setFormData({ fullName: '', email: '', password: '', role: 'Student' });
        setCreateError('');
        setIsCreateModalOpen(true);
    };

    const handleEdit = (user) => {
        setEditingUser(user);
        setFormData({
            fullName: user.name,
            email: user.email,
            password: '',
            role: mapRoleToAPI(user.role)
        });
        setIsUpdateModalOpen(true);
    };

    const handleDelete = (user) => {
        setSelectedUser(user);
        setIsDeleteModalOpen(true);
    };

    const handleViewDetail = (user) => {
        setViewingUser(user);
        setIsDetailModalOpen(true);
    };

    const submitCreate = async () => {
        setCreateError('');
        try {
            await adminApi.createUser({
                fullName: formData.fullName,
                email: formData.email,
                password: formData.password,
                role: formData.role
            });
            showToast(`User "${formData.fullName}" has been created successfully`, 'success');
            fetchUsers();
            setIsCreateModalOpen(false);
        } catch (err) {
            console.error('Failed to create user', err);
            const errorMsg = err.response?.data?.message ||
                err.response?.data?.errors?.[0] ||
                'Failed to create user';

            if (err.response?.status === 405) {
                setCreateError('Create user API is not implemented in backend yet. Please use registration flow.');
            } else {
                setCreateError(errorMsg);
            }
        }
    };

    const submitUpdate = async () => {
        try {
            const updateData = {
                fullName: formData.fullName,
                email: formData.email,
                role: formData.role
            };
            if (formData.password) {
                updateData.password = formData.password;
            }

            await adminApi.updateUser(editingUser.id, updateData);
            showToast(`User "${formData.fullName}" has been updated successfully`, 'success');
            fetchUsers();
            setIsUpdateModalOpen(false);
        } catch (err) {
            console.error('Failed to update user', err);
            if (err.response?.status === 405) {
                showToast('Update user API is not implemented in backend yet. Use Activate/Deactivate/Ban actions instead.', 'error');
            } else {
                showToast(err.response?.data?.message || 'Failed to update user', 'error');
            }
        }
    };

    const confirmDelete = async () => {
        try {
            await adminApi.deleteUser(selectedUser.id);
            showToast(`User "${selectedUser.name}" has been deleted successfully`, 'success');
            fetchUsers();
            setIsDeleteModalOpen(false);
        } catch (err) {
            console.error('Failed to delete user', err);
            if (err.response?.status === 405) {
                try {
                    await adminApi.banUser(selectedUser.id, 'Account deleted by admin');
                    showToast(`User "${selectedUser.name}" has been banned (delete API not available)`, 'success');
                    fetchUsers();
                    setIsDeleteModalOpen(false);
                } catch {
                    showToast('Failed to delete/ban user', 'error');
                }
            } else {
                showToast(err.response?.data?.message || 'Failed to delete user', 'error');
            }
        }
    };

    const handleAction = async (user, action) => {
        setSelectedUser(user);
        setActionType(action);
        setActionReason('');
        setIsActionOpen(true);
    };

    const confirmAction = async () => {
        if (!selectedUser) return;

        try {
            switch (actionType) {
                case 'activate':
                    await adminApi.activateUser(selectedUser.id);
                    showToast(`User "${selectedUser.name}" has been activated`, 'success');
                    break;
                case 'deactivate':
                    await adminApi.deactivateUser(selectedUser.id);
                    showToast(`User "${selectedUser.name}" has been deactivated`, 'success');
                    break;
                case 'ban':
                    await adminApi.banUser(selectedUser.id, actionReason || 'Violated community guidelines');
                    showToast(`User "${selectedUser.name}" has been banned`, 'success');
                    break;
                case 'verify':
                    await adminApi.verifyUser(selectedUser.id);
                    showToast(`User "${selectedUser.name}" has been verified`, 'success');
                    break;
                default:
                    break;
            }

            fetchUsers();
            setIsActionOpen(false);
        } catch (err) {
            console.error(`Failed to ${actionType} user`, err);
            showToast(err.response?.data?.message || `Failed to ${actionType} user`, 'error');
        }
    };

    return {
        users, loading, error, toast, setToast, showToast,
        pageNumber, setPageNumber, pageSize, totalCount, totalPages,
        filterRole, setFilterRole, filterStatus, setFilterStatus,
        searchKeyword, setSearchKeyword, debouncedKeyword,
        isActionOpen, setIsActionOpen, actionType, setActionType,
        actionReason, setActionReason, selectedUser, setSelectedUser,
        isCreateModalOpen, setIsCreateModalOpen, createError, setCreateError,
        isUpdateModalOpen, setIsUpdateModalOpen,
        isDeleteModalOpen, setIsDeleteModalOpen, isDetailModalOpen, setIsDetailModalOpen,
        editingUser, viewingUser, formData, setFormData,
        fetchUsers, handleCreate, handleEdit, handleDelete, handleViewDetail,
        submitCreate, submitUpdate, confirmDelete, handleAction, confirmAction
    };
}
