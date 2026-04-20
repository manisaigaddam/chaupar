import { Howl } from 'howler';

// Sound effect types — Indian instrument theme
type SoundName =
    | 'cardFlip'
    | 'cardDeal'
    | 'win'
    | 'lose'
    | 'cashout'
    | 'buttonClick'
    | 'chipStack'
    | 'countdown';

// Indian-themed sound configuration
// Sounds in /public/sounds/ — tabla, shehnai, temple bell, sitar, tanpura, dholak
const soundConfig: Record<SoundName, { src: string[]; volume: number }> = {
    cardFlip: {
        src: ['/sounds/tabla-tap.mp3', '/sounds/tabla-tap.wav'],
        volume: 0.6,
    },
    cardDeal: {
        src: ['/sounds/tabla-flick.mp3', '/sounds/tabla-flick.wav'],
        volume: 0.5,
    },
    win: {
        src: ['/sounds/shehnai-flourish.mp3', '/sounds/shehnai-flourish.wav'],
        volume: 0.8,
    },
    lose: {
        src: ['/sounds/sitar-descend.mp3', '/sounds/sitar-descend.wav'],
        volume: 0.5,
    },
    cashout: {
        src: ['/sounds/temple-bell.mp3', '/sounds/temple-bell.wav'],
        volume: 0.7,
    },
    buttonClick: {
        src: ['/sounds/dholak-tap.mp3', '/sounds/dholak-tap.wav'],
        volume: 0.3,
    },
    chipStack: {
        src: ['/sounds/coins-jingle.mp3', '/sounds/coins-jingle.wav'],
        volume: 0.4,
    },
    countdown: {
        src: ['/sounds/tanpura-drone.mp3', '/sounds/tanpura-drone.wav'],
        volume: 0.5,
    },
};

// Sound instances cache
const sounds: Partial<Record<SoundName, Howl>> = {};

// Initialize a sound
function getSound(name: SoundName): Howl {
    if (!sounds[name]) {
        sounds[name] = new Howl({
            src: soundConfig[name].src,
            volume: soundConfig[name].volume,
            preload: true,
        });
    }
    return sounds[name]!;
}

// Sound manager class
class SoundManager {
    private enabled: boolean = true;
    private volume: number = 1.0;

    setEnabled(enabled: boolean) {
        this.enabled = enabled;
    }

    setVolume(volume: number) {
        this.volume = Math.max(0, Math.min(1, volume));
    }

    play(name: SoundName) {
        if (!this.enabled) return;

        try {
            const sound = getSound(name);
            sound.volume(soundConfig[name].volume * this.volume);
            sound.play();
        } catch {
            // Silently fail - sounds are non-critical
            console.warn(`Sound unavailable: ${name}`);
        }
    }

    // Convenience methods
    cardFlip() { this.play('cardFlip'); }
    cardDeal() { this.play('cardDeal'); }
    win() { this.play('win'); }
    lose() { this.play('lose'); }
    cashout() { this.play('cashout'); }
    click() { this.play('buttonClick'); }
    chips() { this.play('chipStack'); }
    countdown() { this.play('countdown'); }
}

// Export singleton instance
export const soundManager = new SoundManager();
export type { SoundName };
