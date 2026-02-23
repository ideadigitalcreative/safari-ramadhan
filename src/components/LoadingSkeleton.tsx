'use client';

export default function LoadingSkeleton({ rows = 5 }: { rows?: number }) {
    return (
        <div className="space-y-3">
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className="shimmer h-16 rounded-xl" style={{ animationDelay: `${i * 0.1}s` }} />
            ))}
        </div>
    );
}

export function StatSkeleton() {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="shimmer h-36 rounded-2xl" style={{ animationDelay: `${i * 0.1}s` }} />
            ))}
        </div>
    );
}
