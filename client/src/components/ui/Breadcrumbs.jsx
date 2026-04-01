import { Link } from 'react-router-dom';

export default function Breadcrumbs({ items }) {
  return (
    <nav className="flex items-center gap-1.5 text-xs mb-4" style={{ color: 'rgba(255,255,255,0.3)' }}>
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {i > 0 && <span>&rsaquo;</span>}
          {item.path ? (
            <Link to={item.path} className="hover:text-white/60 transition-colors">{item.label}</Link>
          ) : (
            <span style={{ color: '#a5b4fc' }}>{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
