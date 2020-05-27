export const getMediaStream = async () => {
  try {
    const localMediaStream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: {
        facingMode: ['user', 'environment'],
      },
    });
    return localMediaStream;
  } catch {
    return [];
  }
};
