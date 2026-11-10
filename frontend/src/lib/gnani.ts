/**
 * Gnani AI Audio & Voice Utilities
 */

export function playBase64Audio(base64Data: string, mimeType = "audio/wav"): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const cleanB64 = base64Data.replace(/^data:audio\/\w+;base64,/, "");
      const byteCharacters = atob(cleanB64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: mimeType });
      const audioUrl = URL.createObjectURL(blob);
      const audio = new Audio(audioUrl);

      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        resolve();
      };
      audio.onerror = (e) => {
        URL.revokeObjectURL(audioUrl);
        reject(e);
      };
      audio.play().catch(reject);
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Fallback Speech Synthesis using Web Speech API when Gnani Timbre is in INTEGRATION_PENDING mode.
 * Clearly announced so user knows it's the client fallback.
 */
export function speakFallbackText(text: string, language = "te-IN", rate = 1.0): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      resolve();
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const supportedVoices = ["te-IN", "en-IN", "hi-IN", "ta-IN", "kn-IN", "ml-IN", "bn-IN", "mr-IN"];
    const matched = supportedVoices.find((v) => language.startsWith(v.slice(0, 2)));
    utterance.lang = matched || "en-IN";
    utterance.rate = Math.max(0.7, Math.min(1.4, rate));
    utterance.pitch = 1.0;

    utterance.onend = () => resolve();
    utterance.onerror = () => resolve();

    window.speechSynthesis.speak(utterance);
  });
}

/**
 * Audio Recorder using browser MediaStream & MediaRecorder
 */
export class AudioRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];

  async start(): Promise<void> {
    this.audioChunks = [];
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    this.mediaRecorder = new MediaRecorder(stream);

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.audioChunks.push(event.data);
      }
    };

    this.mediaRecorder.start();
  }

  stop(): Promise<Blob> {
    return new Promise((resolve) => {
      if (!this.mediaRecorder) {
        resolve(new Blob([], { type: "audio/wav" }));
        return;
      }

      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, { type: "audio/wav" });
        // Stop all tracks to release mic
        this.mediaRecorder?.stream.getTracks().forEach((track) => track.stop());
        resolve(audioBlob);
      };

      this.mediaRecorder.stop();
    });
  }
}
