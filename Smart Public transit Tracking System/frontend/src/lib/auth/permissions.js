export const ROLES = {
  DRIVER: "driver",
  ADMIN: "admin",
};

export function hasRole(user, role) {
  return user?.role === role;
}
