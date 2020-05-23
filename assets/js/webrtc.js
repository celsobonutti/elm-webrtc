export function setVideoStream(id, stream) {
  let videoElement = document.querySelector("#" + id);

  videoElement.srcObject = stream;
}

export async function startLocalCamera() {
  const localStream = await navigator.mediaDevices.getUserMedia({
    audio: true,
    video: true,
  });
  setVideoStream("localCamera", localStream);
}