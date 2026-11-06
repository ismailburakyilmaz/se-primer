// Deterministic shuffle for action cards based on oturumId and sahneId
// (spec §9 / User Request: sabit tohumla oyun başına karışık sıra, ?mock=1 iken karıştırılmaz)

function hashString(str: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffleActions<T>(
  actions: T[],
  oturumId: string,
  sahneId: string,
  isMock: boolean
): T[] {
  if (isMock || !oturumId || actions.length <= 1) {
    return actions;
  }

  const seed = hashString(`${oturumId}_${sahneId}`);
  const random = mulberry32(seed);

  const arr = [...actions];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }

  return arr;
}
