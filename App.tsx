import React, { useState, useCallback } from 'react';
import { Settings, Play, Square, Video, Download, RotateCcw } from 'lucide-react';
import { PrompterConfig, RecordingStatus } from './types';
import VideoRecorder from './VideoRecorder';
import Teleprompter from './Teleprompter';
import ControlPanel from './ControlPanel';

const App: React.FC = () => {
  const [config, setConfig] = useState<PrompterConfig>({
    script: "Bem-vindo ao Teleprompter!\n\nAjuste a velocidade nas configurações.\n\nToque em GRAVAR para começar o seu vídeo.",
    speed: 2,
    fontSize: 28,
    mirror: false,
    opacity: 0.8,
    fileName: 'meu-video'
  });

  const [status, setStatus] = useState<RecordingStatus>('idle');
  const [showSettings, setShowSettings] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  
  // Guarda o vídeo após a gravação
  const [videoGravado, setVideoGravado] = useState<{ blob: Blob; url: string } | null>(null);

  const startRecording = useCallback(() => {
    setVideoGravado(null);
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

  // Quando o vídeo fica pronto, desliga a gravação e guarda o arquivo
  const handleVideoPronto = useCallback((blob: Blob, url: string) => {
    setStatus('idle');
    setVideoGravado({ blob, url });
  }, []);

  // Função para salvar na Galeria (celular) ou baixar (Mac/PC)
  const handleSalvar = async () => {
    if (!videoGravado) return;

    const nomeArquivo = `video_${Date.now()}.mp4`;
    const file = new File([videoGravado.blob], nomeArquivo, { type: videoGravado.blob.type });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: 'Meu Vídeo Gravado'
        });
        return;
      } catch (err) {
        console.log("Compartilhamento cancelado");
      }
    }

    const a = document.createElement('a');
    a.href = videoGravado.url;
    a.download = nomeArquivo;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="flex flex-col h-screen w-full bg-slate-950 overflow-hidden text-white">
      
      {/* Menu Configurações */}
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

        {!videoGravado && status !== 'recording' && (
          <button 
            onClick={() => setShowSettings(true)}
            className="p-2 bg-slate-800 border border-slate-700 rounded-full text-slate-200"
          >
            <Settings className="w-4 h-4" />
          </button>
        )}
      </header>

      {/* Meio: Câmera OU Vídeo Gravado */}
      <main className="relative flex-1 w-full p-2 flex items-center justify-center overflow-hidden">
        <div className="relative w-full h-full rounded-2xl overflow-hidden border border-slate-800 bg-black flex items-center justify-center shadow-2xl">
          
          {videoGravado ? (
            /* SE TERMINOU DE GRAVAR: A câmera desliga e toca o vídeo gravado */
            <div className="w-full h-full flex flex-col items-center justify-center bg-black p-2">
              <video 
                src={videoGravado.url} 
                controls 
                autoPlay 
                playsInline 
                className="w-full h-full object-contain rounded-xl"
              />
            </div>
          ) : (
            /* SE NÃO TEM VÍDEO PRONTO: Mostra a câmera ao vivo com o Teleprompter */
            <>
              <VideoRecorder 
                status={status} 
                config={config} 
                onVideoPronto={handleVideoPronto}
              />
              <Teleprompter 
                config={config} 
                isScrolling={status === 'recording'} 
              />
            </>
          )}

          {/* Contagem regressiva */}
          {countdown !== null && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
              <span className="text-8xl font-black text-white">{countdown}</span>
            </div>
          )}
        </div>
      </main>

      {/* RODAPÉ COM OS BOTÕES */}
      <footer className="w-full p-4 flex items-center justify-center gap-3 z-30 bg-slate-950 border-t border-slate-900">
        {videoGravado ? (
          /* SE O VÍDEO ESTÁ PRONTO: O botão GRAVAR some, e só aparecem estes dois lado a lado */
          <div className="flex gap-3 w-full max-w-sm">
            <button 
              onClick={handleSalvar}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-sm shadow-lg shadow-blue-900/40 active:scale-95 transition-all"
            >
              <Download className="w-5 h-5" />
              SALVAR VÍDEO
            </button>
            <button 
              onClick={() => setVideoGravado(null)}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-sm active:scale-95 transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              GRAVAR OUTRO
            </button>
          </div>
        ) : status === 'recording' ? (
          /* SE ESTÁ GRAVANDO: Só o botão PARAR */
          <button 
            onClick={stopRecording}
            className="w-full max-w-xs flex items-center justify-center gap-2 py-3.5 bg-white text-slate-950 font-bold rounded-full text-base shadow-xl active:scale-95 transition-all"
          >
            <Square className="w-5 h-5 fill-current text-red-600" />
            PARAR
          </button>
        ) : (
          /* SE ESTÁ PARADO: Só o botão GRAVAR */
          <button 
            onClick={startRecording}
            disabled={status !== 'idle'}
            className="w-full max-w-xs flex items-center justify-center gap-2 py-3.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-full text-base shadow-lg shadow-red-900/40 active:scale-95 transition-all"
          >
            <Play className="w-5 h-5 fill-current" />
            GRAVAR
          </button>
        )}
      </footer>

    </div>
  );
};

export default App;
