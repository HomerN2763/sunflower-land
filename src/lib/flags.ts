import { getKeys } from "features/game/types/craftables";
import { GameState } from "features/game/types/game";
import { SEASONS } from "features/game/types/seasons";
import { CONFIG } from "lib/config";

const defaultFeatureFlag = ({ inventory }: GameState) =>
  CONFIG.NETWORK === "mumbai" || !!inventory["Beta Pass"]?.gt(0);

const testnetFeatureFlag = () => CONFIG.NETWORK === "mumbai";
/*
 * How to Use:
 * Add the feature name to this list when working on a new feature.
 * When the feature is ready for public release, delete the feature from this list.
 *
 * Do not delete JEST_TEST.
 */
type FeatureName =
  | "JEST_TEST"
  | "PUMPKIN_PLAZA"
  | "NEW_DELIVERIES"
  | "CORN_MAZE"
  | "NEW_FARM_FLOW"
  | "BUDS_DEPOSIT_FLOW"
  | "FISHING"
  | "BEACH"
  | "HALLOWEEN"
  | "XSOLLA"
  | "BANANA";

type FeatureFlag = (game: GameState) => boolean;

const featureFlags: Record<FeatureName, FeatureFlag> = {
  JEST_TEST: defaultFeatureFlag,
  PUMPKIN_PLAZA: defaultFeatureFlag,
  NEW_DELIVERIES: testnetFeatureFlag,
  CORN_MAZE: testnetFeatureFlag,
  NEW_FARM_FLOW: () => true,
  BUDS_DEPOSIT_FLOW: () => true,
  FISHING: defaultFeatureFlag,
  XSOLLA: testnetFeatureFlag,
  HALLOWEEN: (game: GameState) => {
    if (Date.now() > new Date("2023-11-01").getTime()) {
      return false;
    }

    if (Date.now() > new Date("2023-10-26").getTime()) {
      return true;
    }

    return defaultFeatureFlag(game);
  },
  BEACH: (game: GameState) => {
    const hasBeachBud = getKeys(game.buds ?? {}).some(
      (id) => game.buds?.[id]?.type === "Beach"
    );

    if (hasBeachBud) {
      return true;
    }

    if (Date.now() > SEASONS["Catch the Kraken"].startDate.getTime()) {
      return true;
    }

    return defaultFeatureFlag(game);
  },
  BANANA: defaultFeatureFlag,
};

export const hasFeatureAccess = (game: GameState, featureName: FeatureName) => {
  const isWitchesEve = Date.now() > SEASONS["Witches' Eve"].startDate.getTime();
  if (featureName === "NEW_DELIVERIES" && isWitchesEve) {
    return true;
  }

  if (featureName === "PUMPKIN_PLAZA" && isWitchesEve) {
    return true;
  }

  if (featureName === "CORN_MAZE" && isWitchesEve) {
    return true;
  }
  return featureFlags[featureName](game);
};
