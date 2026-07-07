'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, Settings, SkipBack, SkipForward, Loader2 } from 'lucide-react';
import { Tracker } from '@/lib/analytics';

interface VideoPlayerProps {
  src: string;
  title: string;
  channel?: string;
  channelId?: number;
}

export default function VideoPlayer({ src, title, channel, channelId }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<any>(null);
  const trackerRef = useRef<Tracker | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [streamReady, setStreamReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [qualities, setQualities] = useState<{ height: number; bitrate: number; index: number }[]>([]);
  const [currentQuality, setCurrentQuality] = useState(-1);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const playPromiseRef = useRef<Promise<void> | null>(null);

  const isHLS = src.endsWith('.m3u8') || src.includes('.m3u8');

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    setStreamReady(false);
    setLoadError(null);
    setIsPlaying(false);

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const initHLS = async () => {
      if (isHLS) {
        try {
          const Hls = (await import('hls.js')).default;
          if (Hls.isSupported()) {
            const proxyUrl = `/api/proxy?url=${encodeURIComponent(src)}`;
            const hls = new Hls({
              startLevel: -1,
              abrEwmaDefaultEstimate: 2000000,
              abrEwmaFastVoD: 3.0,
              abrEwmaSlowVoD: 5.0,
              abrBandWidthFactor: 0.8,
              abrBandWidthUpFactor: 0.7,
              maxMaxBufferLength: 120,
              maxBufferLength: 60,
              backBufferLength: 60,
              liveSyncDurationCount: 7,
              liveMaxLatencyDurationCount: 10,
              liveDurationInfinity: true,
              lowLatencyMode: false,
              enableWorker: true,
              startFragPrefetch: true,
              highBufferWatchdogPeriod: 2,
              nudgeOffset: 0.5,
              nudgeMaxRetry: 10,
              maxStarvationDelay: 10,
              starvationDelay: 5,
              maxLoadingDelay: 8,
              fragLoadingTimeOut: 30000,
              manifestLoadingTimeOut: 30000,
              levelLoadingTimeOut: 30000,
              capLevelToPlayerSize: true,
            });
            hls.loadSource(proxyUrl);
            hls.attachMedia(video);
            hls.on(Hls.Events.MANIFEST_PARSED, () => {
              const levels = hls.levels.map((l: any, i: number) => ({ height: l.height, bitrate: l.bitrate, index: i }));
              setQualities(levels);
              setStreamReady(true);
            });
            hls.on(Hls.Events.LEVEL_SWITCHED, (_: any, data: any) => {
              setCurrentQuality(data.level);
            });
            hls.on(Hls.Events.ERROR, (_: any, data: any) => {
              if (data.fatal) {
                setLoadError(`Stream unavailable (${data.type})`);
              }
            });
            hlsRef.current = hls;
          } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = `/api/proxy?url=${encodeURIComponent(src)}`;
            setStreamReady(true);
          } else {
            setLoadError('HLS playback not supported in this browser');
          }
        } catch (err) {
          setLoadError('Failed to initialize player');
        }
      } else {
        video.src = src;
        setStreamReady(true);
      }
    };

    initHLS();

    const updateTime = () => setCurrentTime(video.currentTime);
    const updateDuration = () => setDuration(video.duration);

    video.addEventListener('timeupdate', updateTime);
    video.addEventListener('loadedmetadata', updateDuration);
    video.addEventListener('ended', () => setIsPlaying(false));
    video.addEventListener('play', () => setIsPlaying(true));
    video.addEventListener('pause', () => setIsPlaying(false));

    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);

    return () => {
      if (hlsRef.current) hlsRef.current.destroy();
      video.removeEventListener('timeupdate', updateTime);
      video.removeEventListener('loadedmetadata', updateDuration);
      video.removeEventListener('ended', () => setIsPlaying(false));
      video.removeEventListener('play', () => setIsPlaying(true));
      video.removeEventListener('pause', () => setIsPlaying(false));
      document.removeEventListener('fullscreenchange', onFullscreenChange);
    };
  }, [src, isHLS]);

  useEffect(() => {
    if (streamReady && !loadError) {
      const video = videoRef.current;
      if (video && video.paused) {
        video.play().catch(() => {});
      }
      if (channelId && !trackerRef.current) {
        trackerRef.current = new Tracker(channelId);
        trackerRef.current.start();
      }
    }
  }, [streamReady, loadError, channelId]);

  useEffect(() => {
    return () => {
      if (trackerRef.current) { trackerRef.current.stop(); trackerRef.current = null; }
    };
  }, [src]);

  useEffect(() => {
    if (showControls && !isPlaying) {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
      return;
    }
    if (showControls) {
      controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 3000);
    }
    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, [showControls, isPlaying]);

  const togglePlay = async () => {
    const video = videoRef.current;
    if (!video || loadError || !streamReady) return;

    try {
      if (isPlaying) {
        video.pause();
      } else {
        playPromiseRef.current = video.play();
        await playPromiseRef.current;
      }
    } catch {
      if (!loadError) setLoadError('Stream playback failed');
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;
    const newVolume = parseFloat(e.target.value);
    video.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;
    const newTime = parseFloat(e.target.value);
    video.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const toggleFullscreen = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    if (!document.fullscreenElement) {
      container.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }, []);

  const handleVideoDblClick = () => {
    toggleFullscreen();
  };

  const formatTime = (time: number) => {
    if (!isFinite(time) || isNaN(time)) return '--:--';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const handleMouseMove = () => setShowControls(true);

  return (
    <div
      ref={containerRef}
      className="relative bg-black rounded-[24px] overflow-hidden group"
      onMouseMove={handleMouseMove}
    >
      <video
        ref={videoRef}
        className="w-full aspect-video cursor-pointer"
        onClick={togglePlay}
        onDoubleClick={handleVideoDblClick}
        playsInline
      />

      {loadError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
          <div className="text-center px-6">
            <p className="text-white/60 text-sm mb-1">Stream unavailable</p>
            <p className="text-white/30 text-xs">This channel may be offline or restricted</p>
          </div>
        </div>
      )}

      {!loadError && !streamReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-10">
          <div className="flex items-center gap-2 text-white/50">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Loading stream...</span>
          </div>
        </div>
      )}

      <div className={`absolute inset-0 bg-gradient-to-t from-black/80 to-transparent transition-opacity duration-300 ${showControls && !loadError && streamReady ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute top-0 left-0 right-0 p-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-white text-lg font-bold">{title}</h3>
              {channel && <p className="text-[#94A3B8] text-sm">{channel}</p>}
            </div>
            {qualities.length > 0 && currentQuality >= 0 && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-[8px] bg-black/40 backdrop-blur border border-white/10">
                <span className="text-[10px] font-medium text-white/70">{qualities[currentQuality]?.height || '?'}p</span>
              </div>
            )}
          </div>
        </div>

        <div className="absolute inset-0 flex items-center justify-center">
          <button onClick={togglePlay} className="text-white bg-white/10 backdrop-blur rounded-full p-5 sm:p-4 hover:bg-white/20 transition-all hover:scale-105">
            {isPlaying ? <Pause size={32} /> : <Play size={32} />}
          </button>
        </div>

        <div className="absolute bottom-0 left-0 right-0 px-3 sm:px-5 pb-3 sm:pb-5 pt-8 bg-gradient-to-t from-black/80 to-transparent">
          <div className="mb-3">
            <input
              type="range"
              min="0"
              max={isFinite(duration) ? duration : 100}
              value={isFinite(currentTime) ? currentTime : 0}
              onChange={handleSeek}
              className="w-full h-1 bg-white/20 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#7C3AED]"
            />
            <div className="flex justify-between text-white/60 text-[11px] sm:text-xs mt-1">
              <span className="tabular-nums">{formatTime(currentTime)}</span>
              {isFinite(duration) ? <span className="tabular-nums">{formatTime(duration)}</span> : <span className="text-[#22C55E] font-semibold">LIVE</span>}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-2">
              <button onClick={togglePlay} className="text-white p-3 sm:p-2 rounded-full hover:bg-white/10 transition-colors">
                {isPlaying ? <Pause size={20} /> : <Play size={20} />}
              </button>
              <button onClick={toggleMute} className="text-white p-3 sm:p-2 rounded-full hover:bg-white/10 transition-colors">
                {isMuted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
              </button>
              <div className="hidden sm:block">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={volume}
                  onChange={handleVolumeChange}
                  className="w-16 h-1 bg-white/20 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
                />
              </div>
              <div className="relative group/qual">
                <button className="text-white p-3 sm:p-2 rounded-full hover:bg-white/10 transition-colors">
                  <span className="text-xs font-semibold">{currentQuality < 0 ? 'Auto' : `${qualities[currentQuality]?.height || '?'}p`}</span>
                </button>
                <div className="absolute bottom-full right-0 sm:left-0 mb-2 hidden group-hover/qual:block bg-[#1F2937] rounded-[14px] p-1.5 shadow-[0_25px_80px_rgba(0,0,0,.45)] border border-[rgba(255,255,255,.08)] min-w-[100px] max-h-[200px] overflow-y-auto">
                  <button
                    onClick={() => { const hl = hlsRef.current; if (hl) { hl.currentLevel = -1; setCurrentQuality(-1); } }}
                    className={`block w-full text-left px-2.5 py-1.5 text-sm rounded-[8px] hover:bg-white/5 transition-colors ${currentQuality === -1 ? 'text-[#8B5CF6]' : 'text-[#CBD5E1]'}`}
                  >
                    Auto
                  </button>
                  {qualities.map((q) => (
                    <button
                      key={q.index}
                      onClick={() => { const hl = hlsRef.current; if (hl) { hl.currentLevel = q.index; setCurrentQuality(q.index); } }}
                      className={`block w-full text-left px-2.5 py-1.5 text-sm rounded-[8px] hover:bg-white/5 transition-colors ${currentQuality === q.index ? 'text-[#8B5CF6]' : 'text-[#CBD5E1]'}`}
                    >
                      {q.height}p
                    </button>
                  ))}
                </div>
              </div>
              <div className="relative group/rate hidden sm:block">
                <button className="text-white p-2 rounded-full hover:bg-white/10 transition-colors flex items-center gap-1">
                  <Settings size={16} />
                  <span className="text-xs hidden sm:inline">{playbackRate}x</span>
                </button>
                <div className="absolute bottom-full left-0 mb-2 hidden group-hover/rate:block bg-[#1F2937] rounded-[14px] p-1.5 shadow-[0_25px_80px_rgba(0,0,0,.45)] border border-[rgba(255,255,255,.08)] min-w-[80px]">
                  {[0.5, 0.75, 1, 1.25, 1.5, 2].map(rate => (
                    <button
                      key={rate}
                      onClick={() => { if (videoRef.current) { videoRef.current.playbackRate = rate; setPlaybackRate(rate); } }}
                      className={`block w-full text-left px-2.5 py-1.5 text-sm rounded-[8px] hover:bg-white/5 transition-colors ${
                        playbackRate === rate ? 'text-[#8B5CF6]' : 'text-[#CBD5E1]'
                      }`}
                    >
                      {rate}x
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button onClick={toggleFullscreen} className="text-white p-3 sm:p-2 rounded-full hover:bg-white/10 transition-colors">
                {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
