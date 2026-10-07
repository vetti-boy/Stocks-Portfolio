'use client';

import React, { useState, useEffect } from 'react';
import { Lock, KeyRound, ShieldAlert, CheckCircle2, Delete } from 'lucide-react';

interface PinLockModalProps {
  isOpen: boolean;
  onUnlock: () => void;
  storedPin: string;
  onChangePin: (newPin: string) => void;
}

export const PinLockModal: React.FC<PinLockModalProps> = ({
  isOpen,
  onUnlock,
  storedPin,
  onChangePin,
}) => {
  const [pinInput, setPinInput] = useState('');
  const [isError, setIsError] = useState(false);
  const [isChangingPinMode, setIsChangingPinMode] = useState(false);
  const [newPinStep, setNewPinStep] = useState<'old' | 'new' | 'confirm'>('old');
  const [newPinValue, setNewPinValue] = useState('');
  const [pinChangeSuccess, setPinChangeSuccess] = useState(false);

  const handlePinChangeFlow = (val: string) => {
    if (newPinStep === 'old') {
      if (val === storedPin) {
        setNewPinStep('new');
        setPinInput('');
      } else {
        setIsError(true);
        setTimeout(() => setPinInput(''), 600);
      }
    } else if (newPinStep === 'new') {
      setNewPinValue(val);
      setNewPinStep('confirm');
      setPinInput('');
    } else if (newPinStep === 'confirm') {
      if (val === newPinValue) {
        onChangePin(val);
        setPinChangeSuccess(true);
        setTimeout(() => {
          setPinChangeSuccess(false);
          setIsChangingPinMode(false);
          setNewPinStep('old');
          onUnlock();
          setPinInput('');
        }, 1200);
      } else {
        setIsError(true);
        setTimeout(() => setPinInput(''), 600);
      }
    }
  };

  const handleKeyPress = (num: string) => {
    if (pinInput.length >= 4) return;
    const nextPin = pinInput + num;
    setPinInput(nextPin);
    setIsError(false);

    if (nextPin.length === 4) {
      if (isChangingPinMode) {
        handlePinChangeFlow(nextPin);
      } else {
        if (nextPin === storedPin) {
          setTimeout(() => {
            onUnlock();
            setPinInput('');
          }, 150);
        } else {
          setIsError(true);
          setTimeout(() => {
            setPinInput('');
          }, 600);
        }
      }
    }
  };

  const handleBackspace = () => {
    setPinInput((prev) => prev.slice(0, -1));
    setIsError(false);
  };

  const handleClear = () => {
    setPinInput('');
    setIsError(false);
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if focus is inside an input or textarea
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA'
      ) {
        return;
      }

      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        handleKeyPress(e.key);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleClear();
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isOpen, pinInput, isChangingPinMode, newPinStep, storedPin, newPinValue]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-2xl animate-fadeIn">
      <div className="bg-[#0D1218] rounded-2xl w-full max-w-sm border border-[#202A35] shadow-2xl overflow-hidden">
        <div className="p-8 space-y-6 text-center relative">
          {/* Lock Header */}
          <div className="relative space-y-3">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-[#111820] border border-[#202A35] shadow-md">
              <Lock className="h-6 w-6 text-[#38BDF8]" />
            </div>
            <h2 className="text-xl font-extrabold tracking-tight text-[#F4F7FA] font-mono">
              {isChangingPinMode
                ? newPinStep === 'old'
                  ? 'Enter Current PIN'
                  : newPinStep === 'new'
                  ? 'Enter New 4-Digit PIN'
                  : 'Confirm New PIN'
                : 'StockPulse PRO Security Lock'}
            </h2>
            <p className="text-xs text-[#8D99A8]">
              {isChangingPinMode
                ? newPinStep === 'old'
                  ? 'Enter current 4-digit PIN (Default: 1234)'
                  : 'Update your screen lock PIN'
                : 'Enter 4-digit security PIN to unlock (Default: 1234)'}
            </p>
          </div>

          {/* PIN Dot Indicators */}
          <div className={`flex justify-center gap-4 py-2 ${isError ? 'animate-shake' : ''}`}>
            {[0, 1, 2, 3].map((idx) => {
              const isFilled = pinInput.length > idx;
              return (
                <div
                  key={idx}
                  className={`h-4 w-4 rounded-full border-2 transition ${
                    isError
                      ? 'border-[#EF4444] bg-[#EF4444]/40 shadow-lg'
                      : isFilled
                      ? 'border-[#38BDF8] bg-[#38BDF8] shadow-md scale-110'
                      : 'border-[#202A35] bg-[#080B10]'
                  }`}
                />
              );
            })}
          </div>

          {/* Error message */}
          {isError && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-center gap-1.5 text-xs text-[#EF4444] font-semibold">
                <ShieldAlert className="h-4 w-4 shrink-0" />
                <span>Incorrect PIN. Please try again.</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  onChangePin('1234');
                  setPinInput('');
                  setIsError(false);
                  setIsChangingPinMode(false);
                  setNewPinStep('old');
                  onUnlock();
                }}
                className="text-[11px] font-bold text-[#38BDF8] hover:underline font-mono cursor-pointer"
              >
                Reset PIN to Default (1234) & Unlock
              </button>
            </div>
          )}

          {pinChangeSuccess && (
            <div className="flex items-center justify-center gap-1.5 text-xs text-[#22C55E] font-semibold">
              <CheckCircle2 className="h-4 w-4" />
              <span>PIN updated & unlocked!</span>
            </div>
          )}

          {/* Keypad Buttons Grid */}
          <div className="grid grid-cols-3 gap-3 max-w-[260px] mx-auto pt-2">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
              <button
                key={num}
                onClick={() => handleKeyPress(num)}
                className="h-14 w-14 mx-auto rounded-xl border border-[#202A35] bg-[#080B10] hover:bg-[#111820] active:scale-95 text-lg font-mono font-bold text-[#F4F7FA] transition shadow"
              >
                {num}
              </button>
            ))}

            {/* Clear */}
            <button
              onClick={handleClear}
              className="h-14 w-14 mx-auto rounded-xl border border-[#202A35] bg-[#080B10] hover:bg-[#111820] text-xs font-semibold text-[#8D99A8] active:scale-95 transition"
            >
              Clear
            </button>

            {/* Zero */}
            <button
              onClick={() => handleKeyPress('0')}
              className="h-14 w-14 mx-auto rounded-xl border border-[#202A35] bg-[#080B10] hover:bg-[#111820] active:scale-95 text-lg font-mono font-bold text-[#F4F7FA] transition shadow"
            >
              0
            </button>

            {/* Backspace */}
            <button
              onClick={handleBackspace}
              className="h-14 w-14 mx-auto flex items-center justify-center rounded-xl border border-[#202A35] bg-[#080B10] hover:bg-[#111820] text-[#8D99A8] active:scale-95 transition"
            >
              <Delete className="h-5 w-5 text-[#8D99A8]" />
            </button>
          </div>

          {/* Change PIN toggle */}
          <div className="pt-3 border-t border-[#202A35] flex items-center justify-between text-xs font-mono">
            <button
              onClick={() => {
                setIsChangingPinMode(!isChangingPinMode);
                setNewPinStep('old');
                setPinInput('');
                setIsError(false);
              }}
              className="text-[#38BDF8] hover:underline flex items-center gap-1.5 font-medium transition"
            >
              <KeyRound className="h-3.5 w-3.5" />
              <span>{isChangingPinMode ? 'Cancel Change' : 'Change Security PIN'}</span>
            </button>

            <span className="text-[10px] text-[#596574]">AES-256-GCM</span>
          </div>
        </div>
      </div>
    </div>
  );
};

