import React from 'react';
import { PackageSystem } from '@/lib/package-system';
import { PosterBuilder } from '@/components/dashboard/poster-generator/PosterBuilder';

export default async function PostersPage() {
    // In a real app, you would fetch the user's package type from the database or session.
    // For MVP demonstration, we will simulate a PRO user:
    const mockPackageType = 'PRO';

    // Limits control watermark, quality, etc.
    const limits = PackageSystem.getLimits(mockPackageType);

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Afiş Oluşturma Motoru</h1>
                    <p className="text-muted-foreground mt-2 text-lg">
                        Mevcut paketiniz: <span className="font-bold text-primary">{mockPackageType}</span>
                        <span className="ml-2 text-sm bg-slate-100 px-2 py-1 rounded">Kalite: {limits.posterQuality}</span>
                        {!limits.watermark && <span className="ml-2 text-sm bg-green-100 text-green-700 px-2 py-1 rounded">Filigransız</span>}
                    </p>
                </div>
            </div>

            <PosterBuilder
                packageType={mockPackageType}
                limits={limits}
            />
        </div>
    );
}
