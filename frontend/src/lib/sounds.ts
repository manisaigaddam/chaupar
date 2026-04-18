import { Howl } from 'howler';

// Sound effect types
type SoundName =
    | 'cardFlip'
    | 'cardDeal'
    | 'win'
    | 'lose'
    | 'cashout'
    | 'buttonClick'
    | 'chipStack'
    | 'countdown';

// Sound configuration - using free placeholder URLs
// Replace these with your actual sound files in /public/sounds/
const soundConfig: Record<SoundName, { src: string[]; volume: number }> = {
    cardFlip: {
        src: ['/sounds/card-flip.mp3', '/sounds/card-flip.wav'],
        volume: 0.6,
    },
    cardDeal: {
        src: ['/sounds/card-deal.mp3', '/sounds/card-deal.wav'],
        volume: 0.5,
    },
    win: {
        src: ['/sounds/win.mp3', '/sounds/win.wav'],
        volume: 0.8,
    },
    lose: {
        src: ['/sounds/lose.mp3', '/sounds/lose.wav'],
        volume: 0.5,
    },
    cashout: {
        src: ['/sounds/cashout.mp3', '/sounds/cashout.wav'],
        volume: 0.7,
    },
    buttonClick: {
        src: ['/sounds/click.mp3', '/sounds/click.wav'],
        volume: 0.3,
    },
    chipStack: {
        src: ['/sounds/chips.mp3', '/sounds/chips.wav'],
        volume: 0.4,
    },
    countdown: {
        src: ['/sounds/countdown.mp3', '/sounds/countdown.wav'],
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
        } catch (error) {
            console.warn(`Failed to play sound: ${name}`, error);
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
