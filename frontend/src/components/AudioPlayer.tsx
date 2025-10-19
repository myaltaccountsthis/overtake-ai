import React, { useRef, useState } from "react";

interface AudioPlayerProps {
  audioUrl: string;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ audioUrl }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isMuted, setIsMuted] = useState(false);

  const handlePlay = () => {
    audioRef.current?.play();
  };

  const handlePause = () => {
    audioRef.current?.pause();
  };

  const handleStop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !audioRef.current.muted;
      setIsMuted(audioRef.current.muted);
    }
  };

  return (
    <div className="flex items-center gap-2 p-4 bg-slate-800 rounded border border-slate-700">
      <audio ref={audioRef} src={audioUrl} />
      <button onClick={handlePlay} className="px-3 py-1 bg-green-600 rounded">
        Play
      </button>
      <button onClick={handlePause} className="px-3 py-1 bg-yellow-600 rounded">
        Pause
      </button>
      <button onClick={handleStop} className="px-3 py-1 bg-red-600 rounded">
        Stop
      </button>
      <button onClick={toggleMute} className="px-3 py-1 bg-blue-600 rounded">
        {isMuted ? "Unmute" : "Mute"}
      </button>
    </div>
  );
};

export default AudioPlayer;
