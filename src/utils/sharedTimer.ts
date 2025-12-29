type TimerCallback = () => void;

class SharedTimer {
  private callbacks: Set<TimerCallback> = new Set();
  private intervalId: NodeJS.Timeout | null = null;

  subscribe(callback: TimerCallback): () => void {
    this.callbacks.add(callback);
    
    if (!this.intervalId) {
      this.intervalId = setInterval(() => {
        this.callbacks.forEach(cb => cb());
      }, 1000);
    }

    return () => {
      this.callbacks.delete(callback);
      if (this.callbacks.size === 0 && this.intervalId) {
        clearInterval(this.intervalId);
        this.intervalId = null;
      }
    };
  }
}

export const sharedTimer = new SharedTimer();
