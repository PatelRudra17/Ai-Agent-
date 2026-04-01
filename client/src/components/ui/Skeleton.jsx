export default function Skeleton({ className = '', count = 1 }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`rounded-xl animate-pulse ${className}`}
          style={{ background: 'rgba(255,255,255,0.04)' }}
        />
      ))}
    </>
  );
}
