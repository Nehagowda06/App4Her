export const createId = (prefix: string) =>
  `${prefix}_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
