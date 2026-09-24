import { SoundPreset } from './notificationTypes';

const SOUND_ENABLED_KEY = 'sigi_sound_enabled';
const SOUND_VOLUME_KEY = 'sigi_sound_volume';

export interface SoundSettings {
  enabled: boolean;
  volume: number; // 0.0 to 1.0
}

class NotificationSoundManager {
  private audioCtx: AudioContext | null = null;
  private isUnlocked = false;
  private settings: SoundSettings = {
    enabled: true,
    volume: 0.7,
  };

  constructor() {
    this.loadSettings();
    this.setupUnlockListeners();
  }

  private loadSettings() {
    try {
      const storedEnabled = localStorage.getItem(SOUND_ENABLED_KEY);
      const storedVolume = localStorage.getItem(SOUND_VOLUME_KEY);

      this.settings = {
        enabled: storedEnabled !== null ? storedEnabled === 'true' : true,
        volume: storedVolume !== null ? Math.min(1, Math.max(0, parseFloat(storedVolume))) : 0.7,
      };
    } catch {
      this.settings = { enabled: true, volume: 0.7 };
    }
  }

  private setupUnlockListeners() {
    if (typeof window === 'undefined') return;

    const unlock = () => {
      this.ensureAudioContext();
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        this.audioCtx.resume().then(() => {
          this.isUnlocked = true;
        }).catch(() => {
          // Ignora silenciosamente se o browser ainda bloquear
        });
      } else if (this.audioCtx && this.audioCtx.state === 'running') {
        this.isUnlocked = true;
      }

      if (this.isUnlocked) {
        window.removeEventListener('click', unlock);
        window.removeEventListener('keydown', unlock);
        window.removeEventListener('touchstart', unlock);
      }
    };

    window.addEventListener('click', unlock, { passive: true });
    window.addEventListener('keydown', unlock, { passive: true });
    window.addEventListener('touchstart', unlock, { passive: true });
  }

  private ensureAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;

    if (!this.audioCtx) {
      try {
        const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtxClass) {
          this.audioCtx = new AudioCtxClass();
        }
      } catch {
        return null;
      }
    }
    return this.audioCtx;
  }

  public getSettings(): SoundSettings {
    return { ...this.settings };
  }

  public setEnabled(enabled: boolean) {
    this.settings.enabled = enabled;
    try {
      localStorage.setItem(SOUND_ENABLED_KEY, String(enabled));
    } catch {}
  }

  public setVolume(volume: number) {
    const clamped = Math.min(1, Math.max(0, volume));
    this.settings.volume = clamped;
    try {
      localStorage.setItem(SOUND_VOLUME_KEY, String(clamped));
    } catch {}
  }

  /**
   * Toca sintetizador de áudio dependendo do preset solicitado
   */
  public play(preset: SoundPreset = 'chime'): void {
    if (!this.settings.enabled || this.settings.volume <= 0) return;

    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    // Se estiver suspenso, tenta dar resume
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    try {
      const now = ctx.currentTime;
      const baseGain = 0.25 * this.settings.volume;

      switch (preset) {
        case 'subtle': {
          // Um 'tick' sutil e rápido (440Hz -> 220Hz decaimento em 0.12s)
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(440, now);
          osc.frequency.exponentialRampToValueAtTime(220, now + 0.12);

          gain.gain.setValueAtTime(baseGain * 0.5, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now);
          osc.stop(now + 0.12);
          break;
        }

        case 'chime': {
          // Sino agradável duplo (587Hz D5 -> 880Hz A5)
          this.playTone(ctx, 587.33, now, 0.18, baseGain * 0.7, 'triangle');
          this.playTone(ctx, 880.00, now + 0.12, 0.35, baseGain * 0.9, 'sine');
          break;
        }

        case 'success': {
          // Acorde alegre de sucesso (C5 -> E5 -> G5)
          this.playTone(ctx, 523.25, now, 0.15, baseGain * 0.6, 'triangle');
          this.playTone(ctx, 659.25, now + 0.1, 0.15, baseGain * 0.7, 'triangle');
          this.playTone(ctx, 783.99, now + 0.2, 0.4, baseGain * 0.9, 'sine');
          break;
        }

        case 'alarm': {
          // Alerta operacional chamativo de produção/stock (dois bipes de atenção 784Hz -> 659Hz)
          this.playTone(ctx, 783.99, now, 0.16, baseGain, 'square');
          this.playTone(ctx, 659.25, now + 0.2, 0.25, baseGain, 'triangle');
          break;
        }

        case 'critical': {
          // Alerta crítico de emergência (pulso triplo penetrante 880Hz / 440Hz)
          this.playTone(ctx, 880.00, now, 0.15, baseGain * 1.1, 'sawtooth');
          this.playTone(ctx, 440.00, now + 0.18, 0.15, baseGain * 1.1, 'sawtooth');
          this.playTone(ctx, 880.00, now + 0.36, 0.35, baseGain * 1.2, 'sawtooth');
          break;
        }
      }
    } catch (e) {
      // Audio bloqueado ou restrição do browser - sem quebrar a app
      console.warn('[SoundManager] Não foi possível reproduzir som:', e);
    }
  }

  private playTone(
    ctx: AudioContext,
    frequency: number,
    startTime: number,
    duration: number,
    volume: number,
    type: OscillatorType = 'sine'
  ) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(frequency, startTime);

    gain.gain.setValueAtTime(Math.max(0.001, volume), startTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + duration);
  }

  public test(preset: SoundPreset = 'chime') {
    this.play(preset);
  }
}

export const notificationSoundManager = new NotificationSoundManager();
