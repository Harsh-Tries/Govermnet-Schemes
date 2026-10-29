'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Landmark,
  Mail,
  Lock,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  User,
  Sparkles
} from 'lucide-react';
import { loginCitizen } from '../../services/authApi';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!email.trim()) {
        throw new Error('Please enter your email address.');
      }
      await loginCitizen({ email: email.trim(), password });
      router.push('/recommendations');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      await loginCitizen({ email: 'demo-citizen-user' });
      router.push('/recommendations');
    } catch (err: any) {
      setError(err.message || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200/90 shadow-card p-6 sm:p-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-gov-blue/10 border border-gov-blue/20 text-gov-blue flex items-center justify-center">
            <Landmark className="w-6 h-6 text-gov-blue" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Citizen Sign In</h1>
          <p className="text-xs sm:text-sm text-slate-600">
            Access your saved Maharashtra schemes, eligibility checks, and active applications.
          </p>
        </div>

        {/* Error notification */}
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-2.5 text-xs">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <p className="font-medium">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="citizen@example.gov.in"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-gov-blue focus:ring-2 focus:ring-gov-blue/10 rounded-xl text-sm font-medium text-slate-900 outline-none transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-gov-blue focus:ring-2 focus:ring-gov-blue/10 rounded-xl text-sm font-medium text-slate-900 outline-none transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-gov-blue hover:bg-gov-blue/90 disabled:opacity-50 text-white font-semibold rounded-xl text-sm shadow-md shadow-gov-blue/20 flex items-center justify-center gap-2 transition"
          >
            {loading ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>Sign In to Portal</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Demo Login Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handleDemoLogin}
            disabled={loading}
            className="w-full py-2.5 px-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold rounded-xl text-xs flex items-center justify-center gap-2 transition"
          >
            <User className="w-3.5 h-3.5 text-gov-blue" />
            <span>Instant Demo Login (Rohan Sharma)</span>
          </button>
        </div>

        {/* New Citizen link */}
        <div className="pt-4 border-t border-slate-100 text-center space-y-2">
          <p className="text-xs text-slate-600">
            First time visiting? Complete our quick onboarding to get custom scheme recommendations.
          </p>
          <Link
            href="/onboarding"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-gov-blue hover:underline"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Start Citizen Onboarding &rarr;</span>
          </Link>
        </div>

        {/* Security badge */}
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Secured by PBKDF2 Hashing &amp; JWT Verification</span>
        </div>
      </div>
    </div>
  );
}
