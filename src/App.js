import './App.css';
import '@fontsource/pinyon-script';
import React, { useEffect, useState } from 'react';
import { useProgress } from '@react-three/drei';
import Scene from './Scene';
import PoemSequence from './PoemSequence';
import VisitorCounter from './VisitorCounter';
import ExperienceHint from './ExperienceHint';

const MOBILE_QUERY = '(max-width: 720px), (pointer: coarse)';
function useIsMobilePerformance() {
  const [isMobilePerformance, setIsMobilePerformance] = useState(() => (
    typeof window !== 'undefined' && window.matchMedia(MOBILE_QUERY).matches
  ));

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const media = window.matchMedia(MOBILE_QUERY);
    const update = () => setIsMobilePerformance(media.matches);
    update();
    media.addEventListener?.('change', update);
    return () => media.removeEventListener?.('change', update);
  }, []);

  return isMobilePerformance;
}

function LoadingOverlay({ isReady, progress, loadIssue }) {
  const shownProgress = Math.max(4, Math.min(100, Math.round(progress)));
  const hasLoadIssue = Boolean(loadIssue);

  return (
    <div className={`loading-overlay ${isReady ? 'is-ready' : ''} ${hasLoadIssue ? 'has-load-issue' : ''}`} aria-hidden={isReady && !hasLoadIssue}>
      <div className="loading-steam" />
      <div className="loading-mark">
        {hasLoadIssue ? (
          <>
            <div className="loading-title loading-title-issue">Homos Place is too steamy for this device.</div>
            <div className="loading-issue-copy">The engine needs power. Please return on a stronger browser, desktop, or laptop. I am sorry.</div>
          </>
        ) : (
          <>
            <div className="loading-title">Homos Place</div>
            <div className="loading-line" style={{ '--loading-progress': `${shownProgress}%` }}>
              <span />
            </div>
            <div className="loading-percent">{shownProgress}</div>
          </>
        )}
      </div>
    </div>
  );
}

function StartOverlay({ isVisible, onStart }) {
  return (
    <div className={`start-overlay ${isVisible ? 'is-visible' : 'is-hidden'}`} aria-hidden={!isVisible}>
      <div className="start-card">
        <svg className="start-ring" viewBox="0 0 320 320" aria-hidden="true">
          <defs>
            <path
              id="start-text-circle"
              d="M160 160 m-112 0 a112 112 0 1 1 224 0 a112 112 0 1 1 -224 0"
            />
          </defs>
          <text>
            <textPath href="#start-text-circle" startOffset="3%" textLength="610" lengthAdjust="spacingAndGlyphs">
              Undressing authority. A steam room story.
            </textPath>
          </text>
        </svg>
        <button className="start-play-button" type="button" onClick={onStart} aria-label="Start story">
          <svg className="start-play-icon" viewBox="0 0 64 64" aria-hidden="true" focusable="false">
            <defs>
              <path id="play-outline" pathLength="100" d="M18 12 Q18 9 21 11 L51 29 Q55 32 51 35 L21 53 Q18 55 18 52 Z" />
            </defs>
            <use href="#play-outline" />
            <use href="#play-outline" className="start-play-trace" />
          </svg>
        </button>
      </div>
    </div>
  );
}

function App() {
  const [isColorField, setIsColorField] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [audioReady, setAudioReady] = useState(false);
  const [modelReady, setModelReady] = useState(false);
  const [canvasReady, setCanvasReady] = useState(false);
  const [loadIssue, setLoadIssue] = useState(null);
  const isMobilePerformance = useIsMobilePerformance();
  const { active, progress } = useProgress();
  const assetsReady = audioReady && modelReady && canvasReady && !active && progress >= 99;
  const isLoaded = assetsReady && (!loadIssue || loadIssue === 'load-timeout');
  const handleModelReady = React.useCallback(() => setModelReady(true), []);
  const handleCanvasReady = React.useCallback(() => setCanvasReady(true), []);
  const visualProgress = Math.min(
    100,
    progress * 0.72 + (audioReady ? 10 : 0) + (modelReady ? 10 : 0) + (canvasReady ? 8 : 0)
  );

  useEffect(() => {
    if (typeof document === 'undefined') return undefined;
    if (isLoaded) return undefined;
    const canvas = document.createElement('canvas');
    const hasWebGl = Boolean(
      canvas.getContext('webgl2') ||
      canvas.getContext('webgl') ||
      canvas.getContext('experimental-webgl')
    );

    if (!hasWebGl) {
      setLoadIssue('webgl-unavailable');
    }

    const timeout = window.setTimeout(() => {
      setLoadIssue((current) => current || 'load-timeout');
    }, isMobilePerformance ? 18000 : 30000);

    return () => window.clearTimeout(timeout);
  }, [isLoaded, isMobilePerformance]);

  useEffect(() => {
    if (isLoaded) {
      setLoadIssue(current => current === 'load-timeout' ? null : current);
    }
  }, [isLoaded]);

  return (
    <div className={`App ${isColorField ? 'is-color-field' : ''} ${hasStarted ? 'has-started' : ''} ${isMobilePerformance ? 'is-mobile-performance' : ''}`} style={{ width: '100vw', height: '100vh', background: '#000', position: 'relative', overflow: 'hidden', backgroundImage:'radial-gradient(800px 400px at 50% 20%, rgba(255,0,0,0.055), rgba(0,0,0,0))' }}>
      <div className="color-field-layer" aria-hidden="true" />
      {/* Camera adjusted for closer oblique view */}
      <Scene
        introReady={isLoaded}
        hasStarted={hasStarted}
        isMobilePerformance={isMobilePerformance}
        onModelReady={handleModelReady}
        onCanvasReady={handleCanvasReady}
        onError={setLoadIssue}
      />
      <PoemSequence
        onColorFieldChange={setIsColorField}
        onAudioReady={() => setAudioReady(true)}
        onStoryEnded={() => setHasStarted(false)}
        shouldStart={hasStarted}
      />
      {!loadIssue && (
        <div className="site-pulse-counter">
          <VisitorCounter />
        </div>
      )}
      <StartOverlay isVisible={isLoaded && !hasStarted} onStart={() => setHasStarted(true)} />
      {isLoaded && !loadIssue && <ExperienceHint key={hasStarted ? 'headphones' : 'controls'} headphones={hasStarted} />}
      <LoadingOverlay isReady={isLoaded} progress={visualProgress} loadIssue={loadIssue} />
    </div>
  );
}

export default App;
