import { useSafetyStore } from "./useSafetyStore";

let hydrationPromise: Promise<void> | null = null;

export const ensureSafetyStoreHydrated = async () => {
  const persistApi = useSafetyStore.persist;
  if (persistApi.hasHydrated()) {
    return;
  }

  if (!hydrationPromise) {
    const rehydrateResult = persistApi.rehydrate();
    hydrationPromise = Promise.resolve(rehydrateResult).finally(() => {
      hydrationPromise = null;
    });
  }

  await hydrationPromise;
};
