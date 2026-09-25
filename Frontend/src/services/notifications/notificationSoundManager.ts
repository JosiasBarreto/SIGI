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
    volume: 0.75,
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
        volume: storedVolume !== null ? Math.min(1, Math.max(0, parseFloat(storedVolume))) : 0.75,
      };
    } catch {
      this.settings = { enabled: true, volume: 0.75 };
    }
  }

  /**
   * Configura ouvintes globais para desbloquear a reprodução de áudio
   * na primeira interação táctil ou de clique do utilizador no telemóvel/desktop.
   */
  private setupUnlockListeners() {
    if (typeof window === 'undefined') return;

    const unlock = () => {
      this.unlockAudioContext();
    };

    // Múltiplos eventos para garantir desbloqueio em Android Chrome, Safari iOS e Desktop
    ['click', 'touchstart', 'touchend', 'keydown', 'pointerdown'].forEach((evt) => {
      window.addEventListener(evt, unlock, { passive: true });
    });

    // Quando a aba/ecrã voltar a ficar visível, garante que o áudio não está suspenso
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          this.resumeContext();
        }
      });
    }
  }

  private unlockAudioContext() {
    try {
      const ctx = this.ensureAudioContext();
      if (ctx) {
        if (ctx.state === 'suspended') {
          ctx.resume().then(() => {
            this.isUnlocked = true;
          }).catch(() => {});
        } else if (ctx.state === 'running') {
          this.isUnlocked = true;
        }

        // Toca um buffer silencioso para desbloquear totalmente o pipeline de áudio no iOS Safari
        try {
          const buffer = ctx.createBuffer(1, 1, 22050);
          const source = ctx.createBufferSource();
          source.buffer = buffer;
          source.connect(ctx.destination);
          source.start(0);
        } catch {}
      }
    } catch {}
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

  private resumeContext() {
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
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
   * Dispara vibração táctil no dispositivo móvel (Android / PWA)
   */
  public triggerVibration(preset: SoundPreset = 'chime') {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') return;
    if (!('vibrate' in navigator)) return;

    try {
      switch (preset) {
        case 'critical':
          navigator.vibrate([250, 100, 250, 100, 400]);
          break;
        case 'alarm':
          navigator.vibrate([200, 100, 200]);
          break;
        case 'success':
          navigator.vibrate([120, 80, 180]);
          break;
        case 'subtle':
          navigator.vibrate(80);
          break;
        case 'chime':
        default:
          navigator.vibrate([150, 100, 150]);
          break;
      }
    } catch {}
  }

  /**
   * Toca som sintetizado dependendo do preset solicitado e aciona vibração móvel
   */
  public play(preset: SoundPreset = 'chime'): void {
    // 1. Disparar vibração física sempre que possível no telemóvel
    this.triggerVibration(preset);

    if (!this.settings.enabled || this.settings.volume <= 0) return;

    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    // Se estiver suspenso no telemóvel ou em segundo plano, tenta retomar
    if (ctx.state === 'suspended') {
      ctx.resume().then(() => {
        this.renderPreset(ctx, preset);
      }).catch(() => {
        this.renderPreset(ctx, preset);
      });
      return;
    }

    this.renderPreset(ctx, preset);
  }

  private renderPreset(ctx: AudioContext, preset: SoundPreset) {
    try {
      const now = ctx.currentTime;
      const baseGain = 0.3 * this.settings.volume;

      switch (preset) {
        case 'subtle': {
          // 'Tick' sutil e rápido (480Hz -> 240Hz decaimento em 0.12s)
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(480, now);
          osc.frequency.exponentialRampToValueAtTime(240, now + 0.12);

          gain.gain.setValueAtTime(baseGain * 0.6, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now);
          osc.stop(now + 0.12);
          break;
        }

        case 'chime': {
          // Sino agradável duplo (587.33Hz D5 -> 880Hz A5)
          this.playTone(ctx, 587.33, now, 0.18, baseGain * 0.8, 'triangle');
          this.playTone(ctx, 880.00, now + 0.12, 0.38, baseGain * 0.95, 'sine');
          break;
        }

        case 'success': {
          // Acorde alegre de sucesso (C5 523Hz -> E5 659Hz -> G5 784Hz)
          this.playTone(ctx, 523.25, now, 0.15, baseGain * 0.7, 'triangle');
          this.playTone(ctx, 659.25, now + 0.1, 0.15, baseGain * 0.8, 'triangle');
          this.playTone(ctx, 783.99, now + 0.2, 0.45, baseGain * 1.0, 'sine');
          break;
        }

        case 'alarm': {
          // Alerta operacional de produção/pedidos (dois bipes de atenção 784Hz -> 659Hz)
          this.playTone(ctx, 783.99, now, 0.16, baseGain * 1.1, 'square');
          this.playTone(ctx, 659.25, now + 0.2, 0.28, baseGain * 1.0, 'triangle');
          break;
        }

        case 'critical': {
          // Alerta crítico (pulso triplo penetrante 880Hz / 440Hz)
          this.playTone(ctx, 880.00, now, 0.15, baseGain * 1.2, 'sawtooth');
          this.playTone(ctx, 440.00, now + 0.18, 0.15, baseGain * 1.2, 'sawtooth');
          this.playTone(ctx, 880.00, now + 0.36, 0.4, baseGain * 1.3, 'sawtooth');
          break;
        }
      }
    } catch (e) {
      console.warn('[SoundManager] Não foi possível reproduzir som no navegador móvel/desktop:', e);
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
