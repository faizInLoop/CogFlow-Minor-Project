import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';

export default function NotFound() {
  const navigate = useNavigate();
  return (
    <div className="page atlas-page atlas-notfound" style={{ justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: 24 }}>
      <div className="glow-orb glow-orb-1" />
      <div className="glow-orb glow-orb-2" />
      <Navbar currentStep={0} />
      <div className="content-area" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: 80, marginBottom: 20, animation: 'float 3s ease-in-out infinite', display: 'inline-block' }}>🧠</div>
        <h1 style={{ fontSize: 'clamp(36px, 6vw, 72px)', fontWeight: 900, marginBottom: 12, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
          404
        </h1>
        <p style={{ fontSize: 18, color: 'var(--text-secondary)', marginBottom: 8 }}>Page not found</p>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 32, maxWidth: 380 }}>
          Looks like this page doesn't exist. Maybe your cognitive load got too high and you wandered off 😄
        </p>
        <button className="btn btn-primary btn-lg" onClick={() => navigate('/')} id="404-home-btn">
          Take Me Home
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
