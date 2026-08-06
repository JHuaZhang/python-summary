import { BlogBackground as RstackBackground } from '@rstack-dev/doc-ui/blog-background';

export default function BlogBackground() {
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      width: '100vw',
      height: '100vh',
      zIndex: 0,
      pointerEvents: 'none',
      overflow: 'hidden',
    }}>
      <RstackBackground
        showBackground
        backgroundGridSize={40}
        backgroundMeteorCount={30}
      />
    </div>
  );
}