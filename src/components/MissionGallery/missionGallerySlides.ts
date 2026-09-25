export interface MissionSlide {
  id: string
  image: string
  caption: string
  subLabel: string
}

export const MISSION_GALLERY_SLIDES: MissionSlide[] = [
  {
    id: 'air-superiority',
    image: '/assets/mission-gallery/01-air-superiority.jpg',
    caption: 'AIR SUPERIORITY',
    subLabel: 'Twin interceptors, afterburner engaged',
  },
  {
    id: 'command-control',
    image: '/assets/mission-gallery/02-command-control.jpg',
    caption: 'COMMAND & CONTROL',
    subLabel: 'Real-time theater awareness',
  },
  {
    id: 'naval-strike-group',
    image: '/assets/mission-gallery/03-naval-strike-group.jpg',
    caption: 'NAVAL DOMINANCE',
    subLabel: 'Carrier strike group, full escort',
  },
  {
    id: 'ground-offensive',
    image: '/assets/mission-gallery/04-ground-offensive.jpg',
    caption: 'JOINT GROUND OPS',
    subLabel: 'Infantry, armor, and air in coordination',
  },
]
