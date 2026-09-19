import React, { useState } from 'react';
import { Mic, MicOff, Volume2, Globe, CheckCircle, RefreshCw, X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onTranscriptConfirmed: (text: string) => void;
}

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'hi', name: 'हिन्दी (Hindi)' },
  { code: 'mr', name: 'मराठी (Marathi)' },
  { code: 'ta', name: 'தமிழ் (Tamil)' },
  { code: 'te', name: 'తెలుగు (Telugu)' },
  { code: 'bn', name: 'বাংলা (Bengali)' },
  { code: 'gu', name: 'ગુજરાતી (Gujarati)' },
  { code: 'kn', name: 'कन्नड (Kannada)' },
  { code: 'ml', name: 'മലയാളം (Malayalam)' },
  { code: 'pa', name: 'ਪੰਜਾਬੀ (Punjabi)' }
];

export function VoiceInputModal({ isOpen, onClose, onTranscriptConfirmed }: Props) {
  const [isRecording, setIsRecording] = useState(false);
  const [language, setLanguage] = useState('en');
  const [transcription, setTranscription] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);

  if (!isOpen) return null;

  const handleStartRecording = () => {
    setIsRecording(true);
    setTranscription('');
    // Simulate recording for 2.5 seconds
    setTimeout(() => {
      setIsRecording(false);
      setIsTranscribing(true);
      setTimeout(() => {
        setIsTranscribing(false);
        if (language === 'hi') setTranscription('छात्रों के लिए कौन सी छात्रवृत्ति योजनाएं उपलब्ध हैं?');
        else if (language === 'mr') setTranscription('माझ्यासाठी कोणत्या शासकीय योजना आहेत?');
        else setTranscription('What government scholarship schemes are available for engineering students?');
      }, 1000);
    }, 2500);
  };

  const handleConfirm = () => {
    if (transcription.trim()) {
      onTranscriptConfirmed(transcription);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-6 shadow-2xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gov-blue/10 text-gov-blue flex items-center justify-center mx-auto">
            <Volume2 className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Multilingual Voice Assistant</h3>
          <p className="text-xs text-slate-500">Speak your query in your preferred Indian language</p>
        </div>

        {/* Language Selector */}
        <div className="flex items-center gap-2 justify-center">
          <Globe className="w-4 h-4 text-slate-400" />
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none"
          >
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>{l.name}</option>
            ))}
          </select>
        </div>

        {/* Recording Button */}
        <div className="flex flex-col items-center justify-center space-y-3 py-4">
          <button
            onClick={handleStartRecording}
            disabled={isRecording || isTranscribing}
            className={`w-20 h-20 rounded-full flex items-center justify-center transition-all shadow-lg ${
              isRecording
                ? 'bg-rose-600 text-white animate-pulse ring-8 ring-rose-200'
                : 'bg-gov-blue text-white hover:bg-gov-blue/90'
            }`}
          >
            {isRecording ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
          </button>
          <span className="text-xs font-bold text-slate-600">
            {isRecording ? 'Listening... Speak now' : isTranscribing ? 'Transcribing speech...' : 'Tap Mic to Speak'}
          </span>
        </div>

        {/* Transcription Feedback: "Did I understand correctly?" */}
        {transcription && (
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-500 font-bold">
              <span>Recognized Speech:</span>
              <span className="text-emerald-600 font-extrabold flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" /> High Confidence (98%)
              </span>
            </div>

            <textarea
              value={transcription}
              onChange={(e) => setTranscription(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-gov-blue focus:outline-none"
              rows={2}
            />

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setTranscription('')}
                className="px-3 py-1.5 border border-slate-300 text-slate-600 text-xs rounded-lg font-semibold"
              >
                Re-take
              </button>
              <button
                onClick={handleConfirm}
                className="px-4 py-1.5 bg-emerald-600 text-white text-xs rounded-lg font-bold hover:bg-emerald-700 transition-colors"
              >
                Confirm & Submit
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
