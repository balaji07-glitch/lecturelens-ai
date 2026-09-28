import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  FastForward,
  RotateCcw,
  Edit2,
  Check,
  X,
  Clock,
  Sparkles,
  Volume1,
} from 'lucide-react';
import type { TranscriptSegment } from '../../types/index.ts';

interface AudioWaveformPlayerProps {
  segments: TranscriptSegment[];
  activeSegmentId?: string;
  audioUrl?: string;
  onSelectSegment?: (segment: TranscriptSegment) => void;
  onSaveCorrection?: (segmentId: string, newText: string, explanation: string) => Promise<void>;
}

export const AudioWaveformPlayer: React.FC<AudioWaveformPlayerProps> = ({
  segments,
  activeSegmentId,
  audioUrl,
  onSelectSegment,
  onSaveCorrection,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(270); // Default 4m 30s
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.9);
  const [hasAudioFile, setHasAudioFile] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [editExplanation, setEditExplanation] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [audioSourceNotice, setAudioSourceNotice] = useState<string | null>(null);

  const timerRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Play a soft chime/tone using Web Audio API to give immediate auditory feedback
  const playSoundTone = (freq = 440, type: OscillatorType = 'sine', durationSec = 0.15) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioCtx();
      }
      if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(isMuted ? 0 : volume * 0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + durationSec);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + durationSec);
    } catch (e) {
      console.warn('Web Audio synth notice:', e);
    }
  };

  // Web Speech API text-to-speech for segment narration when audio file is absent or as fallback
  const speakCurrentSegment = (text: string) => {
    if (!('speechSynthesis' in window) || isMuted) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = playbackRate * 0.95;
      utterance.volume = isMuted ? 0 : volume;
      utterance.onend = () => {
        // Voice finished reading current segment
      };
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Speech synthesis error:', e);
    }
  };

  const stopSpeech = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  };

  useEffect(() => {
    if (segments.length > 0) {
      const maxEnd = Math.max(...segments.map((s) => s.end_time));
      if (maxEnd > 0) setDuration(maxEnd);
    }
  }, [segments]);

  // Sync HTML5 Audio element state
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [playbackRate, volume, isMuted]);

  // Timer & Speech loop when playing
  useEffect(() => {
    if (isPlaying) {
      if (!hasAudioFile) {
        // Fallback synthetic interval playback & speech synthesis
        timerRef.current = window.setInterval(() => {
          setCurrentTime((prev) => {
            if (prev >= duration) {
              setIsPlaying(false);
              stopSpeech();
              return 0;
            }
            return prev + 1 * playbackRate;
          });
        }, 1000 / playbackRate);
      }
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      stopSpeech();
      if (audioRef.current && hasAudioFile) {
        audioRef.current.pause();
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, duration, playbackRate, hasAudioFile]);

  // Speak segment text when current active segment changes while playing (in speech mode)
  const currentActiveSegment =
    segments.find((s) => currentTime >= s.start_time && currentTime <= s.end_time) ||
    segments.find((s) => s.id === activeSegmentId) ||
    segments[0];

  useEffect(() => {
    if (isPlaying && !hasAudioFile && currentActiveSegment?.text) {
      speakCurrentSegment(currentActiveSegment.text);
    }
  }, [currentActiveSegment?.id, isPlaying, hasAudioFile]);

  const togglePlay = () => {
    const nextPlaying = !isPlaying;
    setIsPlaying(nextPlaying);
    playSoundTone(nextPlaying ? 523.25 : 349.23, 'sine', 0.12);

    if (audioRef.current && hasAudioFile) {
      if (nextPlaying) {
        audioRef.current.play().catch(() => {
          setHasAudioFile(false);
          setAudioSourceNotice('Using interactive voice & synthetic audio engine');
        });
      } else {
        audioRef.current.pause();
      }
    } else if (nextPlaying && currentActiveSegment?.text) {
      speakCurrentSegment(currentActiveSegment.text);
    } else if (!nextPlaying) {
      stopSpeech();
    }
  };

  const handleSeek = (newTime: number) => {
    setCurrentTime(newTime);
    playSoundTone(659.25, 'triangle', 0.08);

    if (audioRef.current && hasAudioFile) {
      audioRef.current.currentTime = newTime;
    } else {
      stopSpeech();
      const seg = segments.find((s) => newTime >= s.start_time && newTime <= s.end_time);
      if (isPlaying && seg?.text) {
        speakCurrentSegment(seg.text);
      }
    }
  };

  const handleSegmentClick = (seg: TranscriptSegment) => {
    setCurrentTime(seg.start_time);
    setIsPlaying(true);
    playSoundTone(587.33, 'sine', 0.15);

    if (audioRef.current && hasAudioFile) {
      audioRef.current.currentTime = seg.start_time;
      audioRef.current.play().catch(() => {
        setHasAudioFile(false);
        speakCurrentSegment(seg.text);
      });
    } else {
      speakCurrentSegment(seg.text);
    }

    if (onSelectSegment) onSelectSegment(seg);
  };

  const startEdit = (seg: TranscriptSegment, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(seg.id);
    setEditText(seg.text);
    setEditExplanation('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditText('');
    setEditExplanation('');
  };

  const saveEdit = async (segId: string) => {
    if (!onSaveCorrection) return;
    try {
      setIsSaving(true);
      await onSaveCorrection(segId, editText, editExplanation);
      setEditingId(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div className="space-y-4">
      {/* HTML5 Audio Tag */}
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          preload="metadata"
          onLoadedMetadata={() => {
            if (audioRef.current && audioRef.current.duration) {
              setDuration(audioRef.current.duration);
              setHasAudioFile(true);
              setAudioSourceNotice('Stereo audio track loaded');
            }
          }}
          onTimeUpdate={() => {
            if (audioRef.current && hasAudioFile) {
              setCurrentTime(audioRef.current.currentTime);
            }
          }}
          onEnded={() => {
            setIsPlaying(false);
          }}
          onError={() => {
            setHasAudioFile(false);
            setAudioSourceNotice('Using interactive voice & synthetic audio engine');
          }}
        />
      )}

      {/* Audio Player Control Bar */}
      <div className="glass-panel p-4 border border-white/[0.08]">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Play/Pause & Time */}
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={togglePlay}
              className="h-11 w-11 flex items-center justify-center rounded-xl bg-violet-600 hover:bg-violet-500 active:scale-95 text-white shadow-lg shadow-violet-600/40 transition-all shrink-0 cursor-pointer"
              aria-label={isPlaying ? 'Pause Lecture' : 'Play Lecture'}
            >
              {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
            </button>

            <button
              onClick={() => handleSeek(Math.max(0, currentTime - 10))}
              className="p-2 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
              title="Rewind 10s"
            >
              <RotateCcw className="h-4 w-4" />
            </button>

            <div className="font-mono text-xs text-slate-300">
              <span className="text-white font-semibold">{formatTime(currentTime)}</span>
              <span className="text-slate-500 mx-1">/</span>
              <span className="text-slate-400">{formatTime(duration)}</span>
            </div>
          </div>

          {/* Interactive Scrub Bar */}
          <div className="w-full flex-1 px-2">
            <div
              className="relative h-2.5 w-full bg-white/[0.1] rounded-full cursor-pointer overflow-hidden group"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const pos = (e.clientX - rect.left) / rect.width;
                handleSeek(pos * duration);
              }}
            >
              <div
                className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-violet-500 via-indigo-500 to-cyan-400 rounded-full transition-all"
                style={{ width: `${(currentTime / Math.max(1, duration)) * 100}%` }}
              />
            </div>
          </div>

          {/* Speed & Mute Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const rates = [1, 1.25, 1.5, 2, 0.75];
                const nextIdx = (rates.indexOf(playbackRate) + 1) % rates.length;
                setPlaybackRate(rates[nextIdx]);
                playSoundTone(700, 'sine', 0.05);
              }}
              className="px-2.5 py-1 text-xs font-mono font-medium rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-slate-300 transition-colors cursor-pointer"
            >
              {playbackRate}x
            </button>

            <button
              onClick={() => {
                const nextMuted = !isMuted;
                setIsMuted(nextMuted);
                if (nextMuted) stopSpeech();
                playSoundTone(nextMuted ? 220 : 440, 'sine', 0.1);
              }}
              className="p-2 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
              aria-label={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <VolumeX className="h-4 w-4 text-amber-400" /> : <Volume2 className="h-4 w-4 text-cyan-300" />}
            </button>
          </div>
        </div>

        {/* Audio Engine Mode Tag */}
        <div className="mt-2.5 pt-2 border-t border-white/[0.04] flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <div className="flex items-center gap-1.5">
            <Volume1 className="h-3.5 w-3.5 text-violet-400 animate-pulse" />
            <span>
              {audioSourceNotice ||
                (hasAudioFile
                  ? 'Playing original recording stream'
                  : 'Speech engine & Web Audio sound active')}
            </span>
          </div>
          {isPlaying && (
            <span className="text-emerald-400 flex items-center gap-1 font-semibold">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
              Audible Playback Active
            </span>
          )}
        </div>
      </div>

      {/* Timestamped Transcript Segments */}
      <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
        {segments.map((seg) => {
          const isActive = currentActiveSegment?.id === seg.id;
          const isEditing = editingId === seg.id;

          return (
            <div
              key={seg.id}
              onClick={() => handleSegmentClick(seg)}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer relative ${
                isActive
                  ? 'bg-violet-600/15 border-violet-500/50 shadow-lg shadow-violet-500/10'
                  : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04] hover:border-white/[0.12]'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span
                    className={`flex items-center gap-1 font-mono text-xs font-semibold px-2 py-0.5 rounded border ${
                      isActive
                        ? 'text-violet-200 bg-violet-500/20 border-violet-400/40'
                        : 'text-violet-300 bg-violet-500/10 border-violet-500/20'
                    }`}
                  >
                    <Clock className="h-3 w-3" />
                    {formatTime(seg.start_time)} – {formatTime(seg.end_time)}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">{seg.speaker || 'Speaker'}</span>
                  {seg.correction_status === 'edited' && (
                    <span className="text-[10px] text-emerald-400 px-1.5 py-0.2 rounded bg-emerald-500/10 border border-emerald-500/20">
                      User Corrected
                    </span>
                  )}
                  {isActive && isPlaying && (
                    <span className="text-[10px] text-cyan-300 px-1.5 py-0.2 rounded bg-cyan-500/10 border border-cyan-500/30 flex items-center gap-1 font-mono">
                      <Volume2 className="h-3 w-3 animate-pulse" /> Speaking Now
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-500 font-mono">
                    {Math.round(seg.confidence * 100)}% conf
                  </span>
                  {!isEditing && (
                    <button
                      onClick={(e) => startEdit(seg, e)}
                      className="p-1 text-slate-500 hover:text-violet-300 rounded transition-colors"
                      title="Edit transcript text"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {isEditing ? (
                <div className="space-y-2 mt-2" onClick={(e) => e.stopPropagation()}>
                  <textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    rows={3}
                    className="w-full text-xs p-2 rounded-lg bg-black/40 border border-violet-500/40 text-white focus:outline-none focus:ring-1 focus:ring-violet-400"
                  />
                  <input
                    type="text"
                    value={editExplanation}
                    onChange={(e) => setEditExplanation(e.target.value)}
                    placeholder="Reason for correction (optional)..."
                    className="w-full text-xs p-1.5 rounded-lg bg-black/40 border border-white/[0.1] text-slate-300"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={cancelEdit}
                      className="px-2 py-1 text-xs text-slate-400 hover:text-white rounded"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => saveEdit(seg.id)}
                      disabled={isSaving}
                      className="px-3 py-1 text-xs font-medium text-white bg-violet-600 hover:bg-violet-500 rounded-lg flex items-center gap-1"
                    >
                      <Check className="h-3 w-3" />
                      {isSaving ? 'Saving...' : 'Save Correction'}
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                  {seg.text}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

