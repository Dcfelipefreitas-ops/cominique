const video = document.getElementById("video");
const text = document.getElementById("text");
const script = document.getElementById("script");
const speed = document.getElementById("speed");
const recordBtn = document.getElementById("record");
const stopBtn = document.getElementById("stop");
const download = document.getElementById("download");
const filename = document.getElementById("filename");

let mediaRecorder;
let chunks = [];
let scrollY = 100;
let scrollTimer;

// TEXTO AO VIVO
script.oninput = () => {
  text.innerText = script.value || "Paste your script here";
  scrollY = 100;
  text.style.top = "100%";
};

// INICIAR CÂMERA (FONTE DO PROBLEMA RESOLVIDA AQUI)
async function startCamera() {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true
  });

  video.srcObject = stream;
  return stream;
}

recordBtn.onclick = async () => {
  const stream = await startCamera();

  mediaRecorder = new MediaRecorder(stream);
  chunks = [];

  mediaRecorder.ondataavailable = e => chunks.push(e.data);

  mediaRecorder.onstop = () => {
    const blob = new Blob(chunks, { type: "video/webm" });
    const url = URL.createObjectURL(blob);

    download.href = url;
    download.download = (filename.value || "teleprompter") + ".webm";
    download.style.display = "block";
  };

  mediaRecorder.start();

  document.body.classList.add("recording");
  recordBtn.disabled = true;
  stopBtn.disabled = false;

  // SCROLL SUAVE (A)
  scrollTimer = setInterval(() => {
    scrollY -= speed.value * 0.1;
    text.style.top = scrollY + "%";
  }, 30);
};

stopBtn.onclick = () => {
  mediaRecorder.stop();
  clearInterval(scrollTimer);

  document.body.classList.remove("recording");
  recordBtn.disabled = false;
  stopBtn.disabled = true;
};
