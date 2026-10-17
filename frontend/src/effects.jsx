import { createRoot } from 'react-dom/client';
import ElectricLogo from './components/ElectricLogo.jsx';
import DitherVeil from './components/DitherVeil.jsx';
import './effects.css';

function EffectsPage() {
  return <main className="effects-page">
    <header className="effects-intro">
      <span className="effects-eyebrow">VERITY / VISUAL SYSTEM</span>
      <h1>Evidence, made visible.</h1>
      <p>Document verification in light and motion.</p>
    </header>

    <section className="effects-electric" aria-label="Animated VERITY logo">
      <div className="effects-mark">
        <ElectricLogo
          src="/verity-logo.svg"
          color="#ecc7ff"
          glowColor="#ad6dff"
          scale={0.7}
          intensity={0.9}
          glow={1}
          thickness={1.5}
          strands={4}
          bend={0.6}
          crackle={1.2}
          arcs={0.7}
          flicker={0.4}
          fill={0}
          speed={2}
          interactive
          cursorIntensity={0.75}
          cursorRadius={100}
          theme="dark"
        />
      </div>
      <div className="effects-wordmark">VERITY</div>
      <p className="effects-caption">A signal of what holds up.</p>
    </section>

    <section className="effects-dither" aria-label="Interactive dither veil demo">
      <div className="effects-dither__heading">
        <span className="effects-eyebrow">INTERACTIVE IMAGE STUDY</span>
        <h2>Look closer.</h2>
        <p>Move across the image to reveal detail.</p>
      </div>
      <div className="effects-image">
        <DitherVeil
          src="https://images.unsplash.com/photo-1737071371043-761e02b1ef95?q=80&w=1400&auto=format&fit=crop"
          pattern="floyd"
          pixelSize={2}
          inkColor="#120f17"
          paperColor="#f4f1ea"
          revealRadius={200}
          softness={0.6}
          linger={1}
        />
      </div>
    </section>
  </main>;
}

createRoot(document.getElementById('effects-root')).render(<EffectsPage />);
