"""Original v12 score: six distinct arrangements, rendered offline, no sampled assets.
Run: python compose-abyss-music.py (numpy, scipy and ffmpeg required).
"""
from pathlib import Path
import subprocess
import tempfile
import numpy as np
from scipy.io import wavfile

SR = 24000
OUT = Path('public/audio')
TRACKS = [('ritual', '石環の鼓動', 108, 8, 38),
          ('chip', '星屑の回路', 144, 12, 57),
          ('piano', '忘れられた舞踏会', 90, 12, 50),
          ('breaks', '黒曜ドライブ', 132, 12, 40),
          ('jazz', '地下零時', 96, 8, 46),
          ('cosmic', '星のない海', 64, 8, 43)]

def compose(style, title, bpm, bars, root):
    bars *= 2
    rnd = np.random.default_rng(12000 + root)
    beats = 3 if style == 'piano' else 4
    beat = 60 / bpm
    n = round(bars * beats * beat * SR)
    mix = np.zeros((n, 2), dtype=np.float64)

    def add(note, at, duration, voice='bell', gain=.12, pan=0):
        t = np.arange(max(1, round(duration * SR))) / SR
        f = 440 * 2 ** ((note - 69) / 12)
        attack = np.minimum(1, t / (.3 if voice == 'air' else .008))
        end = np.minimum(1, np.maximum(0, duration - t) / .03)
        if voice == 'kick':
            wave = np.sin(2*np.pi*(48*t + 8*(1-np.exp(-t*24)))) * np.exp(-t*12)
        elif voice == 'snare':
            wave = (.7*rnd.normal(size=len(t))+.3*np.sin(2*np.pi*180*t))*np.exp(-t*22)
        elif voice == 'hat':
            noise = rnd.normal(size=len(t)); wave = (noise-np.roll(noise, 1))*np.exp(-t*65)*.25
        elif voice == 'drum':
            wave = (np.sin(2*np.pi*f*t+2*np.exp(-t*22))+.4*np.sin(2*np.pi*f*1.6*t))*np.exp(-t*9)
        elif voice == 'chip':
            wave = (np.sin(2*np.pi*f*t)+np.sin(2*np.pi*f*3*t)/3+np.sin(2*np.pi*f*5*t)/5)*np.exp(-t*4)
        elif voice == 'bass':
            wave = (np.sin(2*np.pi*f*t)+.2*np.sin(2*np.pi*f*2*t))*np.exp(-t*5)
        elif voice == 'piano':
            wave = sum(np.sin(2*np.pi*f*h*t)*np.exp(-t*(1.7+h*.7))/h**1.3 for h in range(1, 7))
        elif voice == 'air':
            wave = (np.sin(2*np.pi*f*t)+.5*np.sin(2*np.pi*f*1.003*t)+.25*np.sin(2*np.pi*f*2*t))*np.sin(np.pi*t/duration)**2
        else:
            wave = (np.sin(2*np.pi*f*t)+.3*np.sin(2*np.pi*f*2.76*t))*np.exp(-t*3)
        sound = wave*attack*end*gain
        idx = (round(at*SR)+np.arange(len(t))) % n
        mix[idx, 0] += sound*np.sqrt((1-pan)/2)
        mix[idx, 1] += sound*np.sqrt((1+pan)/2)

    progression = [0, 5, 3, 7] if style != 'jazz' else [0, 5, 2, 7]
    melody = [0, 7, 10, 14, 12, 7, 3, 5]
    for bar in range(bars):
        base = root+progression[(bar//2) % 4]; start = bar*beats*beat
        if style == 'ritual':
            for j, pitch in enumerate([0, 7, 0, 12, 7, 5, 0]):
                add(root+pitch, start+[0,.75,1.5,2,2.75,3.25,3.5][j]*beat,.45,'drum',.2,(-1)**j*.45)
            if bar % 2 == 0: add(base+24,start,beat*3,'air',.15)
            add(base+19,start+2.5*beat,beat,'bell',.11,.65)
        elif style == 'chip':
            for j in range(8):
                add(base+12+melody[(j+bar)%8],start+j*.5*beat,beat*.42,'chip',.10,(-1)**j*.3)
                if j%2==0:add(base-12,start+j*.5*beat,beat*.4,'bass',.21)
            for j in range(4):add(0,start+j*beat,.15,'kick' if j%2==0 else 'snare',.12)
        elif style == 'piano':
            add(base-12,start,beat*2,'piano',.26,-.3)
            for j in [1,2]:
                for pitch in [3,7,14]:add(base+pitch,start+j*beat,beat*.9,'piano',.10,.2)
            for j in range(3):add(base+24+melody[(bar*3+j)%8],start+(j+.08)*beat,beat*1.7,'piano',.15,.5)
        elif style == 'breaks':
            for j in [0,1.5,2,3.25]:add(0,start+j*beat,.35,'kick',.24)
            for j in [1,3]:add(0,start+j*beat,.22,'snare',.17)
            for j in range(8):
                add(0,start+j*.5*beat,.08,'hat',.12,(-1)**j*.7)
                add(base+[0,0,7,12,0,3,7,10][j],start+j*.5*beat,beat*.3,'bass',.22)
            if bar%2==0:
                for pitch in [12,15,19]:add(base+pitch,start+2.75*beat,beat,'chip',.09)
        elif style == 'jazz':
            for j in range(4):add(base+[-12,-5,-2,0][j],start+j*beat,beat*.8,'bass',.23,-.35)
            for j in [0,1.66,2.66]:
                for pitch in [3,7,10,14]:add(base+pitch,start+j*beat,beat*.6,'piano',.075,.3)
            for j in range(4):
                add(0,start+j*beat,.1,'hat',.07,.6)
                add(base+24+melody[(j+bar)%8],start+(j+.66)*beat,beat*.35,'bell',.075,-.2)
        else:
            for pitch in [0,7,14]:add(base+pitch,start,beat*7,'air',.11, (pitch/14-.5)*1.2)
            add(base+31,start+beat*(bar%3),beat*3,'bell',.09,.55)
    # Circular, stereo space; this also carries musical tails across the loop boundary.
    dry = mix.copy()
    for seconds,gain in [(beat*.75,.20),(beat*1.5,.10)]:
        mix += np.roll(dry[:,::-1], round(seconds*SR), axis=0)*gain
    mix = np.tanh(mix*1.6)
    rms = np.sqrt(np.mean(mix**2)); mix *= min(.17/max(rms,1e-6),.91/max(np.max(np.abs(mix)),1e-6))
    with tempfile.TemporaryDirectory(prefix='maze-score-') as temp:
        wav=Path(temp)/'render.wav'; wavfile.write(wav,SR,(mix*32767).astype(np.int16))
        subprocess.run(['ffmpeg','-v','error','-y','-i',str(wav),'-codec:a','libmp3lame','-b:a','80k','-metadata','title='+title,str(OUT/('abyss-'+style+'.mp3'))],check=True)
    print(style, round(n/SR,2), 'seconds', flush=True)

if __name__ == '__main__':
    OUT.mkdir(parents=True,exist_ok=True)
    for track in TRACKS: compose(*track)
