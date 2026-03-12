import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, MicOff, X, MessageSquare, Volume2, VolumeX, Sparkles, Loader2 } from 'lucide-react';
import { GoogleGenAI, Modality, LiveServerMessage } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export const LiveAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [transcription, setTranscription] = useState<string[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  const sessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const audioQueueRef = useRef<Int16Array[]>([]);
  const nextStartTimeRef = useRef<number>(0);

  const toggleAssistant = () => {
    if (isOpen) {
      disconnect();
    } else {
      setIsOpen(true);
    }
  };

  const connect = async () => {
    setIsConnecting(true);
    try {
      audioContextRef.current = new AudioContext({ sampleRate: 16000 });
      streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const session = await ai.live.connect({
        model: "gemini-2.5-flash-native-audio-preview-09-2025",
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } },
          },
          systemInstruction: "Sen Piklab'ın akıllı asistanısın. Müşterilere kampanya fikirleri bulmalarında, brief oluşturmalarında ve ajans hizmetleri hakkında bilgi almalarında yardımcı oluyorsun. Nazik, yaratıcı ve profesyonelsin. Konuşmanın sonunda önemli noktaları özetle.",
          inputAudioTranscription: {},
          outputAudioTranscription: {},
        },
        callbacks: {
          onopen: () => {
            setIsConnected(true);
            setIsConnecting(false);
            startStreaming();
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.serverContent?.modelTurn?.parts) {
              const audioPart = message.serverContent.modelTurn.parts.find(p => p.inlineData);
              if (audioPart?.inlineData?.data) {
                const base64Audio = audioPart.inlineData.data;
                const binaryString = window.atob(base64Audio);
                const bytes = new Int16Array(binaryString.length / 2);
                for (let i = 0; i < bytes.length; i++) {
                  bytes[i] = (binaryString.charCodeAt(i * 2) | (binaryString.charCodeAt(i * 2 + 1) << 8));
                }
                playAudioChunk(bytes);
              }

              const textPart = message.serverContent.modelTurn.parts.find(p => p.text);
              if (textPart?.text) {
                setTranscription(prev => [...prev, `AI: ${textPart.text}`]);
              }
            }

            if (message.serverContent?.interrupted) {
              stopPlayback();
            }
          },
          onclose: () => {
            setIsConnected(false);
            setIsOpen(false);
          },
          onerror: (error) => {
            console.error("Live API Error:", error);
            setIsConnecting(false);
          }
        }
      });

      sessionRef.current = session;
    } catch (error) {
      console.error("Connection Error:", error);
      setIsConnecting(false);
    }
  };

  const disconnect = () => {
    if (sessionRef.current) {
      sessionRef.current.close();
    }
    stopStreaming();
    stopPlayback();
    setIsConnected(false);
    setIsOpen(false);
    setTranscription([]);
  };

  const startStreaming = () => {
    if (!streamRef.current || !audioContextRef.current) return;

    const source = audioContextRef.current.createMediaStreamSource(streamRef.current);
    processorRef.current = audioContextRef.current.createScriptProcessor(4096, 1, 1);

    processorRef.current.onaudioprocess = (e) => {
      if (isMuted) return;
      
      const inputData = e.inputBuffer.getChannelData(0);
      const pcmData = new Int16Array(inputData.length);
      for (let i = 0; i < inputData.length; i++) {
        pcmData[i] = Math.max(-1, Math.min(1, inputData[i])) * 0x7FFF;
      }
      
      const base64Data = btoa(String.fromCharCode(...new Uint8Array(pcmData.buffer)));
      sessionRef.current?.sendRealtimeInput({
        media: { data: base64Data, mimeType: 'audio/pcm;rate=16000' }
      });
    };

    source.connect(processorRef.current);
    processorRef.current.connect(audioContextRef.current.destination);
  };

  const stopStreaming = () => {
    streamRef.current?.getTracks().forEach(track => track.stop());
    processorRef.current?.disconnect();
  };

  const playAudioChunk = (pcmData: Int16Array) => {
    if (!audioContextRef.current) return;

    const buffer = audioContextRef.current.createBuffer(1, pcmData.length, 24000);
    const channelData = buffer.getChannelData(0);
    for (let i = 0; i < pcmData.length; i++) {
      channelData[i] = pcmData[i] / 0x7FFF;
    }

    const source = audioContextRef.current.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContextRef.current.destination);

    const startTime = Math.max(audioContextRef.current.currentTime, nextStartTimeRef.current);
    source.start(startTime);
    nextStartTimeRef.current = startTime + buffer.duration;
    
    setIsSpeaking(true);
    source.onended = () => {
      if (audioContextRef.current?.currentTime! >= nextStartTimeRef.current - 0.1) {
        setIsSpeaking(false);
      }
    };
  };

  const stopPlayback = () => {
    nextStartTimeRef.current = 0;
    setIsSpeaking(false);
  };

  return (
    <div className="fixed bottom-8 right-8 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="absolute bottom-20 right-0 w-80 bg-white rounded-[40px] shadow-2xl border border-gray-100 overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="bg-primary p-6 text-white flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
                  <Sparkles size={20} />
                </div>
                <div>
                  <h3 className="font-bold">Piklab AI</h3>
                  <p className="text-[10px] opacity-70 uppercase tracking-widest">Canlı Asistan</p>
                </div>
              </div>
              <button onClick={disconnect} className="p-2 hover:bg-white/10 rounded-xl smooth-transition">
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 p-6 min-h-[300px] flex flex-col items-center justify-center text-center">
              {!isConnected ? (
                <div className="space-y-4">
                  <div className="w-20 h-20 rounded-full bg-primary/5 flex items-center justify-center mx-auto">
                    {isConnecting ? (
                      <Loader2 className="animate-spin text-primary" size={32} />
                    ) : (
                      <Mic className="text-primary" size={32} />
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-800">Brief Vermeye Hazır mısın?</h4>
                    <p className="text-sm text-gray-500 mt-2">Konuşarak fikirlerini paylaş, AI anında brief oluştursun.</p>
                  </div>
                  <button
                    onClick={connect}
                    disabled={isConnecting}
                    className="px-8 py-3 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 smooth-transition disabled:opacity-50"
                  >
                    {isConnecting ? 'Bağlanıyor...' : 'Bağlan ve Konuş'}
                  </button>
                </div>
              ) : (
                <div className="w-full space-y-8">
                  {/* Visualizer Animation */}
                  <div className="flex items-center justify-center gap-1 h-12">
                    {[...Array(5)].map((_, i) => (
                      <motion.div
                        key={i}
                        animate={{
                          height: isSpeaking ? [10, 40, 10] : [10, 15, 10],
                        }}
                        transition={{
                          duration: 0.5,
                          repeat: Infinity,
                          delay: i * 0.1,
                        }}
                        className="w-1.5 bg-primary rounded-full"
                      />
                    ))}
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-400 uppercase tracking-widest">Şu an Dinliyor</p>
                    <p className="text-lg font-bold text-gray-800">"Yeni koleksiyon için fikirlerini anlat..."</p>
                  </div>

                  <div className="flex items-center justify-center gap-4">
                    <button
                      onClick={() => setIsMuted(!isMuted)}
                      className={`p-4 rounded-2xl smooth-transition ${isMuted ? 'bg-red-50 text-red-500' : 'bg-gray-50 text-gray-600'}`}
                    >
                      {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
                    </button>
                    <button
                      onClick={disconnect}
                      className="p-4 bg-red-500 text-white rounded-2xl shadow-lg shadow-red-200 hover:scale-110 smooth-transition"
                    >
                      <X size={24} />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-gray-50 border-t border-gray-100">
              <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-300'}`} />
                {isConnected ? 'Bağlantı Aktif' : 'Çevrimdışı'}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={toggleAssistant}
        className={`w-16 h-16 rounded-[24px] shadow-2xl flex items-center justify-center smooth-transition hover:scale-110 active:scale-90 ${isOpen ? 'bg-white text-primary border border-gray-100' : 'bg-primary text-white'}`}
      >
        {isOpen ? <X size={28} /> : <MessageSquare size={28} />}
        {!isOpen && (
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"
          />
        )}
      </button>
    </div>
  );
};
