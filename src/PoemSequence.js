import React, { useEffect, useState } from 'react';
import { storyAudioDuration, storyBeats } from './storyTranscript';

const STORY_COLOR_FIELD_START = 206.21;
const storyAudioSrc = `${process.env.PUBLIC_URL}/asteamroomstoryfinal.mp3`;

function getStoryWordLabels(beat) {
  const matches = [...beat.text.matchAll(/([A-Za-z0-9]+(?:[’'][A-Za-z0-9]+)?)([^A-Za-z0-9]*)/g)];
  const sourceWords = beat.words?.length
    ? beat.words
    : matches.map((match, index) => {
        const totalWeight = matches.reduce((sum, item) => sum + Math.max(1, item[1].length), 0);
        const elapsedWeight = matches
          .slice(0, index)
          .reduce((sum, item) => sum + Math.max(1, item[1].length), 0);
        const wordWeight = Math.max(1, match[1].length);
        const duration = Math.max(0.24, beat.end - beat.start);
        const start = beat.start + (elapsedWeight / totalWeight) * duration;
        const end = beat.start + ((elapsedWeight + wordWeight) / totalWeight) * duration;
        return { text: match[1], start, end };
      });
  let cursor = beat.start;
  return sourceWords.map((word, index) => {
    const start = Math.max(word.start, cursor);
    const endLimit = sourceWords[index + 1]?.start > start ? sourceWords[index + 1].start : beat.end;
    const end = Math.max(start + 0.16, Math.min(Math.max(word.end, start + 0.16), endLimit));
    cursor = end;
    return {
      ...word,
      start,
      end,
      label: word.label || `${word.text}${matches[index]?.[2] || ''}`
    };
  });
}

const storyWordLabels = storyBeats.map(beat => beat.stackLines ? [] : getStoryWordLabels(beat));

export default function PoemSequence({ onColorFieldChange, onAudioReady, onStoryEnded, shouldStart }) {
  const audioRef = React.useRef(null);
  const progressRef = React.useRef(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (!isPlaying) return;
    let rafId;
    const tick = () => {
      if (audioRef.current) {
        const nextTime = audioRef.current.currentTime || 0;
        setCurrentTime(nextTime);
      }
      rafId = window.requestAnimationFrame(tick);
    };
    rafId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(rafId);
  }, [isPlaying]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !shouldStart) return;
    audio.play().catch(() => {});
  }, [shouldStart]);

  const togglePlayback = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      try {
        await audio.play();
      } catch (err) {}
    } else {
      audio.pause();
    }
  };
  const handleEnded = () => {
    const audio = audioRef.current;
    if (audio) {
      audio.currentTime = 0;
    }
    setCurrentTime(0);
    setIsPlaying(false);
    onStoryEnded?.();
  };
  const seekToClientX = (clientX) => {
    const audio = audioRef.current;
    const progress = progressRef.current;
    if (!audio || !progress) return;
    const rect = progress.getBoundingClientRect();
    const ratio = rect.width > 0 ? (clientX - rect.left) / rect.width : 0;
    const nextTime = Math.max(0, Math.min(storyAudioDuration, ratio * storyAudioDuration));
    audio.currentTime = nextTime;
    setCurrentTime(nextTime);
  };
  const activeBeatIndex = storyBeats.reduce((activeIndex, beat, index) => (
    currentTime >= beat.start && currentTime < beat.end ? index : activeIndex
  ), -1);
  const activeBeat = activeBeatIndex >= 0 ? storyBeats[activeBeatIndex] : null;
  const activeWords = activeBeat && !activeBeat.stackLines ? storyWordLabels[activeBeatIndex] : [];
  const activeBeatTextLength = activeBeat?.text?.length || 0;
  const activeBeatSizeClass = activeBeat?.emphasis && activeBeatTextLength > 16 ? 'is-long-beat' : '';
  const isTitleBeat = activeBeat?.text?.includes('Undressing authority');
  const isSmallBeat = activeBeat?.small;
  const isNsfwBeat = activeBeat?.letterReveal;
  const isNsfwBlinking = isNsfwBeat && currentTime >= (activeBeat?.blinkStart || activeBeat.end - 1);
  const wordPreReveal = activeBeat?.strictWordTiming ? 0 : 0.45;
  const transcriptGlowText = activeBeat?.letterReveal || (activeBeat?.strictWordTiming && activeWords[0] && currentTime < activeWords[0].start)
    ? ''
    : activeBeat?.text || '';
  const transcriptAnimationDuration = isNsfwBlinking
    ? '.86s'
    : `${Math.max(1.8, (activeBeat?.end || 0) - (activeBeat?.start || 0))}s`;
  const isSecondHiTurn = currentTime >= 175.45 && currentTime < 196.65;
  const isImpactTurn = currentTime >= 190 && currentTime < 199.01;
  const isColorField = currentTime >= STORY_COLOR_FIELD_START && currentTime < storyAudioDuration;

  useEffect(() => {
    onColorFieldChange?.(isColorField);
  }, [isColorField, onColorFieldChange]);

  return (
    <section className={`poem-stage story-stage ${isPlaying ? 'is-story-playing' : ''} ${isSecondHiTurn ? 'is-strobe-turn' : ''} ${isImpactTurn && isPlaying ? 'is-impact-turn' : ''}`} aria-label="Audio story">
      <audio
        ref={audioRef}
        src={storyAudioSrc}
        preload="auto"
        onLoadedData={() => onAudioReady?.()}
        onCanPlayThrough={() => onAudioReady?.()}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={handleEnded}
      />
      <div className="poem-vignette" />
      <div className="story-strobe-layer" aria-hidden="true" />
      <div className="story-inline-player" aria-label="Story audio controls">
        <button
          className={`poem-play-button ${isPlaying ? 'is-playing' : ''}`}
          type="button"
          onClick={togglePlayback}
          aria-label={isPlaying ? 'Pause story audio' : 'Play story audio'}
        >
          <span className="poem-play-icon" aria-hidden="true" />
        </button>
        <div
          ref={progressRef}
          className="poem-player-progress"
          role="slider"
          aria-label="Seek story audio"
          aria-valuemin={0}
          aria-valuemax={Math.round(storyAudioDuration)}
          aria-valuenow={Math.round(currentTime)}
          tabIndex={0}
          onPointerDown={(event) => {
            event.currentTarget.setPointerCapture?.(event.pointerId);
            seekToClientX(event.clientX);
          }}
          onPointerMove={(event) => {
            if (event.buttons !== 1) return;
            seekToClientX(event.clientX);
          }}
          onKeyDown={(event) => {
            const audio = audioRef.current;
            if (!audio) return;
            const step = event.shiftKey ? 10 : 3;
            let nextTime = audio.currentTime;
            if (event.key === 'ArrowLeft') nextTime -= step;
            else if (event.key === 'ArrowRight') nextTime += step;
            else if (event.key === 'Home') nextTime = 0;
            else if (event.key === 'End') nextTime = storyAudioDuration;
            else return;
            event.preventDefault();
            nextTime = Math.max(0, Math.min(storyAudioDuration, nextTime));
            audio.currentTime = nextTime;
            setCurrentTime(nextTime);
          }}
        >
          <span
            style={{
              '--progress': `${Math.min(100, (currentTime / storyAudioDuration) * 100)}%`
            }}
          />
        </div>
      </div>
      <div className="story-copy">
        <div
          key={activeBeatIndex}
          className={`story-transcript ${activeBeat?.emphasis ? 'is-short-beat' : ''} ${activeBeatSizeClass} ${isTitleBeat ? 'is-title-beat' : ''} ${isSmallBeat ? 'is-small-beat' : ''} ${isNsfwBeat ? 'is-nsfw-beat' : ''} ${isNsfwBlinking ? 'is-nsfw-blinking' : ''} ${isColorField ? 'is-color-field-fade' : ''}`}
          data-text={transcriptGlowText}
          style={{ animationDuration: transcriptAnimationDuration }}
          aria-label="Story transcript"
        >
          {activeBeat?.stackLines ? activeBeat.lines.map((line, lineIndex) => {
            const lineWords = getStoryWordLabels({ ...activeBeat, text: line.text, words: line.words });
            const lineStart = lineWords[0]?.start ?? activeBeat.start;
            const isVisibleLine = currentTime >= lineStart - wordPreReveal;
            return (
              <div key={`${line.text}-${lineIndex}`} className={`story-stack-line ${isVisibleLine ? 'is-line-visible' : ''}`}>
                {lineWords.map((word, index) => {
                  const center = (word.start + word.end) / 2;
                  const span = Math.max(1.15, word.end - word.start + 1.05);
                  const intensity = Math.max(0, 1 - Math.abs(currentTime - center) / span);
                  const isActiveWord = intensity > 0.48;
                  const isSpokenWord = currentTime >= word.end;
                  const isVisibleWord = currentTime >= word.start - wordPreReveal;
                  return (
                    <React.Fragment key={`${word.text}-${index}`}>
                      <span
                        className={`story-word ${isVisibleWord ? 'is-word-visible' : ''} ${isActiveWord ? 'is-word-active' : ''} ${isSpokenWord ? 'is-word-spoken' : ''}`}
                        style={{ '--word-heat': intensity.toFixed(3) }}
                      >
                        {word.label}
                      </span>
                      {index < lineWords.length - 1 ? ' ' : ''}
                    </React.Fragment>
                  );
                })}
              </div>
            );
          }) : activeBeat?.letterReveal ? [...activeBeat.text].map((char, index, letters) => {
            const visibleLetters = letters.filter((letter) => letter !== ' ').length || 1;
            const letterIndex = letters.slice(0, index).filter((letter) => letter !== ' ').length;
            const revealStart = activeBeat.letterStart || activeBeat.start;
            const revealEnd = activeBeat.letterEnd || activeBeat.end;
            const step = (revealEnd - revealStart) / visibleLetters;
            const letterStart = char === ' ' ? revealStart + letterIndex * step : revealStart + letterIndex * step;
            const isVisibleLetter = char === ' ' || currentTime >= letterStart;
            const isActiveLetter = char !== ' ' && currentTime >= letterStart && currentTime < letterStart + Math.max(.16, step * 1.15);
            return (
              <span
                key={`${char}-${index}`}
                className={`story-letter ${char === ' ' ? 'is-space' : ''} ${isVisibleLetter ? 'is-letter-visible' : ''} ${isActiveLetter ? 'is-letter-active' : ''}`}
              >
                {char === ' ' ? '\u00a0' : char}
              </span>
            );
          }) : activeWords.length ? activeWords.map((word, index) => {
            const center = (word.start + word.end) / 2;
            const span = Math.max(1.15, word.end - word.start + 1.05);
            const intensity = Math.max(0, 1 - Math.abs(currentTime - center) / span);
            const isActiveWord = intensity > 0.48;
            const isSpokenWord = currentTime >= word.end;
            const isVisibleWord = currentTime >= word.start - wordPreReveal;
            return (
              <React.Fragment key={`${word.text}-${index}`}>
                <span
                  className={`story-word ${isVisibleWord ? 'is-word-visible' : ''} ${isActiveWord ? 'is-word-active' : ''} ${isSpokenWord ? 'is-word-spoken' : ''}`}
                  style={{ '--word-heat': intensity.toFixed(3) }}
                >
                  {word.label}
                </span>
                {index < activeWords.length - 1 ? ' ' : ''}
              </React.Fragment>
            );
          }) : activeBeat?.text || ''}
        </div>
      </div>
    </section>
  );
}
