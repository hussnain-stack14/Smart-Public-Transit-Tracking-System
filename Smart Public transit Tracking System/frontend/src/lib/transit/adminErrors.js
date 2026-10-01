export function getAdminError(error, fallback) {
  const status = error.response?.status;
  if (status === 401) return "Your session has expired. Sign in again.";
  if (status === 403) return "Administrator permission is required for this action.";
  const message = error.response?.data?.message;
  if ([400, 404, 409].includes(status) && typeof message === "string") return message;
  return fallback;
}
