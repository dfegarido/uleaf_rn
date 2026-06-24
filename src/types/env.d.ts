declare module '@env' {
  export const LOCAL_BASE_URL: string;
  export const PLANT_SHARE_BASE_URL: string | undefined;
  /** Set to false for legacy Leaf Trail UI (see featureFlags.js) */
  export const ENABLE_TRAIL1_FOR_RECEIVING: string | undefined;
}

