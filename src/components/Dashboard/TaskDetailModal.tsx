import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Send, MapPin, MessageSquare, Edit3, Volume2, Wand2, Download } from 'lucide-react';
import { api, Task, TaskComment } from '../../lib/api';
import { UserProfile } from '../../types';
import { CollaborativeCanvas } from './CollaborativeCanvas';
import { generateSpeech, generateImageVariation } from '../../services/aiService';

interface TaskDetailModalProps {
  task: Task;
  onClose: () => void;
  currentUser: UserProfile;
  users: UserProfile[];
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({ task, onClose, currentUser, users }) => {
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [activeTab, setActiveTab] = useState<'details' | 'comments' | 'canvas' | 'ai-tools'>('details');
  const [isAddingPin, setIsAddingPin] = useState(false);
  const [tempPin, setTempPin] = useState<{x: number, y: number} | null>(null);
  const [isGeneratingSpeech, setIsGeneratingSpeech] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // AI Variation State
  const [variationPrompt, setVariationPrompt] = useState('');
  const [isGeneratingVariation, setIsGeneratingVariation] = useState(false);
  const [generatedVariation, setGeneratedVariation] = useState<string | null>(null);

  const loadComments = async () => {
    if (!task.id) return;
    setComments(await api.getComments(task.id));
  };

  useEffect(() => {
    loadComments();
    window.addEventListener('storage', loadComments);
    return () => window.removeEventListener('storage', loadComments);
  }, [task.id]);

  const handleAddComment = async () => {
    if (!newComment.trim() || !task.id) return;

    await api.addComment({
      taskId: task.id,
      userId: currentUser.uid,
      content: newComment,
      pinCoordinates: tempPin || undefined
    });
    
    setNewComment('');
    setTempPin(null);
    setIsAddingPin(false);
    await loadComments();
  };

  const handleImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
    if (!isAddingPin) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    setTempPin({ x, y });
  };

  const handleStatusChange = async (newStatus: Task['status']) => {
    await api.updateTask(task.id, { status: newStatus });
    // In a real app, we'd trigger social content generation here if needed,
    // but for the localDB version we'll keep it simple for now.
  };

  const handleAssetUrlChange = async (url: string) => {
    await api.updateTask(task.id, { assetUrl: url });
  };

  const handlePlaySpeech = async (text: string) => {
    if (isGeneratingSpeech) return;
    setIsGeneratingSpeech(true);
    try {
      const audioUrl = await generateSpeech(text);
      if (audioUrl) {
        if (audioRef.current) {
          audioRef.current.src = audioUrl;
          audioRef.current.play();
        } else {
          const audio = new Audio(audioUrl);
          audioRef.current = audio;
          audio.play();
        }
      }
    } catch (error) {
      console.error('TTS Error:', error);
    } finally {
      setIsGeneratingSpeech(false);
    }
  };

  const handleGenerateVariation = async () => {
    if (!task.assetUrl || !variationPrompt.trim()) return;
    setIsGeneratingVariation(true);
    setGeneratedVariation(null);
    try {
      const res = await fetch(task.assetUrl);
      const blob = await res.blob();
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });

      const variationUrl = await generateImageVariation(base64, variationPrompt);
      if (variationUrl) setGeneratedVariation(variationUrl);
    } catch (error) {
      console.error('Variation Error:', error);
    } finally {
      setIsGeneratingVariation(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-secondary/80 backdrop-blur-sm flex items-center justify-center p-6"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
        className="bg-white w-full max-w-5xl h-[85vh] rounded-[40px] overflow-hidden shadow-2xl flex flex-col"
      >
        {/* Header */}
        <div className="px-10 py-6 border-b border-gray-100 flex justify-between items-center bg-white z-10">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-1 rounded-md">
                {task.type}
              </span>
              <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${
                task.status === 'approved' ? 'bg-green-100 text-green-600' :
                task.status === 'review' ? 'bg-blue-100 text-blue-600' :
                'bg-yellow-100 text-yellow-600'
              }`}>
                {task.status}
              </span>
            </div>
            <h2 className="text-2xl font-bold">{task.title}</h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex bg-gray-100 p-1 rounded-xl">
              <button 
                onClick={() => setActiveTab('details')}
                className={`px-4 py-2 rounded-lg text-sm font-bold smooth-transition ${activeTab === 'details' ? 'bg-white shadow-sm text-secondary' : 'text-gray-500 hover:text-secondary'}`}
              >
                Detaylar
              </button>
              <button 
                onClick={() => setActiveTab('comments')}
                className={`px-4 py-2 rounded-lg text-sm font-bold smooth-transition flex items-center gap-2 ${activeTab === 'comments' ? 'bg-white shadow-sm text-secondary' : 'text-gray-500 hover:text-secondary'}`}
              >
                <MessageSquare size={16} />
                Yorumlar ({comments.length})
              </button>
              {task.assetUrl && (
                <>
                  <button 
                    onClick={() => setActiveTab('canvas')}
                    className={`px-4 py-2 rounded-lg text-sm font-bold smooth-transition flex items-center gap-2 ${activeTab === 'canvas' ? 'bg-white shadow-sm text-secondary' : 'text-gray-500 hover:text-secondary'}`}
                  >
                    <Edit3 size={16} />
                    Canlı Tahta
                  </button>
                  <button 
                    onClick={() => setActiveTab('ai-tools')}
                    className={`px-4 py-2 rounded-lg text-sm font-bold smooth-transition flex items-center gap-2 ${activeTab === 'ai-tools' ? 'bg-white shadow-sm text-secondary' : 'text-gray-500 hover:text-secondary'}`}
                  >
                    <Wand2 size={16} />
                    AI Araçları
                  </button>
                </>
              )}
            </div>
            <button onClick={() => { onClose(); window.dispatchEvent(new Event('storage')); }} className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 smooth-transition">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex">
          {activeTab === 'details' ? (
            <div className="flex-1 overflow-y-auto p-10 space-y-8">
              <div className="grid grid-cols-3 gap-8">
                <div className="col-span-2 space-y-8">
                  <div className="bg-accent p-8 rounded-[32px]">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="font-bold text-primary">Brief Açıklaması</h4>
                      <button 
                        onClick={() => handlePlaySpeech(task.description)}
                        disabled={isGeneratingSpeech}
                        className="p-2 bg-white rounded-full text-primary hover:bg-primary hover:text-white smooth-transition shadow-sm disabled:opacity-50"
                      >
                        <Volume2 size={18} className={isGeneratingSpeech ? "animate-pulse" : ""} />
                      </button>
                    </div>
                    <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{task.description}</p>
                  </div>

                  {task.assetUrl && (
                    <div className="bg-accent p-8 rounded-[32px]">
                      <h4 className="font-bold text-primary mb-4">Tasarım Çıktısı</h4>
                      <div className="relative rounded-2xl overflow-hidden border border-gray-200 bg-white">
                        <img src={task.assetUrl} alt="Asset" className="w-full h-auto object-contain max-h-[400px]" referrerPolicy="no-referrer" />
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-6">
                  <div className="bg-accent p-6 rounded-3xl">
                    <h4 className="font-bold text-primary mb-2 text-sm">Durum Güncelle</h4>
                    <select 
                      value={task.status}
                      onChange={(e) => handleStatusChange(e.target.value as Task['status'])}
                      className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 font-bold outline-none focus:ring-2 focus:ring-primary"
                      disabled={currentUser.role === 'client' && task.status !== 'review'}
                    >
                      <option value="brief">Brief Bekliyor</option>
                      <option value="designing">Tasarımda</option>
                      <option value="review">Müşteri Onayında</option>
                      <option value="revision">Revizyon</option>
                      <option value="approved">Tamamlandı</option>
                    </select>
                  </div>

                  {(currentUser.role === 'admin' || currentUser.role === 'designer') && (
                    <div className="bg-accent p-6 rounded-3xl">
                      <h4 className="font-bold text-primary mb-2 text-sm">Varlık URL (Asset)</h4>
                      <input 
                        type="text" 
                        placeholder="Tasarım linkini yapıştırın..."
                        defaultValue={task.assetUrl}
                        onBlur={(e) => handleAssetUrlChange(e.target.value)}
                        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : activeTab === 'canvas' && task.assetUrl ? (
            <div className="flex-1 p-6 bg-gray-50 overflow-hidden">
               <CollaborativeCanvas taskId={task.id} assetUrl={task.assetUrl} currentUser={currentUser} />
            </div>
          ) : activeTab === 'ai-tools' && task.assetUrl ? (
            <div className="flex-1 overflow-y-auto p-10">
              <div className="max-w-4xl mx-auto space-y-8">
                <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                      <Wand2 size={32} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">AI Varyasyon Motoru</h2>
                      <p className="text-gray-500">Mevcut tasarım üzerinden yeni alternatifler üretin.</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <h3 className="font-bold text-sm text-gray-500 uppercase tracking-wider mb-4">Orijinal</h3>
                      <div className="aspect-square rounded-2xl overflow-hidden bg-accent border border-gray-200">
                        <img src={task.assetUrl} alt="Original" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                      </div>
                    </div>
                    <div className="flex flex-col">
                      <textarea
                        value={variationPrompt}
                        onChange={(e) => setVariationPrompt(e.target.value)}
                        placeholder="Değişiklik isteğinizi yazın..."
                        className="w-full h-32 p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-primary resize-none mb-4"
                      />
                      <button
                        onClick={handleGenerateVariation}
                        disabled={isGeneratingVariation || !variationPrompt.trim()}
                        className="w-full py-4 bg-primary text-white rounded-2xl font-bold hover:bg-primary/90 disabled:opacity-50 smooth-transition"
                      >
                        {isGeneratingVariation ? 'Üretiliyor...' : 'Varyasyon Oluştur'}
                      </button>
                      {generatedVariation && (
                        <div className="mt-4">
                          <img src={generatedVariation} alt="Variation" className="w-full rounded-xl" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex overflow-hidden">
              <div className="flex-1 bg-gray-50 p-6 overflow-y-auto flex flex-col items-center justify-center relative border-r border-gray-100">
                {task.assetUrl ? (
                  <div className="relative inline-block max-w-full">
                    <img 
                      src={task.assetUrl} alt="Asset" 
                      className={`max-w-full h-auto rounded-lg shadow-sm ${isAddingPin ? 'cursor-crosshair' : ''}`}
                      onClick={handleImageClick}
                      referrerPolicy="no-referrer"
                    />
                    {comments.filter(c => c.pinCoordinates).map((comment, idx) => (
                      <div 
                        key={comment.id}
                        className="absolute w-6 h-6 -ml-3 -mt-3 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold shadow-md"
                        style={{ left: `${comment.pinCoordinates!.x}%`, top: `${comment.pinCoordinates!.y}%` }}
                      >
                        {idx + 1}
                      </div>
                    ))}
                    {tempPin && (
                      <div 
                        className="absolute w-6 h-6 -ml-3 -mt-3 bg-yellow-400 text-white rounded-full flex items-center justify-center text-xs font-bold shadow-md animate-pulse"
                        style={{ left: `${tempPin.x}%`, top: `${tempPin.y}%` }}
                      />
                    )}
                  </div>
                ) : <p className="text-gray-400">Görsel bulunamadı.</p>}
              </div>
              <div className="w-96 bg-white flex flex-col">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                  <h3 className="font-bold text-sm">Yorumlar ({comments.length})</h3>
                  {task.assetUrl && (
                    <button 
                      onClick={() => { setIsAddingPin(!isAddingPin); setTempPin(null); }}
                      className={`text-xs font-bold px-3 py-1.5 rounded-lg ${isAddingPin ? 'bg-primary text-white' : 'bg-white border text-gray-600'}`}
                    >
                      <MapPin size={14} /> {isAddingPin ? 'İptal' : 'Pin Ekle'}
                    </button>
                  )}
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {comments.map((comment, idx) => {
                    const isMe = comment.userId === currentUser.uid;
                    return (
                      <div key={comment.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                        <span className="text-xs font-bold text-gray-500 mb-1">{isMe ? 'Sen' : 'Ekip'}</span>
                        <div className={`max-w-[85%] p-3 rounded-2xl text-sm relative ${isMe ? 'bg-primary text-white' : 'bg-accent text-secondary'}`}>
                          {comment.pinCoordinates && (
                            <div className="absolute -left-2 -top-2 w-5 h-5 rounded-full bg-white text-primary border flex items-center justify-center text-[10px] font-bold">
                              {idx + 1}
                            </div>
                          )}
                          {comment.content}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="p-4 border-t border-gray-100">
                  <div className="flex items-end gap-2">
                    <textarea 
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Mesaj yazın..."
                      className="flex-1 bg-accent rounded-xl p-3 text-sm resize-none outline-none h-20"
                    />
                    <button onClick={handleAddComment} className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center">
                      <Send size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};
