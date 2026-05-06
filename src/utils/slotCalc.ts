export interface SlotScript {
  male_slots: number;
  female_slots: number;
  any_slots: number;
}

export interface SlotAllocation {
  male: number;
  female: number;
  any: number;
}

function deductSlot(
  slots: SlotAllocation,
  gender: "male" | "female",
  allowCrossGender = true,
) {
  if (gender === "male") {
    if (slots.male > 0) slots.male--;
    else if (slots.any > 0) slots.any--;
    else if (allowCrossGender && slots.female > 0) slots.female--;
  } else {
    if (slots.female > 0) slots.female--;
    else if (slots.any > 0) slots.any--;
    else if (allowCrossGender && slots.male > 0) slots.male--;
  }
}

export interface SlotCalcParams {
  host_in_game: boolean;
  host_cross_gender: boolean;
  offline_male: number;
  offline_female: number;
  hostGender: "male" | "female";
}

/**
 * Computes remaining open slots after accounting for host (with optional cross-gender)
 * and offline pre-confirmed members.
 *
 * Overflow rule: if a gender's own slots are exhausted, fill any_slots first,
 * then overflow into the opposite gender's slots.
 */
export function calcNeeded(
  script: SlotScript,
  params: SlotCalcParams,
): SlotAllocation {
  const slots: SlotAllocation = {
    male: script.male_slots,
    female: script.female_slots,
    any: script.any_slots,
  };

  if (params.host_in_game) {
    const effectiveGender: "male" | "female" = params.host_cross_gender
      ? params.hostGender === "male"
        ? "female"
        : "male"
      : params.hostGender;
    deductSlot(slots, effectiveGender);
  }

  for (let i = 0; i < params.offline_male; i++) deductSlot(slots, "male");
  for (let i = 0; i < params.offline_female; i++) deductSlot(slots, "female");

  return {
    male: Math.max(0, slots.male),
    female: Math.max(0, slots.female),
    any: Math.max(0, slots.any),
  };
}

/**
 * Computes remaining slots after deducting a list of online confirmed members.
 * Each member has an effective gender (accounting for their own cross_gender flag).
 */
export function calcRemainingAfterOnline(
  script: SlotScript,
  confirmedMembers: Array<{
    cross_gender: boolean;
    user: { gender: "male" | "female" };
  }>,
): SlotAllocation {
  const slots: SlotAllocation = {
    male: script.male_slots,
    female: script.female_slots,
    any: script.any_slots,
  };
  for (const m of confirmedMembers) {
    const effectiveGender: "male" | "female" = m.cross_gender
      ? m.user.gender === "male"
        ? "female"
        : "male"
      : m.user.gender;
    deductSlot(slots, effectiveGender);
  }
  return {
    male: Math.max(0, slots.male),
    female: Math.max(0, slots.female),
    any: Math.max(0, slots.any),
  };
}

/**
 * Returns true if one more offline person of `addingGender` can be accommodated
 * within `remaining` after already placing `offlineMale` + `offlineFemale`.
 *
 * Without allowCrossGender: offline males fill male→any only; females fill female→any only.
 * With allowCrossGender: overflow into opposite gender slots is allowed.
 */
export function canAddOffline(
  remaining: SlotAllocation,
  offlineMale: number,
  offlineFemale: number,
  addingGender: "male" | "female",
  allowCrossGender: boolean,
): boolean {
  const slots = { ...remaining };

  function tryDeduct(gender: "male" | "female"): boolean {
    if (gender === "male") {
      if (slots.male > 0) {
        slots.male--;
        return true;
      }
      if (slots.any > 0) {
        slots.any--;
        return true;
      }
      if (allowCrossGender && slots.female > 0) {
        slots.female--;
        return true;
      }
      return false;
    } else {
      if (slots.female > 0) {
        slots.female--;
        return true;
      }
      if (slots.any > 0) {
        slots.any--;
        return true;
      }
      if (allowCrossGender && slots.male > 0) {
        slots.male--;
        return true;
      }
      return false;
    }
  }

  for (let i = 0; i < offlineMale; i++) {
    if (!tryDeduct("male")) return false;
  }
  for (let i = 0; i < offlineFemale; i++) {
    if (!tryDeduct("female")) return false;
  }
  return tryDeduct(addingGender);
}

export function formatNeeded(slots: SlotAllocation): string {
  const parts = [
    slots.male > 0 ? `${slots.male}男` : "",
    slots.female > 0 ? `${slots.female}女` : "",
    slots.any > 0 ? `${slots.any}不限` : "",
  ].filter(Boolean);
  return parts.length ? parts.join(" ") : "已滿";
}
