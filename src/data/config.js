/**
 * Core Configuration & Metadata
 * Easily modify relationship dates, names, or song details here.
 */
export const CONFIG = {
  partnerName: "Kruuuu",
  partnerFullName: "Krutika",
  userName: "Soham",
  
  // Relationship official start date: 14 August 2026
  startDate: "2026-08-14T00:00:00+05:30",
  
  // Audio playlist configuration: Ehsaas (acoustic) is PRIMARY/DEFAULT
  playlist: [
    {
      id: "ehsaas",
      title: "Ehsaas (acoustic)",
      artist: "Faheem Abdullah",
      src: "/assets/music/ehsaas-acoustic.mp3",
      cover: "/assets/images/album-ehsaas.jpg",
      duration: 83
    },
    {
      id: "meri-banogi-kya",
      title: "Meri Banogi Kya",
      artist: "Rito Riba, Rajat Nagpal",
      src: "/assets/music/meri-banogi-kya.mp3",
      cover: "/assets/images/album-meri-banogi.jpg",
      duration: 215
    }
  ],
  music: {
    title: "Ehsaas (acoustic)",
    artist: "Faheem Abdullah",
    src: "/assets/music/ehsaas-acoustic.mp3"
  },
  
  // High refresh-rate & performance settings
  targetFPS: 144,
  maxParticlesDesktop: 2200,
  maxParticlesMobile: 750
};
