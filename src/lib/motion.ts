export const easings = {
  easeOut: [0.16, 1, 0.3, 1] as const,
  easeInOut: [0.4, 0, 0.2, 1] as const,
} as const;

export const durations = {
  fast: 0.15,
  normal: 0.25,
  slow: 0.4,
} as const;
