
export const DEFAULT_AVATARS = [
  "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&h=400&fit=crop", // User 1
  "https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=400&h=400&fit=crop", // User 2
  "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=400&h=400&fit=crop", // User 3
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop", // User 4
  "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=400&fit=crop", // User 5
  // Cute Animals
  "https://images.unsplash.com/photo-1517849845537-4d257902454a?w=400&h=400&fit=crop", // Dog
  "https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=400&h=400&fit=crop", // Cat
  "https://images.unsplash.com/photo-1552053831-71594a27632d?w=400&h=400&fit=crop", // Dog 2
  "https://images.unsplash.com/photo-1533738363-b7f9aef128ce?w=400&h=400&fit=crop", // Cat 2
  "https://images.unsplash.com/photo-1585077422116-24ba22c0926d?w=400&h=400&fit=crop", // Panda (maybe?)
  // Travel Themed
  "https://images.unsplash.com/photo-1503435980611-27c2faf1e309?w=400&h=400&fit=crop", // Hat guy
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop", // Smiling woman
];

export const getRandomAvatar = (seed: string) => {
  if (!seed) return DEFAULT_AVATARS[0];
  
  // Simple hash function to get consistent index from string
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const index = Math.abs(hash) % DEFAULT_AVATARS.length;
  return DEFAULT_AVATARS[index];
};
