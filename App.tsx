import React, { useState, useCallback } from 'react';
import { Settings, Play, Square, Video, Download } from 'lucide-react';
import { PrompterConfig, RecordingStatus } from './types';
import VideoRecorder from './VideoRecorder';
import Teleprompter from './Teleprompter';
import ControlPanel from './ControlPanel';

const App: React.FC = () => {
  const [config, setConfig] = useState<PrompterConfig>({
    script: "Bem-vindo ao Teleprompter!\n\nToque no botão vermelho para gravar e no branco para parar.\n\nDepois clique no botão azul ao lado para salvar.",
    speed: 2,
    fontSize: 28,
    mirror: false,
    opacity: 0.8,
    fileName: 'meu-video'
  });

  const [status, setStatus] = useState<RecordingStatus>('idle');
  const [showSettings, setShowSettings] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [videoSalvo, setVideoSalvo] = useState<{ blob: Blob; url: string } | null>(null);

  const startRecording = useCallback(() => {
    setVideoSalvo(null);
    let count = 3;
    setCountdown(count);
    setStatus('starting');
    
    const interval = setInterval(() => {
      count -= 1;
      if (count > 0) {
        setCountdown(count);
      } else {
        clearInterval(interval);
        setCountdown(null);
        setStatus('recording');
      }
    }, 1000);
  }, []);

  const stopRecording = useCallback(() => {
    setStatus('stopping');
  }, []);

  const handleVideoPronto = useCallback((blob: Blob, url: string) => {
    setStatus('idle');
    setVideoSalvo({ blob, url });
  }, []);

  // Salvar no celular ou baixar no Mac
  const handleSalvar = async () => {
    if (!videoSalvo) return;

    const nomeArquivo = `video_${Date.now()}.mp4`;
    const file = new File([videoSalvo.blob], nomeArquivo, { type: 'video/mp4' });

    // Se estiver no celular, abre para salvar na galeria
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: 'Meu Vídeo'
        });
        return;
      } catch (err) {
        console.log("Compartilhamento cancelado");
      }
    }

    // Se estiver no Mac ou navegador comum, faz download direto
    const a = document.createElement('a');
    a.href = videoSalvo.url;
    a.download = nomeArquivo;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="flex flex-col h-screen w-full bg-slate-950 overflow-hidden text-white">
      
      {/* Menu Lateral de Configurações */}
      <aside 
        className={`fixed inset-0 h-full z-50 transition-all duration-300 border-r border-slate-800 bg-slate-950 ${
          showSettings ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <ControlPanel 
          config={config} 
          setConfig={setConfig} 
          status={status}
          onClose={() => setShowSettings(false)}
        />
      </aside>

      {/* Topo */}
      <header className="w-full flex items-center justify-between p-3 z-20 border-b border-slate-900">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-600 rounded-lg">
            <Video className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-sm">ProPrompter</span>
        </div>

        {status !== 'recording' && (
          <button 
            onClick={() => setShowSettings(true)}
            className="p-2 bg-slate-800 border border-slate-700 rounded-full text-slate-200"
          >
            <Settings className="w-4 h-4" />
          </button>
        )}
      </header>

      {/* Meio: Câmera com Teleprompter */}
      <main className="relative flex-1 w-full p-2 flex items-center justify-center overflow-hidden">
        <div className="relative w-full h-full rounded-2xl overflow-hidden border border-slate-800 bg-black flex items-center justify-center">
          
          <VideoRecorder 
            status={status} 
            config={config} 
            onVideoPronto={handleVideoPronto}
          />
          
          <Teleprompter 
            config={config} 
            isScrolling={status === 'recording'} 
          />

          {countdown !== null && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
              <span className="text-8xl font-black text-white">{countdown}</span>
            </div>
          )}
        </div>
      </main>

      {/* RODAPÉ COM OS BOTÕES LADO A LADO */}
      <footer className="w-full p-4 flex items-center justify-center gap-4 z-30 bg-slate-950 border-t border-slate-900">
        
        {/* BOTÃO 1: GRAVAR OU PARAR */}
        {status === 'recording' ? (
          <button 
            onClick={stopRecording}
            className="flex-1 max-w-[180px] flex items-center justify-center gap-2 py-3.5 bg-white text-slate-950 font-bold rounded-xl text-sm shadow-xl active:scale-95 transition-all"
          >
            <Square className="w-4 h-4 fill-current text-red-600" />
            PARAR
          </button>
        ) : (
          <button 
            onClick={startRecording}
            disabled={status !== 'idle'}
            className="flex-1 max-w-[180px] flex items-center justify-center gap-2 py-3.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-sm shadow-lg shadow-red-900/40 active:scale-95 transition-all"
          >
            <Play className="w-4 h-4 fill-current" />
            GRAVAR
          </button>
        )}

        {/* BOTÃO 2: SALVAR (FICA AO LADO DO BOTÃO DE GRAVAR) */}
        <button 
          onClick={handleSalvar}
          disabled={!videoSalvo || status === 'recording'}
          className={`flex-1 max-w-[180px] flex items-center justify-center gap-2 py-3.5 font-bold rounded-xl text-sm transition-all ${
            videoSalvo && status !== 'recording'
              ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/40 active:scale-95'
              : 'bg-slate-800/50 text-slate-500 border border-slate-800 cursor-not-allowed'
          }`}
        >
          <Download className="w-4 h-4" />
          {videoSalvo ? 'SALVAR VÍDEO' : 'SEM VÍDEO'}
        </button>

      </footer>

    </div>
  );
};

export default App;
