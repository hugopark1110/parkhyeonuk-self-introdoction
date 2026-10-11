'use client';

import { useState } from 'react';
import { Play } from 'lucide-react';

export function youtubeVideoId(link: string): string | null {
  try {
    const url = new URL(link);
    if (!['https:', 'http:'].includes(url.protocol)) return null;
    const host = url.hostname.toLowerCase();
    const id = host === 'youtu.be'
      ? url.pathname.slice(1)
      : ['youtube.com', 'www.youtube.com', 'm.youtube.com'].includes(host)
        ? url.pathname === '/watch'
          ? url.searchParams.get('v')
          : url.pathname.match(/^\/(?:embed|shorts)\/([^/]+)$/)?.[1]
        : null;
    return id && /^[\w-]{11}$/.test(id) ? id : null;
  } catch { return null; }
}

export default function YouTubeVideo({ videoId, title, poster, onPlay }: {
  videoId: string;
  title: string;
  poster: string;
  onPlay: () => void;
}) {
  const [playing, setPlaying] = useState(false);
  return <figure className="story-video">
    <div className="video-frame">
      {playing ? <iframe
        src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&playsinline=1&rel=0`}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
      /> : <button className="video-poster" aria-label={`${title} 영상 재생`} onClick={() => {
        onPlay();
        setPlaying(true);
      }}>
        <img src={poster} alt="서울의 건물과 꽃밭을 배경으로 한 박현욱의 초상" />
        <span className="video-play"><Play size={26} fill="currentColor" aria-hidden="true" /><span>영상 재생</span></span>
      </button>}
    </div>
    <figcaption>박현욱의 What's in my bag · 내가 고른 물건으로 나를 소개합니다.</figcaption>
  </figure>;
}
