import { memo, useState, useRef, useCallback, useEffect } from 'react';
import type { JobEvent, JobEventType } from '@/types/realtime';
import { cn, timeAgo } from '@/lib/formatting';

// -- Event Type Config --

const EVENT_STYLES: Record<JobEventType, { bg: string; text: string; icon: string }> = {
  enqueued: { bg: 'bg-blue-100 dark:bg-blue-900', text: 'text-blue-700 dark:text-blue-300', icon: '→' },
  completed: { bg: 'bg-green-100 dark:bg-green-900', text: 'text-green-700 dark:text-green-300', icon: '✓' },
  failed: { bg: 'bg-red-100 dark:bg-red-900', text: 'text-red-700 dark:text-red-300', icon: '✗' },
  cancelled: { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-600 dark:text-gray-400', icon: '⊘' },
};

const ALL_EVENT_TYPES: JobEventType[] = ['enqueued', 'completed', 'failed', 'cancelled'];

// -- Filter Chips --

const FilterChips = memo(function FilterChips({
  active,
  onChange,
}: {
  active: Set<JobEventType>;
  onChange: (types: Set<JobEventType>) => void;
}) {
  const toggle = (type: JobEventType) => {
    const next = new Set(active);
    if (next.has(type)) {
      next.delete(type);
    } else {
      next.add(type);
    }
    onChange(next);
  };

  return (
    <div className="flex gap-1.5 flex-wrap">
      {ALL_EVENT_TYPES.map((type) => {
        const style = EVENT_STYLES[type];
        const isActive = active.has(type);
        return (
          <button
            key={type}
            onClick={() => toggle(type)}
            className={cn(
              'px-2 py-0.5 rounded-full text-xs font-medium transition-all',
              isActive ? `${style.bg} ${style.text}` : 'bg-gray-50 dark:bg-gray-800 text-gray-400',
              'hover:opacity-80',
            )}
            aria-pressed={isActive}
          >
            {style.icon} {type}
          </button>
        );
      })}
    </div>
  );
});

// -- Event Row --

const EventRow = memo(function EventRow({
  event,
  expanded,
  onToggle,
}: {
  event: JobEvent;
  expanded: boolean;
  onToggle: () => void;
}) {
  const style = EVENT_STYLES[event.eventType];

  return (
    <div
      className={cn(
        'px-3 py-2 border-b border-gray-100 dark:border-gray-800 cursor-pointer transition-colors',
        'hover:bg-gray-50 dark:hover:bg-gray-800/50',
        expanded && 'bg-gray-50 dark:bg-gray-800/30',
      )}
      onClick={onToggle}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggle(); } }}
      aria-expanded={expanded}
    >
      <div className="flex items-center gap-2">
        <span className={cn('px-1.5 py-0.5 rounded text-[10px] font-medium flex-shrink-0', style.bg, style.text)}>
          {style.icon} {event.eventType}
        </span>
        <span className="text-xs text-gray-700 dark:text-gray-300 font-mono truncate flex-1" title={event.jobType}>
          {event.jobType}
        </span>
        <span className="text-[10px] text-gray-400 flex-shrink-0 tabular-nums">
          {timeAgo(event.timestamp)}
        </span>
      </div>

      {expanded && (
        <div className="mt-2 ml-1 space-y-1 text-xs text-gray-500">
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            <span>Job ID</span>
            <span className="font-mono text-gray-700 dark:text-gray-300 truncate" title={event.jobId}>{event.jobId}</span>
            <span>Queue</span>
            <span className="text-gray-700 dark:text-gray-300">{event.queue}</span>
            {event.attempt !== undefined && (
              <>
                <span>Attempt</span>
                <span className="text-gray-700 dark:text-gray-300">{event.attempt}</span>
              </>
            )}
            {event.duration !== undefined && (
              <>
                <span>Duration</span>
                <span className="text-gray-700 dark:text-gray-300">{event.duration}ms</span>
              </>
            )}
            {event.error && (
              <>
                <span>Error</span>
                <span className="text-red-600 dark:text-red-400 break-all col-span-1">{event.error}</span>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
});

// -- Main Feed Component --

interface LiveJobFeedProps {
  events: JobEvent[];
  maxVisible?: number;
}

export const LiveJobFeed = memo(function LiveJobFeed({ events, maxVisible = 50 }: LiveJobFeedProps) {
  const [activeFilters, setActiveFilters] = useState<Set<JobEventType>>(() => new Set(ALL_EVENT_TYPES));
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevEventsLenRef = useRef(0);

  const filtered = events
    .filter((e) => activeFilters.has(e.eventType))
    .slice(0, maxVisible);

  // Auto-scroll to top when new events arrive, unless paused
  useEffect(() => {
    if (!isPaused && events.length > prevEventsLenRef.current && scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
    prevEventsLenRef.current = events.length;
  }, [events.length, isPaused]);

  const handleToggle = useCallback((id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  }, []);

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800">
        <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400">Live Job Feed</h3>
        <div className="flex items-center gap-3">
          <FilterChips active={activeFilters} onChange={setActiveFilters} />
          <button
            onClick={() => setIsPaused((p) => !p)}
            className={cn(
              'px-2 py-0.5 rounded text-xs font-medium transition-colors',
              isPaused
                ? 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300'
                : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
            )}
            title={isPaused ? 'Resume auto-scroll' : 'Pause auto-scroll'}
          >
            {isPaused ? '▶ Resume' : '⏸ Pause'}
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="max-h-96 overflow-y-auto"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {filtered.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-gray-400">
            {events.length === 0 ? 'Waiting for job events…' : 'No events match current filters.'}
          </div>
        ) : (
          filtered.map((event) => (
            <EventRow
              key={event.id}
              event={event}
              expanded={expandedId === event.id}
              onToggle={() => handleToggle(event.id)}
            />
          ))
        )}
      </div>

      {filtered.length > 0 && (
        <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-800 text-[10px] text-gray-400 flex justify-between">
          <span>{filtered.length} events shown</span>
          <span>{isPaused ? 'Paused' : 'Live'}</span>
        </div>
      )}
    </div>
  );
});

export default LiveJobFeed;
