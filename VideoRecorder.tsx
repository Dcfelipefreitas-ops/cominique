import React, { useEffect, useRef, useState, useCallback } from 'react';
import { RecordingStatus, PrompterConfig } from './types';
import { AlertCircle } from 'lucide-react';

interface VideoRecorderProps {
  status: RecordingStatus;
  config: PrompterConfig;
  onVideoPronto: (blob: Blob, url: string) => void;
}

const VideoRecorder: React.FC<VideoRecorderProps> = ({ status, config, onVideoPronto }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  
  const [error, setError] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  // Iniciar Câmera padrão estável (compatível com Mac, iPhone e Android)
  const startCamera = useCallback(async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError("Câmera indisponível. Verifique as permissões.");
        return;
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: true
      });

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(console.error);
        };
      }
      setError(null);
    } catch (err) {
      console.error("Erro câmera:", err);
      setError("Permissão da Câmera ou Microfone negada.");
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
      chunksRef.current = [];

      let options: MediaRecorderOptions = {};
      if (MediaRecorder.isTypeSupported('video/mp4')) {
        options.mimeType = 'video/mp4';
      } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')) {
        options.mimeType = 'video/webm;codecs=vp8,opus';
      } else if (MediaRecorder.isTypeSupported('video/webm')) {
        options.mimeType = 'video/webm';
      }

      try {
        const recorder = new MediaRecorder(stream, options);

        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            chunksRef.current.push(e.data);
          }
        };

        recorder.onstop = () => {
          const type = options.mimeType || 'video/mp4';
          const blob = new Blob(chunksRef.current, { type });
          
          if (blob.size > 0) {
            const url = URL.createObjectURL(blob);
            onVideoPronto(blob, url);
          }
        };

        recorder.start();
        mediaRecorderRef.current = recorder;
      } catch (err) {
        console.error("Erro recorder:", err);
      }

    } else if (status === 'stopping' && mediaRecorderRef.current) {
      const rec = mediaRecorderRef.current;
      if (rec.state === 'recording') {
        rec.stop();
      }
      mediaRecorderRef.current = null;
    }
  }, [status, stream, onVideoPronto]);

  return (
    <div className="relative w-full h-full bg-slate-950 flex items-center justify-center overflow-hidden">
      {error ? (
        <div className="text-center p-6 bg-slate-900 border border-slate-800 rounded-2xl max-w-xs m-4 z-30">
          <AlertCircle className="w-10 h-10 text-yellow-500 mx-auto mb-2" />
          <p className="text-slate-300 text-xs mb-3">{error}</p>
          <button onClick={startCamera} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold">
            Tentar Câmera
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
    </div>
  );
};

export default VideoRecorder;
