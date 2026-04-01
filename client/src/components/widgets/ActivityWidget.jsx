import ActivityFeed from '../ActivityFeed';

export default function ActivityWidget() {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'rgba(255,255,255,0.3)' }}>
        Recent Activity
      </h3>
      <ActivityFeed limit={8} />
    </div>
  );
}
