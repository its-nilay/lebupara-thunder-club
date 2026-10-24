import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';

export default function MainLayout() {
  return (
    <div className="min-h-screen bg-thunder" style={{ background: 'radial-gradient(ellipse at top, #0a1628 0%, #020817 60%)' }}>
      {/* Ambient background particles */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: Math.random() * 3 + 1 + 'px',
              height: Math.random() * 3 + 1 + 'px',
              background: i % 2 === 0 ? 'rgba(0,229,255,0.4)' : 'rgba(118,255,3,0.3)',
              left: Math.random() * 100 + '%',
              top: Math.random() * 100 + '%',
              animation: `float ${3 + Math.random() * 4}s ease-in-out infinite`,
              animationDelay: Math.random() * 5 + 's',
            }}
          />
        ))}
      </div>

      <Navbar />
      <main className="relative pt-16" style={{ zIndex: 1 }}>
        <Outlet />
      </main>

      <footer className="mt-20 py-8 text-center" style={{ borderTop: '1px solid rgba(0,229,255,0.08)', color: '#475569', fontSize: '0.8rem' }}>
        <p>⚡ Lebupara Thunder Club League · Built for the beautiful game ⚡</p>
      </footer>
    </div>
  );
}
