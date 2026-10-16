import React, { useEffect, useRef, useState, useCallback } from 'react';
import { RecordingStatus, PrompterConfig } from '../types';
import { AlertCircle, Download, CheckCircle2, ShieldAlert } from 'lucide-react';

interface VideoRecorderProps {
  status: RecordingStatus;
  config: PrompterConfig;
  onFinished: () => void;
}

const VideoRecorder: React.FC<VideoRecorderProps> = ({ status, config, onFinished }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [chunks, setChunks] = useState<Blob[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isSecure, setIsSecure] = useState<boolean>(true);

  // Iniciar Câmera de forma Segura (à prova de falhas)
  const startCamera = useCallback(async () => {
    try {
      // 1. Verifica se o navegador suporta câmera neste endereço
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setIsSecure(false);
        setError("O navegador do celular bloqueou a câmera porque o endereço não tem HTTPS (cadeado de segurança).");
        return;
      }

      // 2. Tenta abrir a câmera frontal
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: true
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(console.error);
        };
      }
      setError(null);
    } catch (err: any) {
      console.error("Erro na câmera:", err);
      setError("Permissão de câmera negada. Toque em 'Permitir' nas permissões do navegador.");
    }
  }, []);

  useEffect(() => {
    startCamera();
    return () => {
      stream?.getTracks().forEach(track => track.stop());
    };
  }, [startCamera]);

  // Gravação
  useEffect(() => {
    if (status === 'recording' && stream) {
      try {
        setChunks([]);
        setVideoUrl(null);

        // Escolhe o formato aceito pelo celular
        let options: MediaRecorderOptions | undefined = undefined;
        if (typeof MediaRecorder !== 'undefined') {
          if (MediaRecorder.isTypeSupported('video/mp4')) {
            options = { mimeType: 'video/mp4' };
          } else if (MediaRecorder.isTypeSupported('video/webm')) {
            options = { mimeType: 'video/webm' };
          }
        }

        const recorder = new MediaRecorder(stream, options);

        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            setChunks((prev) => [...prev, e.data]);
          }
        };

        recorder.start(1000);
        mediaRecorderRef.current = recorder;
      } catch (err) {
        console.error("Erro ao iniciar gravação:", err);
      }
    } else if (status === 'stopping' && mediaRecorderRef.current) {
      if (mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      mediaRecorderRef.current = null;
    }
  }, [status, stream]);

  // Finalização do vídeo
  useEffect(() => {
    if (status === 'stopping' && chunks.length > 0) {
      const type = chunks[0].type || 'video/mp4';
      const blob = new Blob(chunks, { type });
      const url = URL.createObjectURL(blob);
      setVideoUrl(url);
      onFinished();
    }
  }, [chunks, status, onFinished]);

  const handleDownload = () => {
    if (!videoUrl) return;
    const a = document.createElement('a');
    a.href = videoUrl;
    a.download = `${config.fileName || 'gravacao'}.mp4`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setVideoUrl(null);
  };

  return (
    <div className="relative w-full h-full bg-slate-950 flex items-center justify-center overflow-hidden">
      
      {/* Se der erro de permissão ou falta de HTTPS, exibe este aviso em vez de travar */}
      {error ? (
        <div className="text-center p-6 bg-slate-900 border border-slate-800 rounded-2xl max-w-xs m-4 z-30 shadow-xl">
          {isSecure ? (
            <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
          ) : (
            <ShieldAlert className="w-12 h-12 text-red-500 mx-auto mb-3" />
          )}
          
          <h3 className="text-base font-bold text-white mb-2">
            {isSecure ? "Acesso à Câmera" : "Conexão Insegura (Sem HTTPS)"}
          </h3>
          
          <p className="text-slate-300 text-xs mb-4 leading-relaxed">
            {error}
          </p>

          <button 
            onClick={startCamera}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold"
          >
            Tentar Conectar Câmera
          </button>
        </div>
      ) : (
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          webkit-playsinline="true"
          className={`w-full h-full object-cover ${config.mirror ? 'scale-x-[-1]' : ''}`}
        />
      )}

      {/* Janela de Conclusão */}
      {videoUrl && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl max-w-xs w-full text-center">
            <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto mb-3" />
            <h2 className="text-lg font-bold text-white mb-1">Vídeo Gravado!</h2>
            <div className="space-y-2 mt-4">
              <button 
                onClick={handleDownload}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white font-bold py-2.5 px-4 rounded-xl text-xs"
              >
                <Download className="w-4 h-4" /> Baixar Vídeo
              </button>
              <button 
                onClick={() => setVideoUrl(null)}
                className="w-full py-2 text-slate-400 text-xs"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoRecorder;
