const video = document.getElementById("video");
const text = document.getElementById("text");
const scriptInput = document.getElementById("script");
const speed = document.getElementById("speed");
const recordBtn = document.getElementById("record");
const stopBtn = document.getElementById("stop");
const download = document.getElementById("download");
const filename = document.getElementById("filename");
const { createFFmpeg, fetchFile } = FFmpeg;
const ffmpeg = createFFmpeg({ log: true });

let mediaRecorder;
let chunks = [];
let scrollY = 100;
let scrollTimer;
let stream;

// TEXTO AO VIVO
scriptInput.oninput = () => {
  text.innerText = scriptInput.value || "Paste your script here";
  scrollY = 100;
  text.style.top = "100%";
};

// INICIAR CÂMERA
async function startCamera() {
  if (stream) return stream;

  stream = await navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true
  });

  video.srcObject = stream;
  return stream;
}

// GRAVAR
recordBtn.onclick = async () => {
  await startCamera();

  chunks = [];

  mediaRecorder = new MediaRecorder(stream, {
    mimeType: "video/webm"
  });

  mediaRecorder.ondataavailable = e => {
    if (e.data.size > 0) chunks.push(e.data);
  };

 mediaRecorder.onstop = async () => {
  const webmBlob = new Blob(chunks, { type: "video/webm" });

  // DOWNLOAD WEBM (opcional)
  const webmURL = URL.createObjectURL(webmBlob);

  download.style.display = "block";
  download.innerText = "Convertendo para MP4...";
  download.removeAttribute("download");

  if (!ffmpeg.isLoaded()) {
    await ffmpeg.load();
  }

  ffmpeg.FS("writeFile", "input.webm", await fetchFile(webmBlob));

  await ffmpeg.run(
    "-i", "input.webm",
    "-movflags", "faststart",
    "-pix_fmt", "yuv420p",
    "output.mp4"
  );

  const mp4Data = ffmpeg.FS("readFile", "output.mp4");
  const mp4Blob = new Blob([mp4Data.buffer], { type: "video/mp4" });

  const mp4URL = URL.createObjectURL(mp4Blob);

  download.href = mp4URL;
  download.download = (filename.value || "teleprompter") + ".mp4";
  download.innerText = "⬇️ Baixar MP4";
};


  mediaRecorder.start();

  recordBtn.disabled = true;
  stopBtn.disabled = false;

  // SCROLL DO PROMPTER
  scrollTimer = setInterval(() => {
    scrollY -= Number(speed.value) * 0.1;
    text.style.top = scrollY + "%";
  }, 30);
};

// PARAR
stopBtn.onclick = () => {
  if (mediaRecorder && mediaRecorder.state !== "inactive") {
    mediaRecorder.stop();
  }

  clearInterval(scrollTimer);

  recordBtn.disabled = false;
  stopBtn.disabled = true;
};
const CACHE = "teleprompter-v1";

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE).then(cache =>
      cache.addAll([
        "./",
        "./index.html",
        "./style.css",
        "./script.js",
        "./manifest.json",
        "./ffmpeg.min.js"
      ])
    )
  );
});

self.addEventListener("fetch", e => {
  e.respondWith(
    caches.match(e.request).then(res => res || fetch(e.request))
  );
});
