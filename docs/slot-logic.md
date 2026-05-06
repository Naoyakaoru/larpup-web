# Slot Calculation Logic (Frontend)

後端完整說明見 `larpup-api/docs/slot-logic.md`。本文件記錄前端實作細節。

---

## 核心 Utility：`src/utils/slotCalc.ts`

### Types

```ts
interface SlotScript {
  male_slots: number;
  female_slots: number;
  any_slots: number;
}
interface SlotAllocation {
  male: number;
  female: number;
  any: number;
}
```

### `calcNeeded(script, params) → SlotAllocation`

**用途：建立活動表單** — 計算扣除主揪 + 線下朋友後還需要哪些性別的人。

| 參數                | 說明                                     |
| ------------------- | ---------------------------------------- |
| `host_in_game`      | 主揪是否上車                             |
| `host_cross_gender` | 主揪是否反串                             |
| `offline_male`      | 線下確定的男性朋友數                     |
| `offline_female`    | 線下確定的女性朋友數                     |
| `hostGender`        | 主揪性別（來自 `useAuth().user.gender`） |

Overflow 規則：自己槽位 → `any_slots` → 對方槽位。

### `calcRemainingAfterOnline(script, confirmedMembers) → SlotAllocation`

**用途：編輯活動表單** — 計算扣除線上已確認成員後的剩餘槽位。

`confirmedMembers` 為 `event.members.filter(m => m.status === 'confirmed')`，
每個成員依 `cross_gender` flag 決定填入哪個槽位（包含主揪本人）。

### `canAddOffline(remaining, offlineMale, offlineFemale, addingGender, allowCrossGender) → boolean`

**用途：線下人數 `+` 按鈕** — 模擬加入一人後是否仍有位，決定是否允許點擊。

- `allowCrossGender = false`：offline 男只填 `male → any`；offline 女只填 `female → any`
- `allowCrossGender = true`：三種槽位皆可，順序 own → any → opposite

### `formatNeeded(slots) → string`

格式化剩餘槽位為「2男 1女」；全為 0 時回傳「已滿」。

---

## 使用位置

### `CreateEventPage` — 建立活動

```
remainingAfterHost = calcNeeded(script, { ..., offline_male: 0, offline_female: 0 })
                     ↑ 只扣主揪，offline 由 canAddOffline 模擬

+button: canAddOffline(remainingAfterHost, form.offline_male, form.offline_female,
                       addingGender, form.allow_cross_gender)

顯示: formatNeeded(calcNeeded(script, { ...form, hostGender: user.gender }))
```

### `EventDetailPage` — 編輯活動

```
remainingAfterOnline = calcRemainingAfterOnline(event.script, confirmedMembers)
                       ↑ 扣所有線上已確認成員（含主揪）

+button: canAddOffline(remainingAfterOnline, editForm.offline_male, editForm.offline_female,
                       addingGender, event.allow_cross_gender)
```

---

## 重要限制

- **無反串（`allow_cross_gender = false`）**：offline 男不能填女槽，offline 女不能填男槽
- **有反串（`allow_cross_gender = true`）**：可溢位至對方槽位，但仍不能超過總人數
- **編輯時 `allow_cross_gender` 可修改**：只影響新申請，不影響已確認成員；後端 `location_only_params` 已包含此欄位

---

## 測試

`src/test/slotCalc.test.ts` — 22 個 unit tests，覆蓋：

- 無人填槽基準
- 主揪（含反串）佔位
- offline 在自己槽位內
- offline 超過自己槽位 → 溢入 any_slots
- offline 超過 any_slots → 溢入對方槽位
- `calcRemainingAfterOnline` 含 cross_gender 成員
- `canAddOffline` 無反串：不允許溢入對方槽位
- `canAddOffline` 有反串：允許溢入對方槽位
- any_slots 共享（一方用完後另一方被阻擋）
