export const getMediaStream = async () => {
  try {
    const localMediaStream = await navigator.mediaDevices.getUserMedia({
      audio: true
    });
    return localMediaStream;
  } catch(e) {
    console.error(e);
    return [];
  }
};