const video = document.getElementById("video");
const startCamBtn = document.getElementById("startCam");
const recordBtn = document.getElementById("record");
const stopBtn = document.getElementById("stop");
const scriptInput = document.getElementById("script");
const text = document.getElementById("text");

let mediaStream;
let mediaRecorder;
let recordedChunks = [];
let scrollInterval;
let scrollPos = 100;

// TEXTO
scriptInput.oninput = () => {
  text.innerText = scriptInput.value || "Paste your script here";
  scrollPos = 100;
  text.style.top = "100%";
};

// CAMERA + AUDIO ENGINE
startCamBtn.onclick = async () => {
  mediaStream = await navigator.mediaDevices.getUserMedia({
    video: {
      width: { ideal: 1920 },
      height: { ideal: 1080 },
      facingMode: "user"
    },
    audio: true
  });

  // AUDIO CONTEXT
  const audioContext = new AudioContext();
  const source = audioContext.createMediaStreamSource(mediaStream);

  // GAIN
  const gain = audioContext.createGain();
  gain.gain.value = 1.4;

  // COMPRESSOR (voz)
  const compressor = audioContext.createDynamicsCompressor();
  compressor.threshold.value = -14;
  compressor.knee.value = 18;
  compressor.ratio.value = 4;
  compressor.attack.value = 0.003;
  compressor.release.value = 0.25;

  // LIMITER (hard)
  const limiter = audioContext.createDynamicsCompressor();
  limiter.threshold.value = -3;
  limiter.knee.value = 0;
  limiter.ratio.value = 20;
  limiter.attack.value = 0.001;
  limiter.release.value = 0.05;

  // DESTINO SILENCIOSO (SEM ECO)
  const silent = audioContext.createMediaStreamDestination();

  source
    .connect(gain)
    .connect(compressor)
    .connect(limiter)
    .connect(silent);

  // SUBSTITUI TRACK DE ÁUDIO
  const tracks = [
    ...mediaStream.getVideoTracks(),
    ...silent.stream.getAudioTracks()
  ];

  mediaStream = new MediaStream(tracks);

  video.srcObject = mediaStream;
};

// RECORD
recordBtn.onclick = () => {
  if (!mediaStream) return alert("Start camera first");

  recordedChunks = [];

  mediaRecorder = new MediaRecorder(mediaStream, {
    mimeType: "video/webm;codecs=vp9,opus",
    videoBitsPerSecond: 8000000
  });

  mediaRecorder.ondataavailable = e => {
    if (e.data.size > 0) recordedChunks.push(e.data);
  };

  mediaRecorder.onstop = saveVideo;

  mediaRecorder.start();
  document.body.classList.add("recording");

  recordBtn.disabled = true;
  stopBtn.disabled = false;

  scrollInterval = setInterval(() => {
    scrollPos -= 0.12;
    text.style.top = scrollPos + "%";
  }, 30);
};

// STOP
stopBtn.onclick = () => {
  if (mediaRecorder && mediaRecorder.state === "recording") {
    mediaRecorder.stop();
  }

  clearInterval(scrollInterval);
  document.body.classList.remove("recording");

  recordBtn.disabled = false;
  stopBtn.disabled = true;
};

// SAVE
function saveVideo() {
  const blob = new Blob(recordedChunks, { type: "video/webm" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "teleprompter_pro_recording.webm";
  document.body.appendChild(a);
  a.click();
  a.remove();
}

// SAFETY
window.onbeforeunload = () => {
  if (mediaRecorder && mediaRecorder.state === "recording") {
    mediaRecorder.stop();
  }
  if (mediaStream) {
    mediaStream.getTracks().forEach(t => t.stop());
  }
};
