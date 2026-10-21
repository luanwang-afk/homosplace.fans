import { act, fireEvent, render, screen } from '@testing-library/react';
import App from './App';

jest.mock('@react-three/drei', () => ({
  useProgress: () => ({ active: false, progress: 100 })
}));
jest.mock('./Scene', () => function MockScene({ onModelReady, onCanvasReady, onError }) {
  return <>
    <button onClick={() => { onModelReady(); onCanvasReady(); }}>Scene loaded</button>
    <button onClick={() => onError('webgl-context-lost')}>Lose context</button>
  </>;
});
jest.mock('./PoemSequence', () => function MockStory({ onAudioReady }) {
  return <button onClick={onAudioReady}>Audio loaded</button>;
});
jest.mock('./VisitorCounter', () => () => null);

beforeEach(() => {
  jest.useFakeTimers();
  window.matchMedia = jest.fn(() => ({ matches: false, addEventListener: jest.fn(), removeEventListener: jest.fn() }));
  jest.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({});
});
afterEach(() => {
  jest.restoreAllMocks();
  jest.useRealTimers();
});

function finishLoading() {
  fireEvent.click(screen.getByText('Scene loaded'));
  fireEvent.click(screen.getByText('Audio loaded'));
}

test('enables the story after scene and audio load', () => {
  render(<App />);
  expect(screen.queryByRole('button', { name: 'Start story' })).not.toBeInTheDocument();
  finishLoading();
  expect(screen.getByRole('button', { name: 'Start story' })).toBeInTheDocument();
});

test('recovers when assets finish loading after the timeout', () => {
  render(<App />);
  act(() => jest.advanceTimersByTime(30000));
  expect(screen.getByText('Homos Place is too steamy for this device.')).toBeInTheDocument();
  finishLoading();
  expect(screen.queryByText('Homos Place is too steamy for this device.')).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Start story' })).toBeInTheDocument();
});

test('does not clear a lost WebGL context just because assets are ready', () => {
  render(<App />);
  finishLoading();
  fireEvent.click(screen.getByText('Lose context'));
  expect(screen.getByText('Homos Place is too steamy for this device.')).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Start story' })).not.toBeInTheDocument();
});

test('shows controls after loading and a temporary headphone hint after play', () => {
  render(<App />);
  expect(screen.queryByRole('img', { name: 'Drag to rotate' })).not.toBeInTheDocument();
  finishLoading();
  expect(screen.getByRole('img', { name: 'Drag to rotate' })).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Start story' }));
  expect(screen.queryByRole('img', { name: 'Drag to rotate' })).not.toBeInTheDocument();
  expect(screen.getByRole('img', { name: 'Headphones recommended' })).toBeInTheDocument();
  act(() => jest.advanceTimersByTime(6000));
  expect(screen.queryByRole('img', { name: 'Headphones recommended' })).not.toBeInTheDocument();
});
