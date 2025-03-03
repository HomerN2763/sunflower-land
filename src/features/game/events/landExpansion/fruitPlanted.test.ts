import "lib/__mocks__/configMock";

import Decimal from "decimal.js-light";
import { INITIAL_BUMPKIN, TEST_FARM } from "features/game/lib/constants";
import { FruitSeedName, FRUIT_SEEDS } from "features/game/types/fruits";
import { FruitPatch, GameState } from "features/game/types/game";
import { getFruitTime, plantFruit } from "./fruitPlanted";

const GAME_STATE: GameState = {
  ...TEST_FARM,
  bumpkin: INITIAL_BUMPKIN,
  fruitPatches: {
    0: {
      fruit: {
        name: "Apple",
        amount: 1,
        plantedAt: 123,
        harvestedAt: 0,
        harvestsLeft: 0,
      },
      x: -2,
      y: 0,
      height: 1,
      width: 1,
    },
    1: {
      x: -2,
      y: 0,
      height: 1,
      width: 1,
    },
  },
};
describe("fruitPlanted", () => {
  const dateNow = Date.now();

  it("throws an error if the player doesn't have a bumpkin", () => {
    expect(() =>
      plantFruit({
        state: {
          ...GAME_STATE,
          bumpkin: undefined,
        },
        createdAt: dateNow,
        action: {
          type: "fruit.planted",
          index: "0",
          seed: "Apple Seed",
        },
      })
    ).toThrow("You do not have a Bumpkin");
  });

  it("does not plant on non-existent fruit patch", () => {
    expect(() =>
      plantFruit({
        state: GAME_STATE,
        createdAt: dateNow,
        action: {
          type: "fruit.planted",
          index: "2",
          seed: "Apple Seed",
        },
      })
    ).toThrow("Fruit patch does not exist");
  });

  it("does not plant on non-integer plot", () => {
    expect(() =>
      plantFruit({
        state: GAME_STATE,
        createdAt: dateNow,
        action: {
          type: "fruit.planted",
          index: "1.2",
          seed: "Apple Seed",
        },
      })
    ).toThrow("Fruit patch does not exist");
  });

  it("does not plant on non-existent (negative input) plot", () => {
    expect(() =>
      plantFruit({
        state: GAME_STATE,
        createdAt: dateNow,
        action: {
          type: "fruit.planted",
          index: "-1",
          seed: "Apple Seed",
        },
      })
    ).toThrow("Fruit patch does not exist");
  });

  it("does not plant if patch is already planted", () => {
    expect(() =>
      plantFruit({
        state: {
          ...GAME_STATE,
        },
        createdAt: dateNow,
        action: {
          type: "fruit.planted",
          index: "0",
          seed: "Apple Seed",
        },
      })
    ).toThrow("Fruit is already planted");
  });

  it("does not plant an invalid seed", () => {
    expect(() =>
      plantFruit({
        state: { ...GAME_STATE, bumpkin: INITIAL_BUMPKIN },
        createdAt: dateNow,
        action: {
          type: "fruit.planted",
          index: "1",
          seed: "Sunflower Seed" as FruitSeedName,
        },
      })
    ).toThrow("Not a fruit seed");
  });

  it("does not plant if user does not have seeds", () => {
    expect(() =>
      plantFruit({
        state: { ...GAME_STATE, bumpkin: INITIAL_BUMPKIN },
        createdAt: dateNow,
        action: {
          type: "fruit.planted",
          index: "1",
          seed: "Apple Seed",
        },
      })
    ).toThrow("Not enough seeds");
  });

  it("plants a seed", () => {
    const seedAmount = new Decimal(5);

    const patchIndex = "1";

    const state = plantFruit({
      state: {
        ...GAME_STATE,
        bumpkin: INITIAL_BUMPKIN,
        inventory: {
          "Apple Seed": seedAmount,
        },
      },
      createdAt: dateNow,
      action: {
        type: "fruit.planted",
        index: patchIndex,
        seed: "Apple Seed",
      },
    });

    const fruitPatches = state.fruitPatches;

    expect(state.inventory["Apple Seed"]).toEqual(seedAmount.minus(1));
    expect(fruitPatches).toBeDefined();
    expect((fruitPatches as Record<number, FruitPatch>)[patchIndex]).toEqual(
      expect.objectContaining({
        fruit: expect.objectContaining({
          name: "Apple",
          plantedAt: expect.any(Number),
          amount: 1,
        }),
      })
    );
  });

  it("contains harvestedAt information", () => {
    const seedAmount = new Decimal(5);

    const patchIndex = "1";

    const state = plantFruit({
      state: {
        ...GAME_STATE,
        bumpkin: INITIAL_BUMPKIN,
        inventory: {
          "Apple Seed": seedAmount,
        },
      },
      createdAt: dateNow,
      action: {
        type: "fruit.planted",
        index: patchIndex,
        seed: "Apple Seed",
      },
    });

    const fruitPatches = state.fruitPatches;

    expect((fruitPatches as Record<number, FruitPatch>)[patchIndex]).toEqual(
      expect.objectContaining({
        fruit: expect.objectContaining({
          name: "Apple",
          plantedAt: expect.any(Number),
          amount: 1,
          harvestedAt: 0,
        }),
      })
    );
  });

  it("contains harvestsLeft information", () => {
    const seedAmount = new Decimal(5);

    const patchIndex = "1";

    const state = plantFruit({
      state: {
        ...GAME_STATE,
        bumpkin: INITIAL_BUMPKIN,
        inventory: {
          "Apple Seed": seedAmount,
        },
      },
      createdAt: dateNow,
      action: {
        type: "fruit.planted",
        index: patchIndex,
        seed: "Apple Seed",
      },
      harvestsLeft: () => 3,
    });

    const fruitPatches = state.fruitPatches;

    expect((fruitPatches as Record<number, FruitPatch>)[patchIndex]).toEqual(
      expect.objectContaining({
        fruit: expect.objectContaining({
          name: "Apple",
          plantedAt: expect.any(Number),
          amount: 1,
          harvestedAt: 0,
          harvestsLeft: 3,
        }),
      })
    );
  });

  it("includes immortal pear bonus", () => {
    const seedAmount = new Decimal(5);

    const patchIndex = "1";

    const state = plantFruit({
      state: {
        ...GAME_STATE,
        bumpkin: INITIAL_BUMPKIN,
        inventory: {
          "Apple Seed": seedAmount,
          "Immortal Pear": new Decimal(1),
        },
        collectibles: {
          "Immortal Pear": [
            {
              coordinates: { x: 0, y: 0 },
              createdAt: 0,
              id: "123",
              readyAt: 0,
            },
          ],
        },
      },
      createdAt: dateNow,
      action: {
        type: "fruit.planted",
        index: patchIndex,
        seed: "Apple Seed",
      },
      harvestsLeft: () => 3,
    });

    const fruitPatches = state.fruitPatches;

    expect((fruitPatches as Record<number, FruitPatch>)[patchIndex]).toEqual(
      expect.objectContaining({
        fruit: expect.objectContaining({
          name: "Apple",
          plantedAt: expect.any(Number),
          amount: 1,
          harvestedAt: 0,
          harvestsLeft: 4,
        }),
      })
    );
  });

  it("includes lady bug bonus on apples", () => {
    const seedAmount = new Decimal(5);

    const patchIndex = "1";

    const state = plantFruit({
      state: {
        ...GAME_STATE,
        bumpkin: INITIAL_BUMPKIN,
        inventory: {
          "Apple Seed": seedAmount,
          "Lady Bug": new Decimal(1),
        },
        collectibles: {
          "Lady Bug": [
            {
              coordinates: { x: 0, y: 0 },
              createdAt: 0,
              id: "123",
              readyAt: 0,
            },
          ],
        },
      },
      createdAt: dateNow,
      action: {
        type: "fruit.planted",
        index: patchIndex,
        seed: "Apple Seed",
      },
    });

    const fruitPatches = state.fruitPatches;

    expect(
      (fruitPatches as Record<number, FruitPatch>)[patchIndex].fruit?.amount
    ).toEqual(1.25);
  });

  it("does not include lady bug bonus on blueberries", () => {
    const seedAmount = new Decimal(5);

    const patchIndex = "1";

    const state = plantFruit({
      state: {
        ...GAME_STATE,
        bumpkin: INITIAL_BUMPKIN,
        inventory: {
          "Blueberry Seed": seedAmount,
          "Lady Bug": new Decimal(1),
        },
        collectibles: {
          "Lady Bug": [
            {
              coordinates: { x: 0, y: 0 },
              createdAt: 0,
              id: "123",
              readyAt: 0,
            },
          ],
        },
      },
      createdAt: dateNow,
      action: {
        type: "fruit.planted",
        index: patchIndex,
        seed: "Blueberry Seed",
      },
    });

    const fruitPatches = state.fruitPatches;

    expect(
      (fruitPatches as Record<number, FruitPatch>)[patchIndex].fruit?.amount
    ).toEqual(1);
  });

  it("includes Squirrel Monkey bonus on Oranges", () => {
    const seedAmount = new Decimal(5);

    const patchIndex = "1";

    const state = plantFruit({
      state: {
        ...GAME_STATE,
        bumpkin: INITIAL_BUMPKIN,
        inventory: {
          "Orange Seed": seedAmount,
          "Squirrel Monkey": new Decimal(1),
        },
        collectibles: {
          "Squirrel Monkey": [
            {
              coordinates: { x: 0, y: 0 },
              createdAt: 0,
              id: "123",
              readyAt: 0,
            },
          ],
        },
      },
      createdAt: dateNow,
      action: {
        type: "fruit.planted",
        index: patchIndex,
        seed: "Orange Seed",
      },
    });

    const fruitPatches = state.fruitPatches;

    expect(
      (fruitPatches as Record<number, FruitPatch>)[patchIndex].fruit?.amount
    ).toEqual(1);
    expect(
      (fruitPatches as Record<number, FruitPatch>)[patchIndex].fruit?.plantedAt
    ).toEqual(dateNow - (FRUIT_SEEDS()["Orange Seed"].plantSeconds * 1000) / 2);
  });

  it("includes Black Bearry bonus on Blueberries", () => {
    const seedAmount = new Decimal(5);

    const patchIndex = "1";

    const state = plantFruit({
      state: {
        ...GAME_STATE,
        bumpkin: INITIAL_BUMPKIN,
        inventory: {
          "Blueberry Seed": seedAmount,
          "Black Bearry": new Decimal(1),
        },
        collectibles: {
          "Black Bearry": [
            {
              coordinates: { x: 0, y: 0 },
              createdAt: 0,
              id: "123",
              readyAt: 0,
            },
          ],
        },
      },
      createdAt: dateNow,
      action: {
        type: "fruit.planted",
        index: patchIndex,
        seed: "Blueberry Seed",
      },
    });

    const fruitPatches = state.fruitPatches;

    expect(
      (fruitPatches as Record<number, FruitPatch>)[patchIndex].fruit?.amount
    ).toEqual(2);
  });

  it("does not accept harvests exceeding limits", () => {
    expect(() =>
      plantFruit({
        state: {
          ...GAME_STATE,
          bumpkin: INITIAL_BUMPKIN,
          inventory: {
            "Apple Seed": new Decimal(3),
          },
        },
        createdAt: dateNow,
        harvestsLeft: () => 10,
        action: {
          type: "fruit.planted",
          index: "1",
          seed: "Apple Seed",
        },
      })
    ).toThrow("Invalid harvests left amount");
  });

  it("increments the fruit seed planted activity", () => {
    const amount = 1;
    const state = plantFruit({
      state: {
        ...GAME_STATE,
        bumpkin: INITIAL_BUMPKIN,
        inventory: {
          "Apple Seed": new Decimal(1),
        },
      },
      createdAt: dateNow,
      action: {
        type: "fruit.planted",
        index: "1",
        seed: "Apple Seed",
      },
    });
    expect(state.bumpkin?.activity?.["Apple Seed Planted"]).toEqual(amount);
  });

  it("applies a bud boost", () => {
    const seedAmount = new Decimal(5);

    const patchIndex = "1";

    const state = plantFruit({
      state: {
        ...GAME_STATE,
        bumpkin: INITIAL_BUMPKIN,
        inventory: {
          "Blueberry Seed": seedAmount,
          "Black Bearry": new Decimal(1),
        },
        buds: {
          1: {
            aura: "No Aura",
            stem: "Hibiscus",
            colour: "Brown",
            ears: "No Ears",
            type: "Beach",
            coordinates: { x: 0, y: 0 },
          },
        },
      },
      createdAt: dateNow,
      action: {
        type: "fruit.planted",
        index: patchIndex,

        seed: "Blueberry Seed",
      },
      harvestsLeft: () => 3,
    });

    const fruitPatches = state.fruitPatches;

    expect(
      (fruitPatches as Record<number, FruitPatch>)[patchIndex].fruit?.amount
    ).toEqual(1.2);
  });

  it("applies Chilling Banana bonus on Bananas", () => {
    const seedAmount = new Decimal(5);

    const patchIndex = "1";

    const state = plantFruit({
      state: {
        ...GAME_STATE,
        bumpkin: INITIAL_BUMPKIN,
        inventory: {
          "Banana Plant": seedAmount,
        },
        collectibles: {
          "Chilling Banana": [
            {
              coordinates: { x: 0, y: 0 },
              createdAt: 0,
              id: "123",
              readyAt: 0,
            },
          ],
        },
      },
      createdAt: dateNow,
      action: {
        type: "fruit.planted",
        index: patchIndex,
        seed: "Banana Plant",
      },
    });

    const fruitPatches = state.fruitPatches;

    expect(
      (fruitPatches as Record<number, FruitPatch>)[patchIndex].fruit?.amount
    ).toEqual(1.5);
  });
});

describe("getFruitTime", () => {
  it("applies a 50% speed boost with Squirrel Monkey placed for orange seeds", () => {
    const seed = "Orange Seed";
    const orangePlantSeconds = FRUIT_SEEDS()[seed].plantSeconds;
    const time = getFruitTime(seed, {
      "Squirrel Monkey": [
        {
          coordinates: { x: 0, y: 0 },
          createdAt: 0,
          id: "123",
          readyAt: 0,
        },
      ],
    });
    expect(time).toEqual(orangePlantSeconds * 0.5);
  });
  it("does not apply a 50% speed boost with Squirrel Monkey placed for other seeds", () => {
    const seed = "Apple Seed";
    const applePlantSeconds = FRUIT_SEEDS()[seed].plantSeconds;
    const time = getFruitTime(seed, {
      "Squirrel Monkey": [
        {
          coordinates: { x: 0, y: 0 },
          createdAt: 0,
          id: "123",
          readyAt: 0,
        },
      ],
    });
    expect(time).toEqual(applePlantSeconds);
  });
});
