export const navItems = [
  { label: 'Landing Page', hash: '#/landing' },
  { label: 'Teams', hash: '#/teams' },
  { label: 'Points Table', hash: '#/points' },
  { label: 'Videos', hash: '#/videos' },
  { label: 'Live Video', hash: '#/live' },
]

export const sliderImages = [
  {
    title: 'Night Match Action',
    image: 'https://images.unsplash.com/photo-1521412644187-c49fa049e84d?auto=format&fit=crop&w=1600&q=80',
  },
  {
    title: 'Stadium Pressure',
    image: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=1600&q=80',
  },
  {
    title: 'Big Shot Moment',
    image: 'https://images.unsplash.com/photo-1624526267942-ab0ff8a3e972?auto=format&fit=crop&w=1600&q=80',
  },
  {
    title: 'Team Huddle',
    image: 'https://images.unsplash.com/photo-1593341646782-e0b495cff86d?auto=format&fit=crop&w=1600&q=80',
  },
]

export const teams = [
  { name: 'Chennai Super Kings', code: 'CSK', logo: 'https://documents.iplt20.com/ipl/CSK/Logos/Roundbig/CSKroundbig.png' },
  { name: 'Delhi Capitals', code: 'DC', logo: 'https://documents.iplt20.com/ipl/DC/Logos/Roundbig/DCroundbig.png' },
  { name: 'Gujarat Titans', code: 'GT', logo: 'https://documents.iplt20.com/ipl/GT/Logos/Roundbig/GTroundbig.png' },
  { name: 'Kolkata Knight Riders', code: 'KKR', logo: 'https://documents.iplt20.com/ipl/KKR/Logos/Roundbig/KKRroundbig.png' },
  { name: 'Lucknow Super Giants', code: 'LSG', logo: 'https://documents.iplt20.com/ipl/LSG/Logos/Roundbig/LSGroundbig.png' },
  { name: 'Mumbai Indians', code: 'MI', logo: 'https://documents.iplt20.com/ipl/MI/Logos/Roundbig/MIroundbig.png' },
  { name: 'Punjab Kings', code: 'PBKS', logo: 'https://documents.iplt20.com/ipl/PBKS/Logos/Roundbig/PBKSroundbig.png' },
  { name: 'Rajasthan Royals', code: 'RR', logo: 'https://documents.iplt20.com/ipl/RR/Logos/Roundbig/RRroundbig.png' },
  { name: 'Royal Challengers Bengaluru', code: 'RCB', logo: 'https://documents.iplt20.com/ipl/RCB/Logos/Roundbig/RCBroundbig.png' },
  { name: 'Sunrisers Hyderabad', code: 'SRH', logo: 'https://documents.iplt20.com/ipl/SRH/Logos/Roundbig/SRHroundbig.png' },
]

export const sponsors = [
  { tier: 'Title Sponsor', brand: 'TATA' },
  { tier: 'Official Broadcaster', brand: 'Star Sports' },
  { tier: 'Digital Streaming Partner', brand: 'JioHotstar' },
  { tier: 'Strategic Timeout Partner', brand: 'CEAT' },
  { tier: 'Umpire Partner', brand: 'Wonder Cement' },
]

export const videos = [
  {
    title: 'Best Catches of IPL',
    meta: 'Highlights',
    thumb: 'https://images.unsplash.com/photo-1624526267942-ab0ff8a3e972?auto=format&fit=crop&w=900&q=80',
    link: 'https://www.iplt20.com/videos/highlights',
  },
  {
    title: 'Power-Hitting Masterclass',
    meta: 'Tactical Breakdown',
    thumb: 'https://images.unsplash.com/photo-1560012057-4372e14c5085?auto=format&fit=crop&w=900&q=80',
    link: 'https://www.iplt20.com/videos',
  },
  {
    title: 'Road to Playoffs',
    meta: 'IPL Exclusive',
    thumb: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=900&q=80',
    link: 'https://www.iplt20.com/videos/ipl-exclusive',
  },
]

export const pointsTable = [
  { team: 'MI', p: 7, w: 5, l: 2, nrr: 1.12, pts: 10 },
  { team: 'CSK', p: 7, w: 5, l: 2, nrr: 0.87, pts: 10 },
  { team: 'RCB', p: 7, w: 4, l: 3, nrr: 0.41, pts: 8 },
  { team: 'GT', p: 7, w: 4, l: 3, nrr: 0.21, pts: 8 },
  { team: 'RR', p: 7, w: 3, l: 4, nrr: -0.07, pts: 6 },
  { team: 'KKR', p: 7, w: 3, l: 4, nrr: -0.16, pts: 6 },
  { team: 'SRH', p: 7, w: 2, l: 5, nrr: -0.55, pts: 4 },
  { team: 'DC', p: 7, w: 2, l: 5, nrr: -0.76, pts: 4 },
]

export const matchSeed = [
  {
    id: 1,
    status: 'LIVE',
    series: 'IPL 2026 Match 18',
    teamA: 'MI',
    teamB: 'CSK',
    runs: 168,
    wickets: 4,
    balls: 102,
    venue: 'Wankhede, Mumbai',
    chase: 'Target 201',
  },
  {
    id: 2,
    status: 'LIVE',
    series: 'IPL 2026 Match 19',
    teamA: 'RCB',
    teamB: 'DC',
    runs: 98,
    wickets: 2,
    balls: 58,
    venue: 'Chinnaswamy, Bengaluru',
    chase: 'Batting 1st',
  },
  {
    id: 3,
    status: 'UPCOMING',
    series: 'IPL 2026 Match 20',
    teamA: 'GT',
    teamB: 'RR',
    runs: 0,
    wickets: 0,
    balls: 0,
    venue: 'Narendra Modi Stadium',
    chase: 'Starts 7:30 PM IST',
  },
]
