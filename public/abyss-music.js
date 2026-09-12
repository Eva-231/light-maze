export const ABYSS_MUSIC_KEYS=['abyssRitual','abyssChip','abyssPiano','abyssBreaks','abyssJazz','abyssCosmic'];
// Stable per expedition + floor: pause/resume never rerolls, adjacent floors never repeat.
export function abyssMusicKey(seed,floor){let previous=-1;for(let n=1;n<=Math.max(1,Math.min(99,Math.floor(floor)||1));n++){let h=(seed^Math.imul(n,0x9e3779b9))>>>0;h=Math.imul(h^(h>>>16),0x85ebca6b);h=Math.imul(h^(h>>>13),0xc2b2ae35);h=(h^(h>>>16))>>>0;const count=previous<0?6:5;let choice=h%count;if(previous>=0&&choice>=previous)choice++;previous=choice;}return ABYSS_MUSIC_KEYS[previous];}
