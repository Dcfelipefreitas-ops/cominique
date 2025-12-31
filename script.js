// ===============================
// ELEMENTOS
// ===============================
const video = document.getElementById("video");
const text = document.getElementById("text");
const scriptInput = document.getElementById("script");
const speed = document.getElementById("speed");
const recordBtn = document.getElementById("record");
const stopBtn = document.getElementById("stop");
const download = document.getElementById("download");
const filename = document.getElementById("filename");

// ===============================
// FFMPEG
// ===============================
const { createFFmpeg, fetchFile } = FFmpeg;
const ffmpeg = createFFmpeg({ log: true });

// ===============================
// ESTADO
// ===============================
let mediaRecorder = null;
let chunks = [];
let scrollY = 100;
let scrollTimer = null;
let stream = null;

// ===============================
// TEXTO AO VIVO
// ===============================
scriptInput.oninput = () => {
  text.innerText = scriptInput.value || "Paste your script here";
  scrollY = 100;
  text.style.top = "100%";
};

// ===============================
// INICIAR CÂMERA
// ===============================
async function startCamera() {
  if (stream) return stream;

  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true
    });

    video.srcObject = stream;
    video.muted = true;
    await video.play();

    return stream;
  } catch (err) {
    alert("Erro ao acessar câmera/microfone");
    console.error(err);
  }
}

// ===============================
// GRAVAR
// ===============================
recordBtn.onclick = async () => {
  await startCamera();
  if (!stream) return;

  chunks = [];

  // ✅ MIME TYPE COMPATÍVEL
  let options = {};
  if (MediaRecorder.isTypeSupported("video/webm;codecs=vp8,opus")) {
    options.mimeType = "video/webm;codecs=vp8,opus";
  } else if (MediaRecorder.isTypeSupported("video/webm")) {
    options.mimeType = "video/webm";
  }

  try {
    mediaRecorder = new MediaRecorder(stream, options);
  } catch (e) {
    alert("MediaRecorder não suportado neste navegador");
    console.error(e);
    return;
  }

  mediaRecorder.ondataavailable = e => {
    if (e.data && e.data.size > 0) {
      chunks.push(e.data);
    }
  };

  mediaRecorder.onstop = async () => {
    const webmBlob = new Blob(chunks, { type: "video/webm" });

    download.style.display = "block";
    download.innerText = "⏳ Convertendo para MP4...";
    download.removeAttribute("download");

    if (!ffmpeg.isLoaded()) {
      await ffmpeg.load();
    }

    try {
      ffmpeg.FS("unlink", "input.webm");
      ffmpeg.FS("unlink", "output.mp4");
    } catch {}

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

  document.body.classList.add("recording");
  recordBtn.disabled = true;
  stopBtn.disabled = false;

  // ===============================
  // SCROLL DO PROMPTER
  // ===============================
  scrollTimer = setInterval(() => {
    scrollY -= Number(speed.value || 1) * 0.1;
    text.style.top = scrollY + "%";
  }, 30);
};

// ===============================
// PARAR
// ===============================
stopBtn.onclick = () => {
  if (mediaRecorder && mediaRecorder.state === "recording") {
    mediaRecorder.stop();
  }

  clearInterval(scrollTimer);
  scrollTimer = null;

  document.body.classList.remove("recording");
  recordBtn.disabled = false;
  stopBtn.disabled = true;
};
