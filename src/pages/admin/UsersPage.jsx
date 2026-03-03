// src/pages/admin/UsersPage.jsx
import React from 'react';
import { HiCheckCircle, HiXCircle, HiBan, HiShieldCheck, HiEye, HiPencil, HiTrash, HiRefresh } from 'react-icons/hi';
import DataTable from '../../components/admin/DataTable';
import ConfirmDialog from '../../components/admin/ConfirmDialog';
import ActionButton from '../../components/admin/ActionButton';
import AdminFilterBar from '../../components/admin/AdminFilterBar';

import useUsers from '../../hooks/useUsers';
import { getStatusColor, getRoleColor } from '../../utils/userUtils';

import UserCreateModal from '../../components/admin/users/UserCreateModal';
import UserUpdateModal from '../../components/admin/users/UserUpdateModal';
import UserDetailModal from '../../components/admin/users/UserDetailModal';

const UsersPage = () => {
  // Connect custom hook
  const hook = useUsers();

  const getActionLabelText = () => {
    const labels = {
      'activate': 'Activate User',
      'deactivate': 'Deactivate User',
      'ban': 'Ban User',
      'verify': 'Verify User'
    };
    return labels[hook.actionType] || 'Confirm Action';
  };

  const getActionMessageText = () => {
    const messages = {
      'activate': `Are you sure you want to activate "${hook.selectedUser?.name}"? They will be able to login again.`,
      'deactivate': `Are you sure you want to deactivate "${hook.selectedUser?.name}"? They won't be able to login.`,
      'ban': `Are you sure you want to ban "${hook.selectedUser?.name}"? This action will permanently restrict their account.`,
      'verify': `Are you sure you want to verify "${hook.selectedUser?.name}"? This will mark their account as verified.`
    };
    return messages[hook.actionType] || '';
  };

  const columns = [
    {
      key: 'id',
      label: 'ID',
      render: (value) => (
        <span className="text-xs font-mono text-neutral-500">#{value}</span>
      )
    },
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
      key: 'createdAt',
      label: 'Joined',
      render: (value) => (
        <span className="text-neutral-500">
          {new Date(value?.endsWith?.('Z') ? value : value + 'Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </span>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      render: (_, row) => (
        <div className="flex items-center gap-1">
          <ActionButton
            icon={<HiEye className="w-4 h-4" />}
            tooltip="View Detail"
            onClick={(e) => { e?.stopPropagation?.(); hook.handleViewDetail(row); }}
            variant="info"
          />
          {row.status === 'inactive' ? (
            <ActionButton
              icon={<HiCheckCircle className="w-4 h-4" />}
              tooltip="Activate User"
              onClick={(e) => { e?.stopPropagation?.(); hook.handleAction(row, 'activate'); }}
              variant="success"
            />
          ) : (
            <ActionButton
              icon={<HiBan className="w-4 h-4" />}
              tooltip="Ban User"
              onClick={(e) => { e?.stopPropagation?.(); hook.handleAction(row, 'ban'); }}
              variant="warning"
            />
          )}
          {!row.isVerified && (
            <ActionButton
              icon={<HiShieldCheck className="w-4 h-4" />}
              tooltip="Verify User"
              onClick={(e) => { e?.stopPropagation?.(); hook.handleAction(row, 'verify'); }}
              variant="info"
            />
          )}
          <ActionButton
            icon={<HiPencil className="w-4 h-4" />}
            tooltip="Edit User"
            onClick={(e) => { e?.stopPropagation?.(); hook.handleEdit(row); }}
            variant="info"
          />
          <ActionButton
            icon={<HiTrash className="w-4 h-4" />}
            tooltip="Delete User"
            onClick={(e) => { e?.stopPropagation?.(); hook.handleDelete(row); }}
            variant="danger"
          />
        </div>
      )
    }
  ];

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Toast Notification */}
      {hook.toast.show && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg ${hook.toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'} text-white`}>
          {hook.toast.message}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white">Users</h1>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm">
            Manage platform users {hook.totalCount > 0 && `(${hook.totalCount} total)`}
          </p>
        </div>
        <button
          onClick={hook.handleCreate}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium w-full sm:w-auto"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create User
        </button>
      </div>

      {/* Filters */}
      <AdminFilterBar
        searchValue={hook.searchKeyword}
        onSearchChange={hook.setSearchKeyword}
        searchPlaceholder="Search by name or email..."
        filters={[
          {
            label: "Role",
            value: hook.filterRole,
            onChange: (v) => { hook.setFilterRole(v); hook.setPageNumber(1); },
            options: [
              { value: "all", label: "All Roles" },
              { value: "admin", label: "Admin" },
              { value: "mentor", label: "Mentor" },
              { value: "student", label: "Student" },
            ]
          },
          {
            label: "Status",
            value: hook.filterStatus,
            onChange: (v) => { hook.setFilterStatus(v); hook.setPageNumber(1); },
            options: [
              { value: "all", label: "All Status" },
              { value: "active", label: "Active" },
              { value: "inactive", label: "Inactive" },
            ]
          }
        ]}
        showClear={hook.filterRole !== 'all' || hook.filterStatus !== 'all' || hook.searchKeyword}
        onClearFilters={() => { hook.setFilterRole('all'); hook.setFilterStatus('all'); hook.setSearchKeyword(''); hook.setPageNumber(1); }}
        onRefresh={hook.fetchUsers}
      />

      {/* Table Area */}
      {hook.loading ? (
        <div className="flex items-center justify-center py-12 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800">
          <div className="text-neutral-500">Loading users...</div>
        </div>
      ) : hook.error ? (
        <div className="flex items-center justify-center py-12 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800">
          <div className="text-red-500">{hook.error}</div>
        </div>
      ) : (
        <>
          <DataTable
            columns={columns}
            data={hook.users}
            searchable={false}
            emptyMessage="No users found"
          />

          {/* Pagination */}
          {hook.totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800">
              <div className="text-sm text-neutral-500 text-center sm:text-left">
                Showing {((hook.pageNumber - 1) * hook.pageSize) + 1} to {Math.min(hook.pageNumber * hook.pageSize, hook.totalCount)} of {hook.totalCount}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => hook.setPageNumber(p => Math.max(1, p - 1))}
                  disabled={hook.pageNumber === 1}
                  className="px-3 py-1.5 text-sm border border-neutral-200 dark:border-neutral-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-50 dark:hover:bg-neutral-800"
                >
                  Prev
                </button>
                <span className="text-sm text-neutral-900 dark:text-white px-2">
                  {hook.pageNumber}/{hook.totalPages}
                </span>
                <button
                  onClick={() => hook.setPageNumber(p => Math.min(hook.totalPages, p + 1))}
                  disabled={hook.pageNumber === hook.totalPages}
                  className="px-3 py-1.5 text-sm border border-neutral-200 dark:border-neutral-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-50 dark:hover:bg-neutral-800"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Action Confirmation Modal */}
      <ConfirmDialog
        isOpen={hook.isActionOpen}
        onClose={() => hook.setIsActionOpen(false)}
        onConfirm={hook.confirmAction}
        title={getActionLabelText()}
        message={getActionMessageText()}
        confirmText={hook.actionType === 'ban' ? 'Ban' : 'Confirm'}
        danger={hook.actionType === 'ban' || hook.actionType === 'deactivate'}
      >
        {hook.actionType === 'ban' && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Reason (optional)
            </label>
            <textarea
              value={hook.actionReason}
              onChange={(e) => hook.setActionReason(e.target.value)}
              placeholder="Enter reason for banning this user..."
              className="w-full px-4 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white focus:outline-none focus:border-blue-500"
              rows={3}
            />
          </div>
        )}
      </ConfirmDialog>

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={hook.isDeleteModalOpen}
        onClose={() => hook.setIsDeleteModalOpen(false)}
        onConfirm={hook.confirmDelete}
        title="Delete User"
        message={`Are you sure you want to delete "${hook.selectedUser?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        danger
      />

      {/* UI Component Modals */}
      <UserCreateModal
        isOpen={hook.isCreateModalOpen}
        onClose={() => { hook.setIsCreateModalOpen(false); hook.setCreateError(''); }}
        formData={hook.formData}
        setFormData={hook.setFormData}
        submitCreate={hook.submitCreate}
        createError={hook.createError}
      />

      <UserUpdateModal
        isOpen={hook.isUpdateModalOpen}
        onClose={() => hook.setIsUpdateModalOpen(false)}
        formData={hook.formData}
        setFormData={hook.setFormData}
        submitUpdate={hook.submitUpdate}
      />

      <UserDetailModal
        isOpen={hook.isDetailModalOpen}
        onClose={() => hook.setIsDetailModalOpen(false)}
        viewingUser={hook.viewingUser}
      />
    </div>
  );
};

export default UsersPage;
