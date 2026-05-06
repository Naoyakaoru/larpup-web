import { describe, it, expect } from "vitest";
import {
  calcNeeded,
  calcRemainingAfterOnline,
  canAddOffline,
  formatNeeded,
} from "../utils/slotCalc";

const script = { male_slots: 2, female_slots: 2, any_slots: 1 }; // total 5

describe("calcNeeded – no host, no offline", () => {
  it("returns full script slots when nothing is filled", () => {
    const result = calcNeeded(script, {
      host_in_game: false,
      host_cross_gender: false,
      offline_male: 0,
      offline_female: 0,
      hostGender: "male",
    });
    expect(result).toEqual({ male: 2, female: 2, any: 1 });
  });
});

describe("calcNeeded – host in game", () => {
  it("deducts host male slot when host is male, no cross_gender", () => {
    const result = calcNeeded(script, {
      host_in_game: true,
      host_cross_gender: false,
      offline_male: 0,
      offline_female: 0,
      hostGender: "male",
    });
    expect(result).toEqual({ male: 1, female: 2, any: 1 });
  });

  it("deducts host female slot when host is male + cross_gender", () => {
    const result = calcNeeded(script, {
      host_in_game: true,
      host_cross_gender: true,
      offline_male: 0,
      offline_female: 0,
      hostGender: "male",
    });
    expect(result).toEqual({ male: 2, female: 1, any: 1 });
  });

  it("deducts host male slot when host is female + cross_gender", () => {
    const result = calcNeeded(script, {
      host_in_game: true,
      host_cross_gender: true,
      offline_male: 0,
      offline_female: 0,
      hostGender: "female",
    });
    expect(result).toEqual({ male: 1, female: 2, any: 1 });
  });
});

describe("calcNeeded – offline members within own gender slots", () => {
  it("deducts offline_male from male slots", () => {
    const result = calcNeeded(script, {
      host_in_game: false,
      host_cross_gender: false,
      offline_male: 2,
      offline_female: 0,
      hostGender: "male",
    });
    expect(result).toEqual({ male: 0, female: 2, any: 1 });
  });

  it("deducts offline_female from female slots", () => {
    const result = calcNeeded(script, {
      host_in_game: false,
      host_cross_gender: false,
      offline_male: 0,
      offline_female: 2,
      hostGender: "male",
    });
    expect(result).toEqual({ male: 2, female: 0, any: 1 });
  });
});

describe("calcNeeded – overflow into any_slots then opposite gender", () => {
  it("offline_male exceeds male_slots → spills into any_slots", () => {
    // male_slots: 2, any_slots: 1 → offline_male: 3 fills all male + 1 any
    const result = calcNeeded(script, {
      host_in_game: false,
      host_cross_gender: false,
      offline_male: 3,
      offline_female: 0,
      hostGender: "male",
    });
    expect(result).toEqual({ male: 0, female: 2, any: 0 });
  });

  it("offline_male exceeds male_slots + any_slots → spills into female slots", () => {
    // male_slots: 2, any_slots: 1 → offline_male: 4 → fills all male, all any, then 1 female
    const result = calcNeeded(script, {
      host_in_game: false,
      host_cross_gender: false,
      offline_male: 4,
      offline_female: 0,
      hostGender: "male",
    });
    expect(result).toEqual({ male: 0, female: 1, any: 0 });
  });

  it("offline_female exceeds female_slots → spills into any_slots then male", () => {
    const result = calcNeeded(script, {
      host_in_game: false,
      host_cross_gender: false,
      offline_male: 0,
      offline_female: 4,
      hostGender: "male",
    });
    expect(result).toEqual({ male: 1, female: 0, any: 0 });
  });
});

describe("calcNeeded – combined host + offline overflow", () => {
  it("male host cross_gender + offline_female fills all female + any → needs male", () => {
    // host takes female slot (cross_gender) → female: 1, any: 1
    // offline_female: 2 → fills female (1), then any (1)
    // remaining: male: 2, female: 0, any: 0
    const result = calcNeeded(script, {
      host_in_game: true,
      host_cross_gender: true,
      offline_male: 0,
      offline_female: 2,
      hostGender: "male",
    });
    expect(result).toEqual({ male: 2, female: 0, any: 0 });
  });
});

// script: 3男 3女 (total 6)
const script6 = { male_slots: 3, female_slots: 3, any_slots: 0 };

describe("calcRemainingAfterOnline", () => {
  it("deducts online confirmed members by their effective gender", () => {
    const members = [
      { cross_gender: false, user: { gender: "male" as const } },
      { cross_gender: false, user: { gender: "female" as const } },
      { cross_gender: false, user: { gender: "female" as const } },
    ];
    expect(calcRemainingAfterOnline(script6, members)).toEqual({
      male: 2,
      female: 1,
      any: 0,
    });
  });

  it("handles cross_gender confirmed member deducting opposite slot", () => {
    // male member playing female role → deducts female slot
    const members = [
      { cross_gender: true, user: { gender: "male" as const } },
    ];
    expect(calcRemainingAfterOnline(script6, members)).toEqual({
      male: 3,
      female: 2,
      any: 0,
    });
  });
});

describe("canAddOffline – without allowCrossGender", () => {
  // script6: 3男 3女, after 1男 3女 online → remaining: male:2, female:0, any:0
  const remaining = { male: 2, female: 0, any: 0 };

  it("can add offline male when male slots remain", () => {
    expect(canAddOffline(remaining, 0, 0, "male", false)).toBe(true);
  });

  it("cannot add offline female when female slots are exhausted", () => {
    expect(canAddOffline(remaining, 0, 0, "female", false)).toBe(false);
  });

  it("cannot add offline male when already filled", () => {
    // remaining: male 2, already placed 2 offline_male → no room
    expect(canAddOffline(remaining, 2, 0, "male", false)).toBe(false);
  });

  it("uses any_slots for overflow before blocking", () => {
    const withAny = { male: 0, female: 0, any: 1 };
    expect(canAddOffline(withAny, 0, 0, "male", false)).toBe(true);
    expect(canAddOffline(withAny, 0, 0, "female", false)).toBe(true);
  });

  it("any_slots shared – second gender blocked when any exhausted by first", () => {
    const withAny = { male: 0, female: 0, any: 1 };
    // one offline_male used the any slot; no room for offline_female
    expect(canAddOffline(withAny, 1, 0, "female", false)).toBe(false);
  });
});

describe("canAddOffline – with allowCrossGender", () => {
  // script6: after 1男 3女 → remaining: male:2, female:0
  const remaining = { male: 2, female: 0, any: 0 };

  it("can add offline female into male slots when cross_gender allowed", () => {
    expect(canAddOffline(remaining, 0, 0, "female", true)).toBe(true);
  });

  it("cannot add when all slots exhausted even with cross_gender", () => {
    expect(canAddOffline(remaining, 2, 0, "female", true)).toBe(false);
  });
});

describe("formatNeeded", () => {
  it("formats partial remaining", () => {
    expect(formatNeeded({ male: 1, female: 2, any: 0 })).toBe("1男 2女");
  });

  it("shows 不限 when any_slots remain", () => {
    expect(formatNeeded({ male: 0, female: 0, any: 1 })).toBe("1不限");
  });

  it('shows "已滿" when all zero', () => {
    expect(formatNeeded({ male: 0, female: 0, any: 0 })).toBe("已滿");
  });
});
