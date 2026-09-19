import React, { useState } from 'react';
import { HelpCircle, ArrowRight } from 'lucide-react';

interface Props {
  missingParameters: string[];
  onUpdateProfile?: (updatedValues: Record<string, any>) => void;
}

export function MissingInformationPrompt({ missingParameters, onUpdateProfile }: Props) {
  const [inputValues, setInputValues] = useState<Record<string, string>>({});

  if (!missingParameters || missingParameters.length === 0) return null;

  const handleInputChange = (param: string, value: string) => {
    setInputValues(prev => ({ ...prev, [param]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onUpdateProfile) return;

    const parsedValues: Record<string, any> = {};
    for (const [key, val] of Object.entries(inputValues)) {
      if (!val.trim()) continue;

      if (val === 'true') parsedValues[key] = true;
      else if (val === 'false') parsedValues[key] = false;
      else if (!isNaN(Number(val))) parsedValues[key] = Number(val);
      else parsedValues[key] = val;
    }

    onUpdateProfile(parsedValues);
  };

  return (
    <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
        <HelpCircle className="w-4 h-4 text-amber-600" />
        <span>Action Required: Provide Missing Profile Information</span>
      </div>
      <p className="text-xs text-amber-800">
        The eligibility status for this scheme is <strong>UNKNOWN</strong> because the following profile parameters are missing:
      </p>

      <form onSubmit={handleSubmit} className="space-y-3 pt-1">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {missingParameters.map((param) => (
            <div key={param} className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-700 capitalize">
                {param.replace(/_/g, ' ')}
              </label>
              <input
                type="text"
                placeholder={`Enter ${param.replace(/_/g, ' ')}`}
                value={inputValues[param] || ''}
                onChange={(e) => handleInputChange(param, e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-amber-300 rounded-lg text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none text-slate-900"
              />
            </div>
          ))}
        </div>

        {onUpdateProfile && (
          <div className="flex justify-end pt-1">
            <button
              type="submit"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 text-white font-bold text-xs rounded-lg hover:bg-amber-700 transition-colors shadow-sm"
            >
              <span>Update Profile & Re-evaluate</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
