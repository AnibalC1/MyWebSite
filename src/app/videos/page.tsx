import VideoTheater from '@/components/VideoTheater';
import type { VideoClip } from '@/components/VideoTheater';

const CLIPS: VideoClip[] = [
  { src: '/video/hero-1.mp4', title: 'The Discipline' },
  { src: '/video/hero-2.mp4', title: 'The Roll'       },
  { src: '/video/hero-3.mp4', title: 'The Ground'     },
  { src: '/video/hero-4.mp4', title: 'The Work'       },
  { src: '/video/hero-5.mp4', title: 'The Gym'        },
];

export default function VideosPage() {
  return <VideoTheater clips={CLIPS} />;
}
