'use client';

import React, { useState } from 'react';
import { FileText, GitBranch, TrendingUp, Server, BookOpen, ExternalLink, Code2, Terminal } from 'lucide-react';

export const InsightsTab: React.FC = () => {
  const [activeDoc, setActiveDoc] = useState<'insights' | 'version'>('insights');

  return (
    <div className="space-y-6">
      {/* Header Document Switcher */}
      <div className="glass-panel p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-cyan-400" /> Project Documentation & Insights Hub
          </h2>
          <p className="text-xs text-slate-400">
            Comprehensive architectural specs, financial formulas, version history, and deployment guides for Vercel & Render.
          </p>
        </div>

        <div className="flex items-center rounded-xl bg-slate-900 border border-white/10 p-1 text-xs font-semibold">
          <button
            onClick={() => setActiveDoc('insights')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg transition ${
              activeDoc === 'insights'
                ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="h-3.5 w-3.5" /> PROJECT_INSIGHTS.md
          </button>
          <button
            onClick={() => setActiveDoc('version')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg transition ${
              activeDoc === 'version'
                ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <GitBranch className="h-3.5 w-3.5" /> VERSION.md Log
          </button>
        </div>
      </div>

      {activeDoc === 'insights' ? (
        <div className="space-y-6">
          {/* Quick Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="glass-panel p-5 space-y-2 border-l-4 border-indigo-500">
              <div className="flex items-center justify-between text-indigo-400 font-bold text-xs">
                <span>Architecture</span>
                <Code2 className="h-4 w-4" />
              </div>
              <h4 className="text-white font-semibold text-sm">Next.js 15 (App Router)</h4>
              <p className="text-xs text-slate-400">
                Built with React 19, TypeScript, Tailwind CSS v4, and Lucide React.
              </p>
            </div>

            <div className="glass-panel p-5 space-y-2 border-l-4 border-emerald-500">
              <div className="flex items-center justify-between text-emerald-400 font-bold text-xs">
                <span>Live Socket Stream</span>
                <Server className="h-4 w-4" />
              </div>
              <h4 className="text-white font-semibold text-sm">Real-time Ticker Engine</h4>
              <p className="text-xs text-slate-400">
                Simulated WebSockets with price tick flash indicators & quote fallback polling.
              </p>
            </div>

            <div className="glass-panel p-5 space-y-2 border-l-4 border-cyan-500">
              <div className="flex items-center justify-between text-cyan-400 font-bold text-xs">
                <span>Reverse Tax Calculator</span>
                <TrendingUp className="h-4 w-4" />
              </div>
              <h4 className="text-white font-semibold text-sm">Target Sell Price Derivation</h4>
              <p className="text-xs text-slate-400">
                Solves exact sell price required for target net profit after STCG/LTCG & fee deductions.
              </p>
            </div>
          </div>

          {/* Deployment Instructions Section */}
          <div className="glass-panel p-6 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-white/10 pb-3">
              <TrendingUp className="h-5 w-5 text-indigo-400" /> Host Application on Vercel or Render
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Vercel Option */}
              <div className="rounded-xl bg-slate-950/80 border border-white/10 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-white text-sm flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-white" /> Vercel Deployment (Recommended)
                  </h4>
                  <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded font-mono">
                    Zero Config
                  </span>
                </div>
                <ol className="text-xs text-slate-300 space-y-2 list-decimal list-inside">
                  <li>Push repository to GitHub:</li>
                  <div className="bg-slate-900 p-2.5 rounded font-mono text-[11px] text-cyan-300 overflow-x-auto space-y-1">
                    <div>git init</div>
                    <div>git add .</div>
                    <div>git commit -m &quot;v1.0.0 release&quot;</div>
                    <div>git remote add origin https://github.com/USER/stocks-portfolio.git</div>
                    <div>git push -u origin main</div>
                  </div>
                  <li>Import project on <strong className="text-white">vercel.com/new</strong>.</li>
                  <li>Framework Preset automatically selects <strong>Next.js</strong>.</li>
                  <li>Click <strong>Deploy</strong> to launch live web application URL!</li>
                </ol>
              </div>

              {/* Render Option */}
              <div className="rounded-xl bg-slate-950/80 border border-white/10 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-white text-sm flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-400" /> Render Deployment
                  </h4>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-mono">
                    Web Service
                  </span>
                </div>
                <ol className="text-xs text-slate-300 space-y-2 list-decimal list-inside">
                  <li>Connect repository on <strong className="text-white">dashboard.render.com</strong>.</li>
                  <li>Create a new <strong>Web Service</strong>.</li>
                  <li>Set Build Command:</li>
                  <div className="bg-slate-900 p-2 rounded font-mono text-[11px] text-emerald-300">
                    npm install &amp;&amp; npm run build
                  </div>
                  <li>Set Start Command:</li>
                  <div className="bg-slate-900 p-2 rounded font-mono text-[11px] text-emerald-300">
                    npm run start
                  </div>
                  <li>Click <strong>Create Web Service</strong> to publish!</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* VERSION.md Timeline Viewer */
        <div className="glass-panel p-6 space-y-6">
          <div className="border-b border-white/10 pb-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <GitBranch className="h-5 w-5 text-indigo-400" /> Modifications & Version Log
            </h3>
            <p className="text-xs text-slate-400">Strict chronological version tracking file (VERSION.md)</p>
          </div>

          <div className="relative border-l border-indigo-500/30 pl-6 ml-4 space-y-8">
            {/* Version 1.0.0 */}
            <div className="relative">
              <div className="absolute -left-[31px] top-0 h-4 w-4 rounded-full bg-indigo-500 border-4 border-[#090d16]" />
              <div className="flex items-center gap-3">
                <span className="font-mono font-bold text-lg text-white">v1.0.0</span>
                <span className="rounded bg-emerald-500/20 text-emerald-400 px-2 py-0.5 text-xs font-semibold">
                  Initial Release
                </span>
                <span className="text-xs text-slate-500">2026-09-29</span>
              </div>
              <ul className="mt-3 text-xs text-slate-300 space-y-1.5 list-disc list-inside">
                <li>User Login &amp; Local Authentication Engine with session profile switcher.</li>
                <li>Stock Portfolio Storage: Add, edit, remove trades with live P&amp;L gain tracking.</li>
                <li>Live Market Streamer: Ticker marquee, WebSocket simulator with flash green/red ticks.</li>
                <li>Watchlist &amp; Interactive Charts: Recharts area charts, 52-week range, alert setters.</li>
                <li>Net P&amp;L Forward &amp; Target Sell Price Reverse Calculator with STCG/LTCG tax logic.</li>
                <li>Added VERSION.md, PROJECT_INSIGHTS.md, and .gitignore deployment files.</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
