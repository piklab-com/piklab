import React, { useState, useEffect, useRef } from 'react';
import { Stage, Layer, Image as KonvaImage, Circle, Text, Group } from 'react-konva';
import useImage from 'use-image';
import { api, CanvasPin } from '../../lib/api';
import { motion, AnimatePresence } from 'motion/react';
import { MousePointer2, MessageSquare, X, Send } from 'lucide-react';

interface CanvasProps {
  taskId: string;
  assetUrl: string;
  currentUser: any;
}

interface Cursor {
  userId: string;
  userName: string;
  x: number;
  y: number;
  color: string;
  lastUpdate: number;
}

const COLORS = ['#FF6321', '#3B82F6', '#10B981', '#8B5CF6', '#EC4899'];

export const CollaborativeCanvas: React.FC<CanvasProps> = ({ taskId, assetUrl, currentUser }) => {
  const [image] = useImage(assetUrl, 'anonymous');
  const [pins, setPins] = useState<CanvasPin[]>([]);
  const [cursors, setCursors] = useState<Record<string, Cursor>>({});
  const [isAddingPin, setIsAddingPin] = useState(false);
  const [tempPin, setTempPin] = useState<{x: number, y: number} | null>(null);
  const [newComment, setNewComment] = useState('');
  const [stageSize, setStageSize] = useState({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<any>(null);
  
  // Multi-tab cursor syncing via BroadcastChannel
  const channelRef = useRef<BroadcastChannel | null>(null);

  const myColor = COLORS[currentUser.uid.charCodeAt(0) % COLORS.length];

  const loadPins = async () => {
    if (!taskId) return;
    setPins(await api.getCanvasPins(taskId));
  };

  useEffect(() => {
    loadPins();
    window.addEventListener('storage', loadPins);
    
    // Setup multi-tab sync
    channelRef.current = new BroadcastChannel(`piklab_canvas_${taskId}`);
    channelRef.current.onmessage = (event) => {
      const { type, data } = event.data;
      if (type === 'cursor' && data.userId !== currentUser.uid) {
        setCursors(prev => ({ ...prev, [data.userId]: data }));
      }
    };

    return () => {
      window.removeEventListener('storage', loadPins);
      channelRef.current?.close();
    };
  }, [taskId, currentUser.uid]);

  useEffect(() => {
    const checkSize = () => {
      if (containerRef.current) {
        setStageSize({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight
        });
      }
    };
    checkSize();
    window.addEventListener('resize', checkSize);
    return () => window.removeEventListener('resize', checkSize);
  }, []);

  const handleMouseMove = (e: any) => {
    if (!stageRef.current || !channelRef.current) return;
    const stage = stageRef.current;
    const pointerPosition = stage.getPointerPosition();
    
    if (pointerPosition) {
      const x = (pointerPosition.x / stageSize.width) * 100;
      const y = (pointerPosition.y / stageSize.height) * 100;
      
      channelRef.current.postMessage({
        type: 'cursor',
        data: {
          userId: currentUser.uid,
          userName: currentUser.displayName || 'Kullanıcı',
          x, y, color: myColor, lastUpdate: Date.now()
        }
      });
    }
  };

  const handleStageClick = (e: any) => {
    if (!isAddingPin) return;
    const stage = e.target.getStage();
    const pointerPosition = stage.getPointerPosition();
    if (pointerPosition) {
      const x = (pointerPosition.x / stageSize.width) * 100;
      const y = (pointerPosition.y / stageSize.height) * 100;
      setTempPin({ x, y });
    }
  };

  const submitPin = async () => {
    if (!tempPin || !newComment.trim()) return;
    await api.addCanvasPin({
      taskId,
      ...tempPin,
      userId: currentUser.uid,
      userName: currentUser.displayName || 'Kullanıcı',
      comment: newComment,
    });
    setTempPin(null);
    setNewComment('');
    setIsAddingPin(false);
    await loadPins();
  };

  let imageProps = { x: 0, y: 0, width: 0, height: 0 };
  if (image && stageSize.width && stageSize.height) {
    const scale = Math.min(stageSize.width / image.width, stageSize.height / image.height);
    imageProps = {
      x: (stageSize.width - image.width * scale) / 2,
      y: (stageSize.height - image.height * scale) / 2,
      width: image.width * scale,
      height: image.height * scale
    };
  }

  return (
    <div className="flex flex-col h-full bg-gray-50 rounded-3xl overflow-hidden border border-gray-200">
      <div className="bg-white p-4 border-b border-gray-200 flex justify-between items-center z-10">
        <div className="flex items-center gap-4">
          <h3 className="font-bold text-gray-800">Canlı Tasarım Tahtası</h3>
          <div className="flex -space-x-2">
            <div className="w-8 h-8 rounded-full bg-primary border-2 border-white flex items-center justify-center text-white text-xs font-bold" title={currentUser.displayName}>
              {currentUser.displayName?.[0] || 'U'}
            </div>
            {Object.values(cursors).map(cursor => (
              <div key={cursor.userId} className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: cursor.color }} title={cursor.userName}>
                {cursor.userName?.[0] || 'U'}
              </div>
            ))}
          </div>
        </div>
        <button 
          onClick={() => { setIsAddingPin(!isAddingPin); setTempPin(null); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm smooth-transition ${isAddingPin ? 'bg-primary text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
        >
          <MessageSquare size={16} />
          {isAddingPin ? 'İptal' : 'Yorum Ekle'}
        </button>
      </div>

      <div className="flex-1 relative flex" ref={containerRef}>
        {stageSize.width > 0 && (
          <Stage 
            width={stageSize.width} height={stageSize.height}
            onMouseMove={handleMouseMove} onClick={handleStageClick}
            ref={stageRef} className={isAddingPin ? 'cursor-crosshair' : 'cursor-default'}
          >
            <Layer>
              {image && <KonvaImage image={image} {...imageProps} />}
              {pins.map((pin, index) => (
                <Group key={pin.id} x={(pin.x / 100) * stageSize.width} y={(pin.y / 100) * stageSize.height}>
                  <Circle radius={12} fill={pin.userId === currentUser.uid ? '#FF6321' : '#141414'} shadowBlur={5} shadowOpacity={0.3} />
                  <Text text={(index + 1).toString()} fill="white" fontSize={12} fontStyle="bold" x={-4} y={-5} />
                </Group>
              ))}
              {tempPin && (
                <Group x={(tempPin.x / 100) * stageSize.width} y={(tempPin.y / 100) * stageSize.height}>
                  <Circle radius={12} fill="#EAB308" shadowBlur={5} shadowOpacity={0.3} />
                </Group>
              )}
              {Object.values(cursors).map(cursor => (
                <Group key={cursor.userId} x={(cursor.x / 100) * stageSize.width} y={(cursor.y / 100) * stageSize.height}>
                  <Circle radius={4} fill={cursor.color} />
                  <Text text={cursor.userName} fill="rgba(0,0,0,0.5)" fontSize={10} fontStyle="bold" y={10} x={10} />
                </Group>
              ))}
            </Layer>
          </Stage>
        )}

        <AnimatePresence>
          {tempPin && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="absolute z-20 bg-white rounded-2xl shadow-xl border border-gray-100 p-4 w-72"
              style={{ 
                left: Math.min(Math.max(10, (tempPin.x / 100) * stageSize.width + 15), stageSize.width - 290), 
                top: Math.min(Math.max(10, (tempPin.y / 100) * stageSize.height + 15), stageSize.height - 150) 
              }}
            >
              <textarea 
                autoFocus value={newComment} onChange={(e) => setNewComment(e.target.value)}
                placeholder="Yorumunuzu yazın..."
                className="w-full bg-gray-50 border-none rounded-xl p-3 text-sm resize-none outline-none h-20 mb-3"
              />
              <button onClick={submitPin} disabled={!newComment.trim()}
                className="w-full py-2 bg-primary text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2">
                <Send size={14} /> Gönder
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      <div className="bg-white border-t border-gray-200 h-48 overflow-y-auto p-4">
        <h4 className="font-bold text-sm text-gray-500 mb-4 uppercase tracking-wider">Pin Yorumları</h4>
        {pins.length === 0 ? (
          <p className="text-sm text-gray-400 text-center mt-8">Henüz yorum yok.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pins.map((pin, index) => (
              <div key={pin.id} className="flex gap-3 bg-gray-50 p-3 rounded-xl border border-gray-100">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${pin.userId === currentUser.uid ? 'bg-primary' : 'bg-gray-800'}`}>
                  {index + 1}
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-700">{pin.userName}</p>
                  <p className="text-sm text-gray-600">{pin.comment}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
