// src/services/api.js
import axios from 'axios';

// Ensure this is your correct API Gateway endpoint
const API_BASE = 'https://pvlzjfze45.execute-api.ap-south-1.amazonaws.com/prod';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// --- Auth APIs ---
export const authAPI = {
  register: (username, password) =>
    api.post('/auth', { username, password }),

  login: (username, password) =>
    api.post('/auth/login', { username, password }),
};

// --- Files APIs ---
export const filesAPI = {
  // GET /files?type=...&sort=...&search=...&page=...&limit=...
  getAll: (params) => api.get('/files', { params }), // Backend needs to support these params

  // GET /view?id={file_id}
  getById: (id) => api.get(`/view?id=${id}`),

  // POST /upload (Handles SINGLE object OR { files: [...] } array)
  // uploadPayload will be { files: [...] } for batch or { file_name: ... } for single
  upload: (uploadPayload) => api.post('/upload', uploadPayload),

  // PUT request directly to S3 presigned URL
  uploadToS3: (url, file, onProgress) =>
    axios.put(url, file, {
      headers: { 'Content-Type': file.type },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(percentCompleted);
        }
      },
    }),

  // POST /confirm-upload (Handles { file_id: "..." } OR { file_ids: [...] })
  // confirmPayload will be { file_ids: [...] } for batch or { file_id: "..." } for single
  confirmUpload: (confirmPayload) => api.post('/confirm-upload', confirmPayload),

  // POST /track-download
  trackDownload: (fileId) => api.post('/track-download', { file_id: fileId }),
};

// --- Comments APIs ---
export const commentsAPI = {
  getByFileId: (fileId) => api.get(`/comments?file_id=${fileId}`),
  add: (commentData) => api.post('/comments/add', commentData),
  reply: (replyData) => api.post('/comments/reply', replyData),
};

// --- Likes APIs ---
export const likesAPI = {
  check: (fileId, userId) =>
    api.get(`/likes/check?file_id=${fileId}&user_id=${userId}`),
  toggle: (fileId, userId) =>
    api.post('/likes/toggle', { file_id: fileId, user_id: userId }),
};

// --- Report API ---
export const reportAPI = {
  sendReport: (reportData) => api.post('/report', reportData),
};

export default api;