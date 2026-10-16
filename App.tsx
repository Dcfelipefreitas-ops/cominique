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
        console.log("Compartilhamento ca
