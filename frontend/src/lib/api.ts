import axios from 'axios';
import type { AnalysisResult, AuthResponse, AnalyticsData } from '../types';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 120000,
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('truthlens_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Global error handler
api.interceptors.response.use(
  (res) => res,
  (error) => {
    const message = error.response?.data?.detail || error.message || 'An error occurred';
    return Promise.reject(new Error(message));
  }
);

// ─── Analysis APIs ────────────────────────────────────────────────────────────

export const analyzeText = async (text: string, language = 'en'): Promise<AnalysisResult> => {
  const res = await api.post<AnalysisResult>('/analyze-text', { text, language });
  return res.data;
};

export const analyzeUrl = async (url: string, language = 'en'): Promise<AnalysisResult> => {
  const res = await api.post<AnalysisResult>('/analyze-url', { url, language });
  return res.data;
};

export const analyzePdf = async (file: File): Promise<AnalysisResult> => {
  const form = new FormData();
  form.append('file', file);
  const res = await api.post<AnalysisResult>('/upload-pdf', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
};

export const analyzeImage = async (file: File): Promise<AnalysisResult> => {
  const form = new FormData();
  form.append('file', file);
  const res = await api.post<AnalysisResult>('/ocr-image', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
};

// ─── Auth APIs ────────────────────────────────────────────────────────────────

export const register = async (name: string, email: string, password: string): Promise<AuthResponse> => {
  const res = await api.post<AuthResponse>('/auth/register', { name, email, password });
  return res.data;
};

export const login = async (email: string, password: string): Promise<AuthResponse> => {
  const res = await api.post<AuthResponse>('/auth/login', { email, password });
  return res.data;
};

// ─── Dashboard APIs ───────────────────────────────────────────────────────────

export const getHistory = async (): Promise<{ analyses: AnalysisResult[]; total: number }> => {
  const res = await api.get('/history');
  return res.data;
};

export const getAnalytics = async (): Promise<AnalyticsData> => {
  const res = await api.get<AnalyticsData>('/analytics');
  return res.data;
};

export const getCategories = async (): Promise<Record<string, number>> => {
  const res = await api.get<Record<string, number>>('/categories');
  return res.data;
};

export const getTrend = async (): Promise<any[]> => {
  const res = await api.get<any[]>('/trend');
  return res.data;
};

export const getTrendingTopics = async (): Promise<string[]> => {
  const res = await api.get<string[]>('/trending-topics');
  return res.data;
};
