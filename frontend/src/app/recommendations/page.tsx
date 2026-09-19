'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Sparkles, CheckCircle, AlertCircle, HelpCircle, ArrowRight, Filter } from 'lucide-react';

export default function RecommendationsPage() {
  const [profile, setProfile] = useState({
    state: 'Maharashtra',
    category: 'OBC',
    profession: 'STUDENT',
    income: 180000,
    age: 21
  });

  const [recommendations, setRecommendations] = useState<any[]>([
    {
      scheme_id: 'rec-1',
      scheme_name: 'Post-Matric Scholarship for OBC Students',
      slug: 'post-matric-scholarship-obc',
      short_description: 'Financial assistance for post-secondary education for OBC category students.',
      government_level: 'CENTRAL',
      eligibility_status: 'ELIGIBLE',
      match_score: 95,
      explanation_factors: [
        '✓ Stated occupation "STUDENT" matches eligibility criteria',
        '✓ Stated Category "OBC" matches scheme beneficiary target',
        '✓ Annual Income ₹1,80,000 is below the ₹2,50,000 threshold'
      ],
      missing_information: []
    },
    {
      scheme_id: 'rec-2',
      scheme_name: 'State Higher Education Fee Concession Scheme',
      slug: 'state-higher-ed-concession',
      short_description: 'Tuition fee reimbursement for eligible Maharashtra state domicile students.',
      government_level: 'STATE',
      eligibility_status: 'UNKNOWN',
      match_score: 65,
      explanation_factors: [
        '✓ State domicile "Maharashtra" matches scheme scope',
        '⚠ Marksheet percentage required to confirm final eligibility'
      ],
      missing_information: ['percentage_marks']
    }
  ]);

  const [loading, setLoading] = useState(false);

  const fetchRecommendations = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:8000/api/v1/recommendations/personalized', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile)
      });
      if (res.ok) {
        const data = await res.json();
        setRecommendations(data.recommendations || []);
      }
    } catch (e) {
      console.error('Failed to fetch recommendations:', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8 border-b pb-6">
        <div className="flex items-center space-x-3 mb-2">
          <Sparkles className="w-8 h-8 text-amber-600" />
          <h1 className="text-3xl font-bold text-slate-900">Personalized Scheme Discovery</h1>
        </div>
        <p className="text-slate-600 text-lg">
          Discover government schemes matching your circumstances, with 100% transparent eligibility explanations powered by our deterministic engine.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Card / Filter */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm h-fit">
          <div className="flex items-center space-x-2 text-slate-900 font-semibold mb-4 text-lg">
            <Filter className="w-5 h-5 text-indigo-600" />
            <span>Your Profile Criteria</span>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">State Domicile</label>
              <input
                type="text"
                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                value={profile.state}
                onChange={(e) => setProfile({ ...profile, state: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Occupation / Profession</label>
              <input
                type="text"
                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                value={profile.profession}
                onChange={(e) => setProfile({ ...profile, profession: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Beneficiary Category</label>
              <input
                type="text"
                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                value={profile.category}
                onChange={(e) => setProfile({ ...profile, category: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Annual Family Income (₹)</label>
              <input
                type="number"
                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                value={profile.income}
                onChange={(e) => setProfile({ ...profile, income: Number(e.target.value) })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Age</label>
              <input
                type="number"
                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                value={profile.age}
                onChange={(e) => setProfile({ ...profile, age: Number(e.target.value) })}
              />
            </div>

            <button
              onClick={fetchRecommendations}
              disabled={loading}
              className="w-full bg-indigo-600 text-white font-medium py-2.5 rounded-lg hover:bg-indigo-700 transition"
            >
              {loading ? 'Evaluating Engine...' : 'Update Recommendations'}
            </button>
          </div>
        </div>

        {/* Recommendations List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900">
              Top Matched Schemes ({recommendations.length})
            </h2>
            <span className="text-xs text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
              Deterministic Engine Verified
            </span>
          </div>

          {recommendations.map((rec) => (
            <div key={rec.scheme_id} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded mb-2 inline-block">
                    {rec.government_level} SCHEME
                  </span>
                  <h3 className="text-xl font-semibold text-slate-900">{rec.scheme_name}</h3>
                </div>

                <div className="text-right">
                  <span
                    className={`inline-flex items-center space-x-1 text-xs font-semibold px-2.5 py-1 rounded-full ${
                      rec.eligibility_status === 'ELIGIBLE'
                        ? 'bg-emerald-100 text-emerald-800'
                        : rec.eligibility_status === 'UNKNOWN'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {rec.eligibility_status === 'ELIGIBLE' && <CheckCircle className="w-3.5 h-3.5" />}
                    {rec.eligibility_status === 'UNKNOWN' && <HelpCircle className="w-3.5 h-3.5" />}
                    {rec.eligibility_status === 'NOT_ELIGIBLE' && <AlertCircle className="w-3.5 h-3.5" />}
                    <span>{rec.eligibility_status}</span>
                  </span>
                  <p className="text-xs text-slate-500 mt-1">{rec.match_score}% Match</p>
                </div>
              </div>

              <p className="text-slate-600 text-sm mb-4">{rec.short_description}</p>

              {/* Transparent Explanation Factors */}
              <div className="bg-slate-50 border border-slate-100 rounded-lg p-4 mb-4">
                <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Why this scheme matches your profile:
                </p>
                <ul className="space-y-1">
                  {rec.explanation_factors.map((factor: string, idx: number) => (
                    <li key={idx} className="text-xs text-slate-700 font-mono">
                      {factor}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex items-center justify-between pt-2">
                <Link
                  href={`/schemes/${rec.slug || rec.scheme_id}`}
                  className="inline-flex items-center space-x-1.5 text-sm font-semibold text-indigo-600 hover:text-indigo-800"
                >
                  <span>View Scheme Details & Apply</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
