// Elementos da Interface
const cameraFeed = document.getElementById('cameraFeed');
const cameraError = document.getElementById('cameraError');
const btnRetryCamera = document.getElementById('btnRetryCamera');

const prompterText = document.getElementById('prompterText');
const btnRecord = document.getElementById('btnRecord');

const countdownOverlay = document.getElementById('countdownOverlay');
const countdownNumber = document.getElementById('countdownNumber');

const settingsModal = document.getElementById('settingsModal');
const btnSettings = document.getElementById('btnSettings');
const btnCloseSettings = document.getElementById('btnCloseSettings');
const btnSaveSettings = document.getElementById('btnSaveSettings');

const scriptInput = document.getElementById('scriptInput');
const speedRange = document.getElementById('speedRange');
const speedVal = document.getElementById('speedVal');
const fontRange = document.getElementById('fontRange');
const fontVal = document.getElementById('fontVal');
const mirrorToggle = document.getElementById('mirrorToggle');

const downloadModal = document.getElementById('downloadModal');
const btnDownload = document.getElementById('btnDownload');
const btnCloseDownload = document.getElementById('btnCloseDownload');

// Estados
let stream = null;
let mediaRecorder = null;
let recordedChunks = [];
let isRecording = false;
let scrollInterval = null;
let scrollY = 0;

let speed = 2;
let fontSize = 28;
let mirror = true;

// 1. INICIALIZAR CÂMERA
async function initCamera() {
  try {
    const constraints = {
      video: {
        facingMode: 'user',
        width: { ideal: 1280 },
        height: { ideal: 720 }
      },
      audio: true
    };
    stream = await navigator.mediaDevices.getUserMedia(constraints);
    cameraFeed.srcObject = stream;
    cameraError.classList.add('hidden');
  } catch (err) {
    console.error("Erro câmera:", err);
    cameraError.classList.remove('hidden');
  }
}

btnRetryCamera.addEventListener('click', initCamera);

// 2. CONFIGURAÇÕES
scriptInput.value = prompterText.innerText;

btnSettings.addEventListener('click', () => settingsModal.classList.remove('hidden'));
btnCloseSettings.addEventListener('click', () => settingsModal.classList.add('hidden'));

speedRange.addEventListener('input', (e) => {
  speed = Number(e.target.value);
  speedVal.innerText = `${speed}x`;
});

fontRange.addEventListener('input', (e) => {
  fontSize = Number(e.target.value);
  fontVal.innerText = `${fontSize}px`;
  prompterText.style.fontSize = `${fontSize}px`;
});

mirrorToggle.addEventListener('change', (e) => {
  mirror = e.target.checked;
  cameraFeed.style.transform = mirror ? 'scaleX(-1)' : 'none';
});

btnSaveSettings.addEventListener('click', () => {
  prompterText.innerText = scriptInput.value;
  settingsModal.classList.add('hidden');
});

// 3. ROLAGEM DO TELEPROMPTER
function startScrolling() {
  scrollY = 0;
  prompterText.style.transform = `translateY(0px)`;
  clearInterval(scrollInterval);

  scrollInterval = setInterval(() => {
    scrollY -= (speed * 0.7);
    prompterText.style.transform = `translateY(${scrollY}px)`;
  }, 16);
}

function stopScrolling() {
  clearInterval(scrollInterval);
  scrollY = 0;
  prompterText.style.transform = `translateY(0px)`;
}

// 4. GRAVAÇÃO
function startRecordingProcess() {
  let count = 3;
  countdownOverlay.classList.remove('hidden');
  countdownNumber.innerText = count;

  const countTimer = setInterval(() => {
    count--;
    if (count > 0) {
      countdownNumber.innerText = count;
    } else {
      clearInterval(countTimer);
      countdownOverlay.classList.add('hidden');
      beginMediaRecorder();
    }
  }, 1000);
}

function beginMediaRecorder() {
  recordedChunks = [];
  
  let options = undefined;
  if (typeof MediaRecorder !== 'undefined') {
    if (MediaRecorder.isTypeSupported('video/mp4')) {
      options = { mimeType: 'video/mp4' };
    } else if (MediaRecorder.isTypeSupported('video/webm')) {
      options = { mimeType: 'video/webm' };
    }
  }

  try {
    mediaRecorder = new MediaRecorder(stream, options);
  } catch (e) {
    mediaRecorder = new MediaRecorder(stream);
  }

  mediaRecorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) {
      recordedChunks.push(e.data);
    }
  };

  mediaRecorder.onstop = () => {
    const blob = new Blob(recordedChunks, { type: recordedChunks[0]?.type || 'video/mp4' });
    const url = URL.createObjectURL(blob);
    btnDownload.href = url;
    downloadModal.classList.remove('hidden');
  };

  mediaRecorder.start(1000);
  isRecording = true;

  // Atualiza botão para PARAR
  btnRecord.classList.remove('bg-red-600', 'hover:bg-red-500');
  btnRecord.classList.add('bg-white', 'text-slate-950');
  btnRecord.innerHTML = `<i data-lucide="square" class="w-5 h-5 fill-current"></i><span>PARAR</span>`;
  lucide.createIcons();

  startScrolling();
}

function stopRecording() {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop();
  }
  isRecording = false;

  btnRecord.classList.remove('bg-white', 'text-slate-950');
  btnRecord.classList.add('bg-red-600', 'hover:bg-red-500');
  btnRecord.innerHTML = `<i data-lucide="play" class="w-5 h-5 fill-current"></i><span>GRAVAR</span>`;
  lucide.createIcons();

  stopScrolling();
}

btnRecord.addEventListener('click', () => {
  if (!isRecording) {
    startRecordingProcess();
  } else {
    stopRecording();
  }
});

btnCloseDownload.addEventListener('click', () => {
  downloadModal.classList.add('hidden');
});

// Inicialização
window.addEventListener('DOMContentLoaded', () => {
  lucide.createIcons();
  prompterText.style.fontSize = `${fontSize}px`;
  cameraFeed.style.transform = mirror ? 'scaleX(-1)' : 'none';
  initCamera();
});
