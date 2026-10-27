import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export const useDataStore = create<any>()(persist((set) => ({
  files: [], topics: [], selectedTopicId: null, topicData: {}, solvedQuestions: {},
  chatMessages: [{ id: '1', role: 'ai', text: 'Hi! Ask me anything.' }],
  setFiles: (files: any) => set({ files }),
  setTopics: (topics: any) => set({ topics }),
  setSelectedTopic: (selectedTopicId: any) => set({ selectedTopicId }),
  setTopicData: (id: string, data: any) => set((state: any) => ({ topicData: { ...state.topicData, [id]: data } })),
  toggleSolved: (topicId: string, qId: string) => set((state: any) => {
    const s = state.solvedQuestions[topicId] || [];
    return { solvedQuestions: { ...state.solvedQuestions, [topicId]: s.includes(qId) ? s.filter((id: string) => id !== qId) : [...s, qId] } };
  }),
  addChatMessage: (msg: any) => set((state: any) => ({ chatMessages: [...state.chatMessages, msg] }))
}), { name: 'padhai-data' }));

export const useUIStore = create<any>()(persist((set) => ({
  isADHDMode: false, isDyslexiaMode: false, isDarkMode: false,
  toggleMode: (mode: string) => set((state: any) => {
    if (mode === 'dark') { document.documentElement.classList.toggle('dark', !state.isDarkMode); return { isDarkMode: !state.isDarkMode }; }
    return mode === 'adhd' ? { isADHDMode: !state.isADHDMode } : { isDyslexiaMode: !state.isDyslexiaMode };
  })
}), { name: 'padhai-ui' }));

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
const fetcher = async (url: string, opts?: any) => {
  const res = await fetch(`${API_URL}${url}`, { ...opts, headers: { 'Content-Type': 'application/json', ...opts?.headers } });
  if (!res.ok) throw new Error(await res.text()); return res.json();
};

export const api = {
  uploadDocs: async (files: File[], cats: string[]) => {
    const body = new FormData(); files.forEach((f, i) => { body.append('files', f); body.append('categories', cats[i]); });
    return fetch(`${API_URL}/upload`, { method: 'POST', body }).then(r => r.json());
  },
  getPassPack: (topic: string) => fetcher(`/topic/${encodeURIComponent(topic)}`),
  generateAudio: (topic: string) => fetcher(`/audio/${encodeURIComponent(topic)}`, { method: 'POST', body: JSON.stringify({ duration: 15 }) }),
  chat: (query: string) => fetcher('/chat', { method: 'POST', body: JSON.stringify({ query, context: "" }) })
};

export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }
export const fadeIn = { initial: { opacity: 0 }, animate: { opacity: 1 } };