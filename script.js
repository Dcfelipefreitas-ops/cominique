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

// TELEPROMPTER TEXT
scriptInput.oninput = () => {
  text.innerText = scriptInput.value || "Paste your script below";
  scrollPos = 100;
  text.style.top = "100%";
};

// CAMERA + AUDIO PRO
startCamBtn.onclick = async () => {
  mediaStream = await navigator.mediaDevices.getUserMedia({
    video: {
      width: { ideal: 1920 },
      height: { ideal: 1080 },
      facingMode: "user"
    },
    audio: true
  });

  // AUDIO CHAIN (GAIN + LIMITER)
  const audioContext = new AudioContext();
  const source = audioContext.createMediaStreamSource(mediaStream);

  const gainNode = audioContext.createGain();
  gainNode.gain.value = 1.3;

  const compressor = audioContext.createDynamicsCompressor();
  compressor.threshold.value = -12;
  compressor.knee.value = 20;
  compressor.ratio.value = 6;
  compressor.attack.value = 0.003;
  compressor.release.value = 0.25;

  source.connect(gainNode).connect(compressor).connect(audioContext.destination);

  video.srcObject = mediaStream;
};

// RECORD
recordBtn.onclick = () => {
  if (!mediaStream) return alert("Start camera first");

  recordedChunks = [];

  mediaRecorder = new MediaRecorder(mediaStream, {
    mimeType: "video/webm; codecs=vp9"
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

// STOP — AGORA É DEFINITIVO
stopBtn.onclick = () => {
  if (mediaRecorder && mediaRecorder.state === "recording") {
    mediaRecorder.stop();
  }

  clearInterval(scrollInterval);
  document.body.classList.remove("recording");

  recordBtn.disabled = false;
  stopBtn.disabled = true;
};

// SAVE VIDEO
function saveVideo() {
  const blob = new Blob(recordedChunks, { type: "video/webm" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "teleprompter_recording.webm";
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
