// Backend enum: Student = 0, Mentor = 1, Admin = 2
export const UserRole = {
  Student: 0,
  Mentor: 1,
  Admin: 2,
};

export const getRoleName = (role) => {
  switch (role) {
    case 0:
    case UserRole.Student:
      return "Student";
    case 1:
    case UserRole.Mentor:
      return "Mentor";
    case 2:
    case UserRole.Admin:
      return "Admin";
    default:
      return "User";
  }
};

export const getRoleDisplayName = (role) => {
  switch (role) {
    case 0:
    case UserRole.Student:
      return "Student";
    case 1:
    case UserRole.Mentor:
      return "Mentor";
    case 2:
    case UserRole.Admin:
      return "System Administrator";
    default:
      return "User";
  }
};

export const isAdmin = (role) => role === 2 || role === UserRole.Admin;
export const isMentor = (role) => role === 1 || role === UserRole.Mentor;
export const isStudent = (role) => role === 0 || role === UserRole.Student;
