export const getMediaStream = async () => {
  try {
    const localStreamMedia = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: {
        facingMode: ['user', 'environment'],
      },
    });
    return localStreamMedia;
  } catch {
    return [];
  }
};
