'use client';

import { LucideIcon } from 'lucide-react';

interface StatCardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: LucideIcon;
    color: 'green' | 'gold' | 'blue' | 'purple';
    trend?: {
        value: string;
        positive: boolean;
    };
}

const colorConfig = {
    green: {
        iconBg: 'bg-emerald-50',
        iconColor: 'text-emerald-600',
        statClass: 'stat-card-green',
        glowColor: 'shadow-emerald-500/5',
    },
    gold: {
        iconBg: 'bg-accent-50',
        iconColor: 'text-accent-600',
        statClass: 'stat-card-orange',
        glowColor: 'shadow-orange-500/5',
    },
    blue: {
        iconBg: 'bg-blue-50',
        iconColor: 'text-blue-600',
        statClass: 'stat-card-blue',
        glowColor: 'shadow-blue-500/5',
    },
    purple: {
        iconBg: 'bg-primary-50',
        iconColor: 'text-primary-600',
        statClass: 'stat-card-purple',
        glowColor: 'shadow-primary-500/5',
    },
};

export default function StatCard({ title, value, subtitle, icon: Icon, color, trend }: StatCardProps) {
    const config = colorConfig[color];

    return (
        <div className={`glass-card stat-card ${config.statClass} p-4 md:p-6 shadow-sm border border-dark-100 ${config.glowColor}`}>
            <div className="flex items-start justify-between mb-3 md:mb-4">
                <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl ${config.iconBg} flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 md:w-6 md:h-6 ${config.iconColor}`} />
                </div>
                {trend && (
                    <span className={`text-[10px] md:text-xs font-semibold px-2 py-1 rounded-lg ${trend.positive
                        ? 'bg-emerald-50 text-emerald-600'
                        : 'bg-red-50 text-red-600'
                        }`}>
                        {trend.positive ? '↑' : '↓'} {trend.value}
                    </span>
                )}
            </div>
            <h3 className="text-lg md:text-2xl font-bold text-dark-900 mb-1 leading-tight" style={{ animation: 'countUp 0.6s ease-out' }}>
                {value}
            </h3>
            <p className="text-xs md:text-sm text-dark-500 font-medium leading-tight">{title}</p>
            {subtitle && (
                <p className="text-[10px] md:text-xs text-dark-400 mt-1 leading-tight">{subtitle}</p>
            )}
        </div>
    );
}
