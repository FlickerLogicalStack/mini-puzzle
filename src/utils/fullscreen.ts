export const toggle_fullscreen = () => {
  if (document.fullscreenElement) {
    void document.exitFullscreen();
  } else {
    void document.documentElement.requestFullscreen();
  }
};
