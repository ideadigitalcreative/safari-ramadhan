'use client';

interface EmptyStateProps {
    icon: React.ReactNode;
    title: string;
    description: string;
    action?: React.ReactNode;
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <div className="w-20 h-20 rounded-3xl bg-dark-50 flex items-center justify-center mb-5 border border-dark-100 shadow-sm">
                {icon}
            </div>
            <h3 className="text-lg font-bold text-dark-900 mb-2">{title}</h3>
            <p className="text-sm text-dark-500 max-w-md mb-6">{description}</p>
            {action}
        </div>
    );
}
