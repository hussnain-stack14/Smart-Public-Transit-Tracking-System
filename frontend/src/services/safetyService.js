import api from "../lib/api/axios";
import { API_PATHS } from "../config/api";

export const safetyService = {
  startSession: (busId) => api.post(`${API_PATHS.safety}/sessions`, { bus: busId }).then(({ data }) => data),
  getMySessions: () => api.get(`${API_PATHS.safety}/sessions/me`).then(({ data }) => data),
  endSession: (sessionId) => api.patch(`${API_PATHS.safety}/sessions/${sessionId}/end`).then(({ data }) => data),
  track: (shareToken) => api.get(`${API_PATHS.safety}/track/${shareToken}`).then(({ data }) => data),
};
