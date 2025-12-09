// src/apiClient.js
import axios from 'axios';

// const API_BASE = 'http://localhost:8000';

const API_BASE = 'https://smartdocs-backend.onrender.com';

export async function analyzeDocument(file) {
  const formData = new FormData();
  formData.append('file', file);

  const res = await axios.post(`${API_BASE}/analyze`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
}
