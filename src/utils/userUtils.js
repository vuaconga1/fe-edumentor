import { normalizeAvatarUrl, buildDefaultAvatarUrl } from "./avatar";

export function mapUser(apiUser) {
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
        phone: apiUser.phone || null,
        gender: apiUser.gender || null,
        school: apiUser.school || null,
        major: apiUser.major || null,
        bio: apiUser.bio || null,
        city: apiUser.city || null,
        country: apiUser.country || null,
        createdAt: apiUser.createdAt || new Date().toISOString(),
    };
}

export function mapRoleFromAPI(role) {
    // Handle both enum number (0=Student, 1=Mentor, 2=Admin) and string
    if (typeof role === 'number') {
        const roleMap = { 0: 'student', 1: 'mentor', 2: 'admin' };
        return roleMap[role] || 'student';
    }
    return role ? role.toLowerCase() : "student";
}

export function mapRoleToAPI(role) {
    const roleMap = {
        'student': 'Student',
        'mentor': 'Mentor',
        'admin': 'Admin'
    };
    return roleMap[role] || 'Student';
}

export const getStatusColor = (status) => {
    const colors = {
        active: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400',
        inactive: 'text-neutral-600 bg-neutral-100 dark:bg-neutral-800 dark:text-neutral-400',
    };
    return colors[status] || colors.inactive;
};

export const getRoleColor = (role) => {
    const colors = {
        admin: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20 dark:text-purple-400',
        mentor: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400',
        student: 'text-neutral-600 bg-neutral-100 dark:bg-neutral-800 dark:text-neutral-400'
    };
    return colors[role] || colors.student;
};

export const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN').format(amount) + ' VND';
};
