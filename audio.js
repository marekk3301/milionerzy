// Web Audio API procedural sound engine for Milionerzy
// No external audio files needed - works completely offline!

class SoundEngine {
    constructor() {
        this.ctx = null;
        this.enabled = true;
        this.ambientOsc = null;
        this.ambientGain = null;
    }

    init() {
        if (!this.ctx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                this.ctx = new AudioContext();
            }
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    toggleMute() {
        this.enabled = !this.enabled;
        if (!this.enabled && this.ambientGain) {
            this.ambientGain.gain.setValueAtTime(0, this.ctx.currentTime);
        }
        return this.enabled;
    }

    // Sound when an answer is revealed (smooth resonant chime)
    playReveal() {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.18);

        gain.gain.setValueAtTime(0.01, now);
        gain.gain.linearRampToValueAtTime(0.2, now + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.45);
    }

    // Sound when player selects an answer (percussive suspense click/tone)
    playSelect() {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(260, now);
        osc.frequency.exponentialRampToValueAtTime(180, now + 0.25);

        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.35);
    }

    // Suspense tone while checking the answer
    playSuspense() {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc1.type = 'sawtooth';
        osc2.type = 'sine';

        osc1.frequency.setValueAtTime(130.81, now); // C3
        osc2.frequency.setValueAtTime(138.59, now); // C#3 (tense minor second tension)

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(300, now);
        filter.frequency.linearRampToValueAtTime(650, now + 1.2);

        gain.gain.setValueAtTime(0.02, now);
        gain.gain.linearRampToValueAtTime(0.18, now + 0.8);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);

        osc1.connect(filter);
        osc2.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 1.6);
        osc2.stop(now + 1.6);
    }

    // Sound when answer is CORRECT (triumphant brass/chime chord)
    playCorrect() {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 (Major triad)

        notes.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now + idx * 0.06);

            gain.gain.setValueAtTime(0.01, now + idx * 0.06);
            gain.gain.linearRampToValueAtTime(0.18, now + idx * 0.06 + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.4);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now + idx * 0.06);
            osc.stop(now + 1.5);
        });
    }

    // Sound when answer is WRONG (dramatic descending minor drone)
    playWrong() {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const freqs = [185.00, 155.56, 123.47]; // F#3, D#3, B2

        freqs.forEach((freq, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(freq, now + i * 0.12);
            osc.frequency.exponentialRampToValueAtTime(freq * 0.85, now + 1.6);

            const filter = this.ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(450, now);

            gain.gain.setValueAtTime(0.01, now + i * 0.12);
            gain.gain.linearRampToValueAtTime(0.2, now + i * 0.12 + 0.08);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.8);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now + i * 0.12);
            osc.stop(now + 1.9);
        });
    }

    // Lifeline 50:50 whoosh sound
    playLifeline() {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(200, now + 0.4);

        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.5);
    }

    // Grand Jackpot 1 000 000 zł Celebration
    playJackpot() {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const melody = [
            { f: 523.25, d: 0.2 }, // C
            { f: 659.25, d: 0.2 }, // E
            { f: 783.99, d: 0.2 }, // G
            { f: 1046.50, d: 0.5 }, // C6
            { f: 880.00, d: 0.2 }, // A
            { f: 1046.50, d: 0.2 }, // C6
            { f: 1174.66, d: 0.7 }  // D6
        ];

        let offset = 0;
        melody.forEach((note) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(note.f, now + offset);

            gain.gain.setValueAtTime(0.01, now + offset);
            gain.gain.linearRampToValueAtTime(0.25, now + offset + 0.03);
            gain.gain.exponentialRampToValueAtTime(0.001, now + offset + note.d);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now + offset);
            osc.stop(now + offset + note.d + 0.05);

            offset += note.d * 0.85;
        });
    }
}

window.soundEngine = new SoundEngine();
