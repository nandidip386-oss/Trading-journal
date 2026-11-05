import React, { useState } from 'react';
import { usePWAInstall } from './usePWAInstall';
import { Download, Sparkles, X, Share2, PlusSquare } from 'lucide-react';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already installed as standalone PWA
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop install prompt
  if (isInstallable) {
    return (
      <button
        onClick={install}
        title="Install MyFX Journal as a Desktop / Mobile App"
        className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-md shadow-emerald-900/30 cursor-pointer shrink-0"
      >
        <Download className="w-3.5 h-3.5 animate-bounce" />
        <span className="hidden md:inline">Download App</span>
        <span className="md:hidden">Install</span>
      </button>
    );
  }

  // iOS Safari Install Instruction Guide
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          title="Install MyFX Journal on iOS"
          className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer shrink-0"
        >
          <Download className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden md:inline">Download App</span>
          <span className="md:hidden">Install</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-sm rounded-2xl bg-[#0f1420] border border-slate-700 p-6 shadow-2xl relative">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold text-white">Install MyFX Journal on iOS</h3>
                </div>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs text-slate-300 leading-relaxed mb-5">
                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 font-bold shrink-0">1</span>
                  <p>
                    Tap the <Share2 className="w-3.5 h-3.5 inline mx-1 text-sky-400" /> <strong>Share</strong> button in your Safari toolbar at the bottom of the screen.
                  </p>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 font-bold shrink-0">2</span>
                  <p>
                    Scroll down and tap <PlusSquare className="w-3.5 h-3.5 inline mx-1 text-emerald-400" /> <strong>Add to Home Screen</strong>.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-bold shadow-md cursor-pointer hover:opacity-95"
              >
                Got It
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  // Fallback for desktop browsers where install prompt isn't immediately triggered
  return (
    <button
      onClick={() => {
        alert('To install MyFX Journal as a desktop app, click your browser menu (three dots or menu bar) and select "Install MyFX Journal" or "Save and share > Install App".');
      }}
      title="Install MyFX Journal App"
      className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer shrink-0"
    >
      <Download className="w-3.5 h-3.5 text-emerald-400" />
      <span className="hidden md:inline">Download App</span>
      <span className="md:hidden">Install</span>
    </button>
  );
};
