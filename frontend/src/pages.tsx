import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { ArrowRight, Upload, Trash2, Loader2, Send, Bot, User, Menu } from 'lucide-react';
import { motion } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { useDataStore, useUIStore, api, fadeIn } from './core';
import { NotesTab, AudioTab, PracticeTab } from './components';

export const LandingPage = () => (
  <div className="flex flex-col items-center justify-center min-h-[80vh] text-center px-6">
    <motion.div variants={fadeIn} initial="initial" animate="animate" className="space-y-6 max-w-3xl">
      <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight">The One-Night Fight <span className="text-primary">Ends Here.</span></h1>
      <p className="text-xl text-muted-foreground">Turn your syllabus into a 90-second exam strategy.</p>
      <Link to="/dashboard" className="inline-flex h-14 px-8 items-center bg-primary text-white rounded-md hover:bg-primary/90">Start Prep <ArrowRight className="ml-2"/></Link>
    </motion.div>
  </div>
);

export const DashboardPage = () => {
  const navigate = useNavigate();
  const { files, setFiles, setTopics, setSelectedTopic } = useDataStore();
  const [loading, setLoading] = useState(false);
  
  const onDrop = useCallback((acc: File[]) => setFiles([...files, ...acc.map(file => ({ id: Math.random().toString(), file, category: null }))]), [files, setFiles]);
  const { getRootProps, getInputProps } = useDropzone({ onDrop, accept: { 'application/pdf': ['.pdf'] } });

  const handleGen = async () => {
    setLoading(true);
    try {
      const res = await api.uploadDocs(files.map((f:any)=>f.file), files.map((f:any)=>f.category));
      setTopics(res.topics || []); if(res.topics?.length) setSelectedTopic(res.topics[0].id); navigate('/study');
    } catch { alert("Upload failed"); }
    setLoading(false);
  };

  if (loading) return <div className="flex h-[80vh] items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary"/></div>;
  return (
    <div className="max-w-4xl mx-auto p-8 space-y-8">
      <h1 className="text-4xl font-bold text-center">Upload Documents</h1>
      <div {...getRootProps()} className="border-2 border-dashed border-border rounded-xl p-16 text-center cursor-pointer bg-glass"><input {...getInputProps()} /><Upload className="mx-auto text-primary mb-4 h-10 w-10"/><p>Drop PDFs here</p></div>
      {files.map((f: any) => (
        <div key={f.id} className="flex justify-between items-center p-4 bg-muted/30 rounded-xl border border-border">
          <p className="font-medium">{f.file.name}</p>
          <div className="flex gap-2">
            {['PYQs', 'Syllabus', 'Notes'].map(c => <button key={c} onClick={() => setFiles(files.map((file:any)=>file.id===f.id?{...file,category:c}:file))} className={`px-3 py-1 text-xs rounded-full border ${f.category===c?'bg-primary text-white':'border-border'}`}>{c}</button>)}
            <button onClick={() => setFiles(files.filter((file:any)=>file.id!==f.id))}><Trash2 className="text-destructive h-4 w-4 ml-2"/></button>
          </div>
        </div>
      ))}
      {files.length > 0 && <button onClick={handleGen} disabled={!files.every((f:any)=>f.category)} className="w-full h-14 bg-primary text-white rounded-xl disabled:opacity-50">Generate Study Pack</button>}
    </div>
  );
};

export const StudyPage = () => {
  const { topics, selectedTopicId, topicData, setSelectedTopic, setTopicData } = useDataStore();
  const { isADHDMode } = useUIStore();
  const [tab, setTab] = useState('notes');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const selectedTopic = topics.find((t:any) => t.id === selectedTopicId);
  const currentData = selectedTopicId ? topicData[selectedTopicId] : null;

  useEffect(() => {
    if (selectedTopic && !currentData) { api.getPassPack(selectedTopic.name).then(data => setTopicData(selectedTopic.id, data)); }
  }, [selectedTopic, currentData]);

  if (!topics.length) return <div className="text-center p-20 text-xl">No topics. Please upload first.</div>;
  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      {!isADHDMode && sidebarOpen && (
        <aside className="w-72 border-r border-border bg-glass overflow-y-auto">
          <div className="p-4 font-bold border-b border-border text-xs uppercase">Topics</div>
          {topics.map((t:any) => <button key={t.id} onClick={() => setSelectedTopic(t.id)} className={`w-full text-left p-4 text-sm border-b border-border/50 ${selectedTopicId===t.id?'bg-primary/10 text-primary':''}`}>{t.name}</button>)}
        </aside>
      )}
      <main className="flex-1 flex flex-col bg-background">
        <header className="p-6 border-b border-border">
          <div className="flex items-center gap-4 mb-6">{!isADHDMode && <button onClick={()=>setSidebarOpen(!sidebarOpen)}><Menu/></button>} <h1 className="text-2xl font-bold">{selectedTopic?.name}</h1></div>
          <div className="flex gap-6 text-sm font-semibold uppercase">
            {['notes', 'audio', 'practice'].map(t => <button key={t} onClick={() => setTab(t)} className={`pb-2 border-b-2 ${tab===t?'border-primary':'border-transparent text-muted-foreground'}`}>{t}</button>)}
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-6">
          {!currentData ? <div className="animate-pulse space-y-4"><div className="h-6 bg-muted rounded w-3/4"/><div className="h-32 bg-muted rounded w-full"/></div> : 
          <>{tab === 'notes' && <NotesTab data={currentData.notes} />} {tab === 'audio' && <AudioTab data={currentData.audio} topicName={currentData.topic} />} {tab === 'practice' && <PracticeTab data={currentData.practice} />}</>}
        </div>
      </main>
    </div>
  );
};

export const ChatPage = () => {
  const { chatMessages, addChatMessage } = useDataStore();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault(); if (!input.trim()) return;
    addChatMessage({ id: Date.now().toString(), role: 'user', text: input }); setInput(''); setLoading(true);
    try { const res = await api.chat(input); addChatMessage({ id: (Date.now()+1).toString(), role: 'ai', text: res.response }); } 
    catch { addChatMessage({ id: (Date.now()+1).toString(), role: 'ai', text: "Server error." }); }
    setLoading(false);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] max-w-4xl mx-auto w-full p-4">
      <div className="flex-1 overflow-y-auto space-y-6 pb-6">
        {chatMessages.map((msg:any) => (
          <div key={msg.id} className={`flex gap-4 ${msg.role==='user'?'flex-row-reverse':''}`}>
            <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${msg.role==='user'?'bg-primary text-white':'bg-muted'}`}>{msg.role==='user'?<User className="h-5 w-5"/>:<Bot className="h-5 w-5"/>}</div>
            <div className={`max-w-[80%] p-4 rounded-xl ${msg.role==='user'?'bg-primary text-white':'bg-muted/50'}`}><ReactMarkdown>{msg.text}</ReactMarkdown></div>
          </div>
        ))}
        {loading && <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center"><Bot className="h-5 w-5 animate-pulse"/></div>}
      </div>
      <form onSubmit={handleSend} className="flex gap-2"><input value={input} onChange={e=>setInput(e.target.value)} className="flex-1 bg-muted/50 border rounded-xl px-4 py-3" /><button type="submit" className="bg-primary text-white p-3 rounded-xl"><Send/></button></form>
    </div>
  );
};