console.log("script loaded");

const video = document.getElementById("video");
const startCamBtn = document.getElementById("startCam");
const recordBtn = document.getElementById("record");
const stopBtn = document.getElementById("stop");
const scriptInput = document.getElementById("script");
const text = document.getElementById("text");

let stream = null;
let recorder = null;
let chunks = [];
let scrollY = 100;
let scrollInterval = null;

// update teleprompter text
scriptInput.oninput = () => {
  text.innerText = scriptInput.value || "Paste your script below";
  scrollY = 100;
  text.style.top = "100%";
};

// start camera
startCamBtn.onclick = async () => {
  if (stream) return; // already running

  stream = await navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true
  });

  video.srcObject = stream;
};

// start recording
recordBtn.onclick = () => {
  if (!stream) {
    alert("Start camera first");
    return;
  }

  if (recorder && recorder.state === "recording") return;

  recorder = new MediaRecorder(stream);
  chunks = [];

  recorder.ondataavailable = e => {
    if (e.data.size > 0) chunks.push(e.data);
  };

  recorder.onstop = () => {
    const blob = new Blob(chunks, { type: "video/webm" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "recording.webm";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    chunks = [];
  };

  recorder.start();
  document.body.classList.add("recording");

  scrollInterval = setInterval(() => {
    scrollY -= 0.15;
    text.style.top = scrollY + "%";
  }, 30);
};

// stop recording
stopBtn.onclick = () => {
  if (recorder && recorder.state === "recording") {
    recorder.stop();
  }

  if (scrollInterval) {
    clearInterval(scrollInterval);
    scrollInterval = null;
  }

  document.body.classList.remove("recording");
};

// safety: stop everything if tab is closed
window.addEventListener("beforeunload", () => {
  if (recorder && recorder.state === "recording") recorder.stop();
  if (stream) stream.getTracks().forEach(t => t.stop());
});
