-- ============================================================================
-- KruuuuLove — Supabase Schema & Security Setup
-- Run this script in the Supabase SQL Editor (Dashboard > SQL Editor > New Query)
-- ============================================================================

-- 1. Create memories table
CREATE TABLE IF NOT EXISTS public.memories (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  caption TEXT NOT NULL,
  details TEXT,
  image TEXT NOT NULL,
  date TEXT,
  location TEXT,
  category TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.memories ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies: Public read, Authenticated admin write/update/delete
-- Visitors can view all memories
CREATE POLICY "Public visitors can view memories"
  ON public.memories
  FOR SELECT
  USING (true);

-- Authenticated admins can insert new memories
CREATE POLICY "Admins can insert memories"
  ON public.memories
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Authenticated admins can update existing memories
CREATE POLICY "Admins can update memories"
  ON public.memories
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Authenticated admins can delete memories
CREATE POLICY "Admins can delete memories"
  ON public.memories
  FOR DELETE
  TO authenticated
  USING (true);

-- 4. Storage Bucket Setup for Memory Photos
-- Create a public bucket named 'memories' if it doesn't already exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('memories', 'memories', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS Policies: Public read, Authenticated write/delete
CREATE POLICY "Public read memory images"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'memories');

CREATE POLICY "Admins can upload memory images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'memories');

CREATE POLICY "Admins can update memory images"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'memories');

CREATE POLICY "Admins can delete memory images"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'memories');

-- 5. Seed Initial Memories (The 7 core memories)
INSERT INTO public.memories (id, title, caption, details, image, date, location, category, order_index)
VALUES
  (
    'mem-01',
    'Streets of Europe',
    'The awkward beginning that turned into my favorite human(didn''t had our image though :))',
    'First meeting. Two stubborn personalities, an uncomfortable silence, and a future neither of us saw coming.',
    '/assets/images/mem-01.jpg',
    'July 2026',
    'Pune, Maharashtra',
    'The Origin',
    0
  ),
  (
    'mem-02',
    'ISKCON Temple Afternoon',
    'Where I looked at you and asked Krishna for direction :), first time asked you infront of someone.',
    'Peaceful courtyards, soft conversation, and the moment my respect for your gentle soul took root.',
    '/assets/images/memory-02.jpg',
    'July 2026',
    'ISKCON NVCC, Pune',
    'Turning Point',
    1
  ),
  (
    'mem-03',
    'Our Nightouts',
    'Staying awake whole night and chilling on the road, it felt like home and still i miss those nights so much :(',
    'We used to just sit and talk for hours, chilling on the road, and I used to feel so calm and happy in your company.',
    '/assets/images/memory-03.jpg',
    'August 2026',
    'Pune Streets',
    'Playful Memory',
    2
  ),
  (
    'mem-sinhagad',
    'Sinhagad Fort Walk',
    'Walking together, taking care of you, and taking random photos.',
    'One of my favorite days in Pune. Walking up the fort together and wishing we had met earlier :)',
    '/assets/images/memory-sinhagad.jpg',
    'August 2026',
    'Sinhagad, Pune',
    'Favorite Day',
    3
  ),
  (
    'mem-04',
    '14 August Confession',
    'The day I stopped hiding my feelings and finally told you.',
    'Second last day of the internship. The racing heartbeat right before I told you how much you mean to me.',
    '/assets/images/memory-04.jpg',
    '14 August 2026',
    'Pune, Maharashtra',
    'The Confession',
    4
  ),
  (
    'mem-05',
    'The Last Night in Pune',
    'Our first kiss, quiet city roads, and a night that will stay with me forever.',
    'Roaming under the midnight sky. Our first kiss, gentle and sacred.',
    '/assets/images/first-night.jpg',
    '15 August 2026',
    'Streets of Pune',
    'Favorite Memory',
    5
  ),
  (
    'mem-visit',
    'Kinda surprise visit',
    'The time I came to meet you just because I was missing you soooo much and wanted to meet you soo badly.',
    'The time I came to meet you just because I was missing you soooo much and wanted to meet you soo badly. I wanted to surprise you, we went to the Ganpati temple and that cafe, spent time together, and took photos.',
    '/assets/images/visit.jpeg',
    '',
    '',
    'Surprise Visit',
    6
  )
ON CONFLICT (id) DO NOTHING;
