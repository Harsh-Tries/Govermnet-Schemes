'use client';

import React from 'react';
import { Bookmark } from 'lucide-react';
import { MOCK_SCHEMES } from '../../data/mockSchemes';
import { SchemeCard } from '../../components/dashboard/SchemeCard';

export default function SavedPage() {
  const savedSchemes = MOCK_SCHEMES.slice(0, 2);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Bookmark className="w-6 h-6 text-purple-600" />
          Saved Schemes Workspace
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Track bookmarked schemes, application deadlines, and required document readiness
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {savedSchemes.map((scheme) => (
          <SchemeCard key={scheme.id} scheme={scheme} isBookmarked={true} />
        ))}
      </div>
    </div>
  );
}
