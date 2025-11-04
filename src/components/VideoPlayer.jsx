import React, { useEffect, useRef } from 'react';
import shaka from 'shaka-player/dist/shaka-player.ui';
import 'shaka-player/dist/controls.css';

const VideoPlayer = ({ src, type }) => {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const playerRef = useRef(null);

  useEffect(() => {
    if (!videoRef.current || !containerRef.current) return;

    const initPlayer = async () => {
      if (!shaka.Player.isBrowserSupported()) {
        console.error('Browser not supported!');
        return;
      }

      const player = new shaka.Player(videoRef.current);
      playerRef.current = player;

      const ui = new shaka.ui.Overlay(player, containerRef.current, videoRef.current);
      ui.configure({
        controlPanelElements: ['play_pause', 'time_and_duration', 'spacer', 'mute', 'volume', 'fullscreen'],
        addSeekBar: true
      });

      try {
        await player.load(src);
      } catch (error) {
        console.error('Error loading video:', error);
      }
    };

    initPlayer();

    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
      }
    };
  }, [src]);

  return (
    <div ref={containerRef} style={{ width: '100%', maxHeight: '75vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <video ref={videoRef} style={{ maxWidth: '100%', maxHeight: '75vh', width: 'auto', height: 'auto' }} playsInline />
    </div>
  );
};

export default VideoPlayer;
