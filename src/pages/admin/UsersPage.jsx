import React, { useEffect, useState } from 'react';
import { HiFilter, HiCheckCircle, HiXCircle, HiBan, HiShieldCheck } from 'react-icons/hi';
import DataTable from '../../components/admin/DataTable';
import ConfirmDialog from '../../components/admin/ConfirmDialog';
import Modal from '../../components/admin/Modal';
import adminApi from '../../api/adminApi';
import { normalizeAvatarUrl, buildDefaultAvatarUrl } from "../../utils/avatar";
const UsersPage = () => {
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

  // Modals
  const [isActionOpen, setIsActionOpen] = useState(false);
  const [actionType, setActionType] = useState(''); // 'activate', 'deactivate', 'ban', 'verify'
  const [actionReason, setActionReason] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);

  // CRUD Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [viewingUser, setViewingUser] = useState(null);

  const API_BASE = import.meta.env.VITE_API_BASE_URL; // https://localhost:7082

  const normalizeAvatarUrl = (url) => {
    if (!url) return null;
    if (url.startsWith("http")) return url;
    const cleaned = url.startsWith("/") ? url : `/${url}`;
    return API_BASE ? `${API_BASE}${cleaned}` : cleaned;
  };
  // Form data for Create/Update
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    role: 'Student'
  });

  // Fetch users from API
  const fetchUsers = async () => {
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
    } catch (err) {
      console.error("Failed to fetch users", err);
      setError(err.response?.data?.message || "Failed to load users");
      showToast("Failed to load users", "error");
    } finally {
      setLoading(false);
    }
  };

  // Debounce searchKeyword -> debouncedKeyword
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedKeyword(searchKeyword), 400);
    return () => clearTimeout(handler);
  }, [searchKeyword]);

  useEffect(() => {
    fetchUsers();
  }, [pageNumber, pageSize, filterRole, filterStatus, debouncedKeyword]);

  // Map API data to display format
function mapUser(apiUser) {
  const normalized = normalizeAvatarUrl(apiUser.avatarUrl);

  return {
    id: apiUser.id,
    name: apiUser.fullName,
    email: apiUser.email,
    avatar: normalized || buildDefaultAvatarUrl({
      id: apiUser.id,
      email: apiUser.email,
      fullName: apiUser.fullName
    }),
    role: mapRoleFromAPI(apiUser.role),
    status: apiUser.isActive ? "active" : "inactive",
    isVerified: apiUser.isVerified,
    sessionsCount: 0,
    balance: 0,
    createdAt: apiUser.createdAt || new Date().toISOString(),
  };
}

  function mapRoleFromAPI(role) {
    // Handle both enum number (0=Student, 1=Mentor, 2=Admin) and string
    if (typeof role === 'number') {
      const roleMap = { 0: 'student', 1: 'mentor', 2: 'admin' };
      return roleMap[role] || 'student';
    }
    return role ? role.toLowerCase() : "student";
  }

  function mapRoleToAPI(role) {
    const roleMap = {
      'student': 'Student',
      'mentor': 'Mentor',
      'admin': 'Admin'
    };
    return roleMap[role] || 'Student';
  }

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  // CRUD Functions
  const handleCreate = () => {
    setFormData({ fullName: '', email: '', password: '', role: 'Student' });
    setIsCreateModalOpen(true);
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      fullName: user.name,
      email: user.email,
      password: '', // Don't populate password
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
    try {
      await adminApi.createUser({
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password,
        role: formData.role // adminApi will convert to number
      });
      showToast(`User "${formData.fullName}" has been created successfully`, 'success');
      fetchUsers();
      setIsCreateModalOpen(false);
    } catch (err) {
      console.error('Failed to create user', err);
      // Show detailed error message from backend
      const errorMsg = err.response?.data?.message ||
        err.response?.data?.errors?.[0] ||
        'Failed to create user';

      // Check if API endpoint doesn't exist (405 Method Not Allowed)
      if (err.response?.status === 405) {
        showToast('Create user API is not implemented in backend yet. Please use registration flow.', 'error');
      } else {
        showToast(errorMsg, 'error');
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
      // Only include password if it's provided
      if (formData.password) {
        updateData.password = formData.password;
      }

      await adminApi.updateUser(editingUser.id, updateData);
      showToast(`User "${formData.fullName}" has been updated successfully`, 'success');
      fetchUsers();
      setIsUpdateModalOpen(false);
    } catch (err) {
      console.error('Failed to update user', err);
      // Check if API endpoint doesn't exist (405 Method Not Allowed)
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
      // Check if API endpoint doesn't exist (405 Method Not Allowed)
      if (err.response?.status === 405) {
        // Fallback to ban user if delete is not implemented
        try {
          await adminApi.banUser(selectedUser.id, 'Account deleted by admin');
          showToast(`User "${selectedUser.name}" has been banned (delete API not available)`, 'success');
          fetchUsers();
          setIsDeleteModalOpen(false);
        } catch (banErr) {
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

      // Refresh the list
      fetchUsers();
      setIsActionOpen(false);
    } catch (err) {
      console.error(`Failed to ${actionType} user`, err);
      showToast(err.response?.data?.message || `Failed to ${actionType} user`, 'error');
    }
  };

  const getActionLabel = () => {
    const labels = {
      'activate': 'Activate User',
      'deactivate': 'Deactivate User',
      'ban': 'Ban User',
      'verify': 'Verify User'
    };
    return labels[actionType] || 'Confirm Action';
  };


  const getActionMessage = () => {
    const messages = {
      'activate': `Are you sure you want to activate "${selectedUser?.name}"? They will be able to login again.`,
      'deactivate': `Are you sure you want to deactivate "${selectedUser?.name}"? They won't be able to login.`,
      'ban': `Are you sure you want to ban "${selectedUser?.name}"? This action will permanently restrict their account.`,
      'verify': `Are you sure you want to verify "${selectedUser?.name}"? This will mark their account as verified.`
    };
    return messages[actionType] || '';
  };

  const getStatusColor = (status) => {
    const colors = {
      active: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400',
      inactive: 'text-neutral-600 bg-neutral-100 dark:bg-neutral-800 dark:text-neutral-400',
    };
    return colors[status] || colors.inactive;
  };

  const getRoleColor = (role) => {
    const colors = {
      admin: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20 dark:text-purple-400',
      mentor: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400',
      student: 'text-neutral-600 bg-neutral-100 dark:bg-neutral-800 dark:text-neutral-400'
    };
    return colors[role] || colors.student;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN').format(amount) + 'đ';
  };

  const columns = [
    {
      key: 'name',
      label: 'User',
      render: (_, row) => (
        <div className="flex items-center gap-3">
          <img
            src={row.avatar}
            alt=""
            className="w-8 h-8 rounded-full object-cover"
            onError={(e) => {
              e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                row.name || "User"
              )}&background=random`;
            }}
          />

          <div>
            <div className="flex items-center gap-2">
              <p className="font-medium text-neutral-900 dark:text-white">{row.name}</p>
              {row.isVerified && (
                <HiShieldCheck className="w-4 h-4 text-blue-500" title="Verified" />
              )}
            </div>
            <p className="text-xs text-neutral-500">{row.email}</p>
          </div>
        </div>
      )
    },
    {
      key: 'role',
      label: 'Role',
      render: (value) => (
        <span className={`inline-block px-2.5 py-1 text-xs font-medium rounded-full capitalize ${getRoleColor(value)}`}>
          {value}
        </span>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => (
        <span className={`inline-block px-2.5 py-1 text-xs font-medium rounded-full capitalize ${getStatusColor(value)}`}>
          {value}
        </span>
      )
    },
    {
      key: 'sessionsCount',
      label: 'Sessions',
      render: (value) => <span className="text-neutral-900 dark:text-white">{value}</span>
    },
    {
      key: 'balance',
      label: 'Balance',
      render: (value) => <span className="text-neutral-900 dark:text-white">{formatCurrency(value)}</span>
    },
    {
      key: 'createdAt',
      label: 'Joined',
      render: (value) => (
        <span className="text-neutral-500">
          {new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </span>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      render: (_, row) => (
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); handleViewDetail(row); }}
            className="p-2 rounded-lg text-neutral-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
            title="View Detail"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </button>
          {row.status === 'inactive' ? (
            <button
              onClick={(e) => { e.stopPropagation(); handleAction(row, 'activate'); }}
              className="p-2 rounded-lg text-neutral-500 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
              title="Activate"
            >
              <HiCheckCircle className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={(e) => { e.stopPropagation(); handleAction(row, 'deactivate'); }}
              className="p-2 rounded-lg text-neutral-500 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors"
              title="Deactivate"
            >
              <HiXCircle className="w-4 h-4" />
            </button>
          )}
          {!row.isVerified && (
            <button
              onClick={(e) => { e.stopPropagation(); handleAction(row, 'verify'); }}
              className="p-2 rounded-lg text-neutral-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
              title="Verify"
            >
              <HiShieldCheck className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); handleEdit(row); }}
            className="p-2 rounded-lg text-neutral-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
            title="Edit User"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleAction(row, 'ban'); }}
            className="p-2 rounded-lg text-neutral-500 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors"
            title="Ban User"
          >
            <HiBan className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleDelete(row); }}
            className="p-2 rounded-lg text-neutral-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            title="Delete User"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Toast Notification */}
      {toast.show && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg ${toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'
          } text-white`}>
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Users</h1>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm">
            Manage platform users {totalCount > 0 && `(${totalCount} total)`}
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create User
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 p-4 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800">
        <HiFilter className="w-5 h-5 text-neutral-400" />
        <input
          type="text"
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
          placeholder="Search by name or email..."
          className="px-3 py-1.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm text-neutral-900 dark:text-white focus:outline-none focus:border-blue-500 flex-1"
        />
        <select
          value={filterRole}
          onChange={(e) => { setFilterRole(e.target.value); setPageNumber(1); }}
          className="px-3 py-1.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm text-neutral-900 dark:text-white focus:outline-none focus:border-blue-500"
        >
          <option value="all">All Roles</option>
          <option value="admin">Admin</option>
          <option value="mentor">Mentor</option>
          <option value="student">Student</option>
        </select>
        <select
          value={filterStatus}
          onChange={(e) => { setFilterStatus(e.target.value); setPageNumber(1); }}
          className="px-3 py-1.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm text-neutral-900 dark:text-white focus:outline-none focus:border-blue-500"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        {(filterRole !== 'all' || filterStatus !== 'all' || searchKeyword) && (
          <button
            onClick={() => { setFilterRole('all'); setFilterStatus('all'); setSearchKeyword(''); setPageNumber(1); }}
            className="text-sm text-blue-600 hover:underline whitespace-nowrap"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800">
          <div className="text-neutral-500">Loading users...</div>
        </div>
      ) : error ? (
        <div className="flex items-center justify-center py-12 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800">
          <div className="text-red-500">{error}</div>
        </div>
      ) : (
        <>
          <DataTable
            columns={columns}
            data={users}
            searchable={false}
            emptyMessage="No users found"
          />

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800">
              <div className="text-sm text-neutral-500">
                Showing {((pageNumber - 1) * pageSize) + 1} to {Math.min(pageNumber * pageSize, totalCount)} of {totalCount} users
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPageNumber(p => Math.max(1, p - 1))}
                  disabled={pageNumber === 1}
                  className="px-3 py-1 text-sm border border-neutral-200 dark:border-neutral-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-50 dark:hover:bg-neutral-800"
                >
                  Previous
                </button>
                <span className="text-sm text-neutral-900 dark:text-white">
                  Page {pageNumber} of {totalPages}
                </span>
                <button
                  onClick={() => setPageNumber(p => Math.min(totalPages, p + 1))}
                  disabled={pageNumber === totalPages}
                  className="px-3 py-1 text-sm border border-neutral-200 dark:border-neutral-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-50 dark:hover:bg-neutral-800"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Action Confirmation */}
      <ConfirmDialog
        isOpen={isActionOpen}
        onClose={() => setIsActionOpen(false)}
        onConfirm={confirmAction}
        title={getActionLabel()}
        message={getActionMessage()}
        confirmText={actionType === 'ban' ? 'Ban' : 'Confirm'}
        danger={actionType === 'ban' || actionType === 'deactivate'}
      >
        {actionType === 'ban' && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Reason (optional)
            </label>
            <textarea
              value={actionReason}
              onChange={(e) => setActionReason(e.target.value)}
              placeholder="Enter reason for banning this user..."
              className="w-full px-4 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white focus:outline-none focus:border-blue-500"
              rows={3}
            />
          </div>
        )}
      </ConfirmDialog>

      {/* Create User Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New User"
      >
        <form onSubmit={(e) => { e.preventDefault(); submitCreate(); }} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Full Name
            </label>
            <input
              type="text"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              required
              className="w-full px-4 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white focus:outline-none focus:border-blue-500"
              placeholder="Enter full name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              className="w-full px-4 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white focus:outline-none focus:border-blue-500"
              placeholder="Enter email address"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Password
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              className="w-full px-4 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white focus:outline-none focus:border-blue-500"
              placeholder="Enter password"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Role
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full px-4 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white focus:outline-none focus:border-blue-500"
            >
              <option value="Student">Student</option>
              <option value="Mentor">Mentor</option>
              <option value="Admin">Admin</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-neutral-200 dark:border-neutral-800">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create User
            </button>
          </div>
        </form>
      </Modal>

      {/* Update User Modal */}
      <Modal
        isOpen={isUpdateModalOpen}
        onClose={() => setIsUpdateModalOpen(false)}
        title="Update User"
      >
        <form onSubmit={(e) => { e.preventDefault(); submitUpdate(); }} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Full Name
            </label>
            <input
              type="text"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              required
              className="w-full px-4 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white focus:outline-none focus:border-blue-500"
              placeholder="Enter full name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              className="w-full px-4 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white focus:outline-none focus:border-blue-500"
              placeholder="Enter email address"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              New Password (optional)
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-4 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white focus:outline-none focus:border-blue-500"
              placeholder="Leave blank to keep current password"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Role
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full px-4 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white focus:outline-none focus:border-blue-500"
            >
              <option value="Student">Student</option>
              <option value="Mentor">Mentor</option>
              <option value="Admin">Admin</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-neutral-200 dark:border-neutral-800">
            <button
              type="button"
              onClick={() => setIsUpdateModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Update User
            </button>
          </div>
        </form>
      </Modal>

      {/* Detail Modal */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
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
                  {viewingUser.role}
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
              <div>
                <label className="block text-sm font-medium text-neutral-500 mb-1">Sessions Count</label>
                <p className="text-neutral-900 dark:text-white">{viewingUser.sessionsCount}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-500 mb-1">Balance</label>
                <p className="text-neutral-900 dark:text-white">{formatCurrency(viewingUser.balance)}</p>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-neutral-500 mb-1">Joined Date</label>
                <p className="text-neutral-900 dark:text-white">
                  {new Date(viewingUser.createdAt).toLocaleDateString('en-US', {
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
                onClick={() => setIsDetailModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Delete User"
        message={`Are you sure you want to delete "${selectedUser?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        danger
      />
    </div>
  );
};

export default UsersPage;
