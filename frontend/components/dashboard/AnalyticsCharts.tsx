interface PerformanceChartProps {
    data: { label: string; value: number }[];
    title: string;
    type?: 'bar' | 'line';
}

export function PerformanceChart({ data, title, type = 'bar' }: PerformanceChartProps) {
    const maxValue = Math.max(...data.map(d => d.value));

    return (
        <div className="bg-white rounded-xl border p-4">
            <h3 className="font-semibold text-gray-900 mb-4">{title}</h3>

            <div className="space-y-3">
                {data.map((item, index) => (
                    <div key={index} className="flex items-center gap-3">
                        <span className="w-16 text-sm text-gray-500 flex-shrink-0">{item.label}</span>
                        <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500"
                                style={{ width: `${(item.value / maxValue) * 100}%` }}
                            />
                        </div>
                        <span className="w-12 text-sm font-medium text-gray-900 text-right">{item.value}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

interface ConversionFunnelProps {
    stages: { label: string; value: number; percentage?: number }[];
}

export function ConversionFunnel({ stages }: ConversionFunnelProps) {
    return (
        <div className="bg-white rounded-xl border p-4">
            <h3 className="font-semibold text-gray-900 mb-4">Dönüşüm Hunisi</h3>

            <div className="space-y-2">
                {stages.map((stage, index) => {
                    const widthPercent = 100 - (index * 15);
                    return (
                        <div key={index} className="relative">
                            <div
                                className="h-12 bg-gradient-to-r from-blue-500 to-blue-400 rounded-lg flex items-center justify-between px-4 text-white transition-all"
                                style={{ width: `${widthPercent}%` }}
                            >
                                <span className="font-medium text-sm truncate">{stage.label}</span>
                                <span className="font-bold">{stage.value.toLocaleString()}</span>
                            </div>
                            {stage.percentage !== undefined && index > 0 && (
                                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-xs text-gray-500">
                                    ↓ {stage.percentage}%
                                </span>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

interface TrafficSourceProps {
    sources: { name: string; percentage: number; color: string }[];
}

export function TrafficSources({ sources }: TrafficSourceProps) {
    return (
        <div className="bg-white rounded-xl border p-4">
            <h3 className="font-semibold text-gray-900 mb-4">Trafik Kaynakları</h3>

            {/* Progress Bar */}
            <div className="h-4 rounded-full overflow-hidden flex mb-4">
                {sources.map((source, index) => (
                    <div
                        key={index}
                        className={`h-full ${source.color}`}
                        style={{ width: `${source.percentage}%` }}
                    />
                ))}
            </div>

            {/* Legend */}
            <div className="grid grid-cols-2 gap-2">
                {sources.map((source, index) => (
                    <div key={index} className="flex items-center gap-2">
                        <span className={`w-3 h-3 rounded-full ${source.color}`} />
                        <span className="text-sm text-gray-600">{source.name}</span>
                        <span className="text-sm font-medium text-gray-900 ml-auto">{source.percentage}%</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
