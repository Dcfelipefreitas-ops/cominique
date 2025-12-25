console.log("script loaded");

const video = document.getElementById("video");
const startCamBtn = document.getElementById("startCam");
const recordBtn = document.getElementById("record");
const stopBtn = document.getElementById("stop");
const scriptInput = document.getElementById("script");
const text = document.getElementById("text");

let stream;
let recorder;
let chunks = [];
let scrollY = 100;
let scrollInterval;

// update teleprompter text
scriptInput.oninput = () => {
  text.innerText = scriptInput.value || "Paste your script below";
  scrollY = 100;
  text.style.top = "100%";
};

// start camera
startCamBtn.onclick = async () => {
  stream = await navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true
  });
  video.srcObject = stream;
};

// start recording
recordBtn.onclick = () => {
  if (!stream) return alert("Start camera first");

  recorder = new MediaRecorder(stream);
  chunks = [];

  recorder.ondataavailable = e => chunks.push(e.data);
  recorder.onstop = () => {
    const blob = new Blob(chunks, { type: "video/webm" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "recording.webm";
    a.click();
  };

  recorder.start();
  document.body.classList.add("recording");

  scrollInterval = setInterval(() => {
    scrollY -= 0.1;
    text.style.top = scrollY + "%";
  }, 30);
};

// stop recording
stopBtn.onclick = () => {
  if (recorder && recorder.state !== "inactive") {
    recorder.stop();
    clearInterval(scrollInterval);
    document.body.classList.remove("recording");
  }
};
