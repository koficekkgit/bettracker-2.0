let audio: HTMLAudioElement | null = null;

export function playWinSound() {
  try {
    if (!audio) {
      audio = new Audio('/win.mp3');
      audio.volume = 0.6;
    }
    // Rewind in case it was already played
    audio.currentTime = 0;
    void audio.play();
  } catch {
    // Silently ignore — autoplay might be blocked
  }
}
