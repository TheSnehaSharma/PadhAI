import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { Settings, BookOpen, MessageSquare, LayoutDashboard, GraduationCap, X, Brain, Type, Moon, Play, Loader2 } from 'lucide-react';
import { useUIStore, useDataStore, api, cn } from './core';

export const Layout = () => {
  const { isDarkMode, isDyslexiaMode, isADHDMode, toggleMode } = useUIStore();
  const [open, setOpen] = useState(false);
  const path = useLocation().pathname;
  useEffect(() => { document.documentElement.classList.toggle('dark', isDarkMode); }, [isDarkMode]);

  return (
    <div className={cn("min-h-screen flex flex-col transition-colors duration-300", isDyslexiaMode && "dyslexia-mode-active", isADHDMode && "adhd-mode-active")}>
      <header className="sticky top-0 z-50 w-full border-b border-glass-border bg-glass backdrop-blur-xl h-14 flex items-center px-6 justify-between">
        <div className="flex items-center gap-6">
          {!isADHDMode && <Link to="/" className="flex items-center gap-2 font-bold text-xl"><BookOpen className="text-primary"/> Padh.ai</Link>}
          {!isADHDMode && (
            <nav className="hidden md:flex gap-4">
              {[ { to: '/dashboard', icon: LayoutDashboard, l: 'Upload' }, { to: '/study', icon: GraduationCap, l: 'Study' }, { to: '/chat', icon: MessageSquare, l: 'Chat' } ].map(i => (
                <Link key={i.to} to={i.to} className={`flex items-center gap-2 text-sm ${path === i.to ? 'text-primary' : 'text-muted-foreground'}`}><i.icon className="h-4 w-4"/> {i.l}</Link>
              ))}
            </nav>
          )}
        </div>
        <button onClick={() => setOpen(true)} className="p-2 text-muted-foreground hover:text-foreground"><Settings className="h-5 w-5" /></button>
      </header>
      
      {open && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-background border border-border p-6 rounded-2xl w-full max-w-md space-y-6">
            <div className="flex justify-between"><h2 className="font-bold text-xl">Settings</h2><button onClick={() => setOpen(false)}><X/></button></div>
            {[ { id: 'adhd', label: 'ADHD Mode (Focus)', icon: Brain, val: isADHDMode }, { id: 'dyslexia', label: 'Dyslexia Font', icon: Type, val: isDyslexiaMode }, { id: 'dark', label: 'Dark Mode', icon: Moon, val: isDarkMode } ].map(s => (
              <div key={s.id} className="flex justify-between items-center p-4 border rounded-xl">
                <div className="flex items-center gap-3"><s.icon className="text-primary"/><label>{s.label}</label></div>
                <input type="checkbox" checked={s.val} onChange={() => toggleMode(s.id)} className="h-5 w-5 accent-primary"/>
              </div>
            ))}
          </div>
        </div>
      )}
      <main className="flex-1 w-full"><Outlet /></main>
    </div>
  );
};

export const NotesTab = ({ data }: { data: any }) => <div className="prose dark:prose-invert max-w-none"><ReactMarkdown>{data?.content}</ReactMarkdown></div>;

export const AudioTab = ({ data, topicName }: { data: any, topicName: string }) => {
  const [url, setUrl] = useState(data?.audioUrl);
  const [loading, setLoading] = useState(false);
  const generate = async () => { setLoading(true); try { setUrl((await api.generateAudio(topicName)).audioUrl); } catch { alert("Failed"); } setLoading(false); };
  if (!url && !loading) return <div className="text-center py-20"><button onClick={generate} className="bg-primary text-white px-8 py-3 rounded-lg">Generate Podcast</button></div>;
  if (loading) return <div className="text-center py-20"><Loader2 className="mx-auto h-8 w-8 animate-spin text-primary"/></div>;
  return <div className="space-y-8"><audio controls src={url} className="w-full" /><div className="space-y-4">{data?.transcript?.map((t:any, i:number) => <p key={i} className="text-muted-foreground">{t.text}</p>)}</div></div>;
};

export const PracticeTab = ({ data }: { data: any[] }) => {
  const { toggleSolved, solvedQuestions, selectedTopicId } = useDataStore();
  const solved = selectedTopicId ? (solvedQuestions[selectedTopicId] || []) : [];
  return (
    <div className="space-y-8">
      {data?.map((q) => (
        <div key={q.id} className={`flex gap-4 p-4 rounded-xl border border-border ${solved.includes(q.id) ? 'opacity-50 line-through' : ''}`}>
          <input type="checkbox" checked={solved.includes(q.id)} onChange={() => toggleSolved(selectedTopicId, q.id)} className="mt-1 h-5 w-5 accent-primary cursor-pointer" />
          <div><h4 className="font-semibold text-lg">{q.question}</h4>{!solved.includes(q.id) && <p className="text-muted-foreground mt-2">{q.answer}</p>}</div>
        </div>
      ))}
    </div>
  );
};