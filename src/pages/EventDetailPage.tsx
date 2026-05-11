import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
  getEvent,
  joinEvent,
  leaveEvent,
  updateMember,
  updateEvent,
  deleteEvent,
  restoreEvent,
  cancelEvent,
} from "../api/events";
import { getScriptVersions, type ScriptVersion } from "../api/scripts";
import { useAuth } from "../contexts/AuthContext";
import { calcRemainingAfterOnline, canAddOffline } from "../utils/slotCalc";
import type { Address, Event } from "../types";
import AddressPicker from "../components/AddressPicker";
import EventLocation from "../components/EventLocation";

import {
  DIFFICULTY_COLORS,
  DIFFICULTY_LABELS,
  GENRE_LABELS,
  EVENT_STATUS_LABELS as STATUS_LABELS,
  EVENT_STATUS_COLORS as STATUS_COLORS,
  MEMBER_STATUS_LABELS,
} from "../utils/labels";


function formatDate(iso: string) {
  return new Date(iso).toLocaleString("zh-TW", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState("");
  const [crossGender, setCrossGender] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    location: "",
    offline_male: 0,
    offline_female: 0,
    allow_cross_gender: false,
  });
  const [editScheduledAt, setEditScheduledAt] = useState<Date | null>(null);
  const [editAddress, setEditAddress] = useState<Address | null>(null);
  const [editVersions, setEditVersions] = useState<ScriptVersion[]>([]);
  const [editScriptVersionId, setEditScriptVersionId] = useState<number | null>(
    null,
  );
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    getEvent(Number(id))
      .then(setEvent)
      .finally(() => setLoading(false));
  }, [id]);

  async function handleJoin() {
    try {
      const res = await joinEvent(Number(id), crossGender);
      setActionMsg(res.message);
      setEvent(await getEvent(Number(id)));
    } catch (err) {
      setActionMsg(err instanceof Error ? err.message : "操作失敗");
    }
  }

  async function handleLeave() {
    try {
      const res = await leaveEvent(Number(id));
      setActionMsg(res.message);
      setEvent(await getEvent(Number(id)));
    } catch (err) {
      setActionMsg(err instanceof Error ? err.message : "操作失敗");
    }
  }

  async function handleDelete() {
    if (!confirm("確定要刪除這個揪團嗎？")) return;
    try {
      await deleteEvent(Number(id));
      setEvent(await getEvent(Number(id)));
    } catch (err) {
      setActionMsg(err instanceof Error ? err.message : "刪除失敗");
    }
  }

  async function handleCancel() {
    if (!confirm("確定要取消這個揪團嗎？已報名的成員將無法繼續參加。")) return;
    try {
      setEvent(await cancelEvent(Number(id)));
    } catch (err) {
      setActionMsg(err instanceof Error ? err.message : "取消失敗");
    }
  }

  async function handleRestore() {
    try {
      setEvent(await restoreEvent(Number(id)));
    } catch (err) {
      setActionMsg(err instanceof Error ? err.message : "復原失敗");
    }
  }

  function startEdit() {
    setEditAddress(event!.address ?? null);
    setEditForm({
      location: event!.location ?? "",
      offline_male: event!.offline_male,
      offline_female: event!.offline_female,
      allow_cross_gender: event!.allow_cross_gender,
    });
    setEditScheduledAt(new Date(event!.scheduled_at));
    setEditScriptVersionId(event!.script_version_id);
    setEditVersions([]);
    const hasOtherMembers = event!.members?.some(
      (m) => m.user.id !== event!.host.id,
    );
    if (!hasOtherMembers) {
      getScriptVersions(event!.script.id).then(setEditVersions);
    }
    setEditing(true);
  }

  async function handleSaveEdit() {
    try {
      const hasOtherMembers = event!.members?.some(
        (m) => m.user.id !== event!.host.id,
      );
      const data: Partial<{
        script_version_id: number;
        location: string | null;
        address_id: number | null;
        scheduled_at: string;
        offline_male: number;
        offline_female: number;
        allow_cross_gender: boolean;
      }> = {
        address_id: editAddress?.id ?? null,
        location: editAddress ? null : editForm.location,
        offline_male: editForm.offline_male,
        offline_female: editForm.offline_female,
        allow_cross_gender: editForm.allow_cross_gender,
      };
      if (!hasOtherMembers && editScheduledAt)
        data.scheduled_at = editScheduledAt.toISOString();
      if (
        !hasOtherMembers &&
        editScriptVersionId !== null &&
        editScriptVersionId !== event!.script_version_id
      )
        data.script_version_id = editScriptVersionId;
      setEvent(await updateEvent(Number(id), data));
      setEditing(false);
    } catch (err) {
      setActionMsg(err instanceof Error ? err.message : "儲存失敗");
    }
  }

  async function handleMemberUpdate(memberId: number, status: string) {
    try {
      await updateMember(Number(id), memberId, status);
      setEvent(await getEvent(Number(id)));
    } catch (err) {
      setActionMsg(err instanceof Error ? err.message : "操作失敗");
    }
  }

  if (loading)
    return <div className="text-center text-gray-400 py-16">載入中...</div>;
  if (!event)
    return <div className="text-center text-gray-400 py-16">找不到活動</div>;

  const isHost = user?.id === event.host.id;
  const myMember = event.members?.find((m) => m.user.id === user?.id);
  const hostInGame = event.members?.some((m) => m.user.id === event.host.id);
  const { male_slots, female_slots, any_slots } = event.script;

  const confirmedMembers = (event.members ?? []).filter(
    (m) => m.status === "confirmed",
  );
  let maleFilled = event.offline_male;
  let femaleFilled = event.offline_female;
  let anyFilled = 0;
  for (const m of confirmedMembers) {
    const effectiveGender = m.cross_gender
      ? m.user.gender === "male"
        ? "female"
        : "male"
      : m.user.gender;
    if (effectiveGender === "male" && maleFilled < male_slots) maleFilled++;
    else if (effectiveGender === "female" && femaleFilled < female_slots)
      femaleFilled++;
    else anyFilled++;
  }

  const slotParts = [
    male_slots > 0 ? `${Math.max(0, male_slots - maleFilled)}男` : "",
    female_slots > 0 ? `${Math.max(0, female_slots - femaleFilled)}女` : "",
    any_slots > 0 ? `${Math.max(0, any_slots - anyFilled)}不限` : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="max-w-2xl">
      <button
        onClick={() => navigate(-1)}
        className="text-sm text-gray-400 hover:text-gray-600 mb-4"
      >
        ← 返回
      </button>

      {event.deleted_at && isHost && (
        <div className="mb-4 flex items-center justify-between bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          <span className="text-sm text-red-600">此揪團已刪除</span>
          <button
            onClick={handleRestore}
            className="text-sm text-red-600 font-medium hover:text-red-800 underline"
          >
            取消刪除
          </button>
        </div>
      )}

      <div className="bg-surface rounded-lg border border-gray-200 p-6 mb-4">
        <div className="flex items-start justify-between mb-4">
          <Link
            to={`/scripts/${event.script.id}`}
            className="text-xl font-bold text-gray-900 hover:text-brand transition-colors"
          >
            {event.script.title}
          </Link>
          <span
            className={`shrink-0 ml-3 text-sm px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[event.status]}`}
          >
            {STATUS_LABELS[event.status]}
          </span>
        </div>

        <div className="flex flex-wrap gap-1.5 mb-3">
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-medium ${DIFFICULTY_COLORS[event.script.difficulty]}`}
          >
            {DIFFICULTY_LABELS[event.script.difficulty]}
          </span>
          {event.script.genres.map((g) => (
            <span
              key={g}
              className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full"
            >
              {GENRE_LABELS[g]}
            </span>
          ))}
          {event.allow_cross_gender && (
            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">
              開放反串
            </span>
          )}
        </div>

        {(() => {
          const parts = [
            event.script.store?.name,
            event.script.version_name,
            event.script.duration != null ? `${event.script.duration}h` : null,
            event.script.price != null ? `NT$${event.script.price}` : null,
          ].filter(Boolean);
          return (
            <p className="text-xs text-gray-400 mb-4">{parts.join("・")}</p>
          );
        })()}

        <dl className="space-y-2 text-sm mb-4">
          <div className="flex justify-between">
            <dt className="text-gray-400">時間</dt>
            <dd className="text-gray-900">{formatDate(event.scheduled_at)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-gray-400 shrink-0">地點</dt>
            <dd className="text-gray-900 text-right">
              <EventLocation address={event.address} location={event.location} />
            </dd>
          </div>
          {!hostInGame && (
            <div className="flex justify-between">
              <dt className="text-gray-400">主辦</dt>
              <dd>
                <Link
                  to={`/users/${event.host.handle}`}
                  className="text-gray-900 hover:text-brand transition-colors"
                >
                  {event.host.nickname}
                </Link>
              </dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt className="text-gray-400">徵</dt>
            <dd className="text-gray-900">{slotParts}</dd>
          </div>
        </dl>

        {actionMsg && <p className="mt-4 text-sm text-brand">{actionMsg}</p>}

        {isHost && (
          <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
            {editing ? (
              <>
                <div className="space-y-1.5">
                  <label className="block text-xs text-gray-500">地點</label>
                  <AddressPicker
                    value={editAddress}
                    onChange={setEditAddress}
                    versionId={event!.script_version_id}
                  />
                  {!editAddress && (
                    <input
                      value={editForm.location}
                      onChange={(e) =>
                        setEditForm((f) => ({ ...f, location: e.target.value }))
                      }
                      placeholder="或直接填入地址 / Google Maps 連結"
                      className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                    />
                  )}
                </div>
                {!event.members?.some((m) => m.user.id !== event.host.id) && (
                  <>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">
                        時間
                      </label>
                      <DatePicker
                        selected={editScheduledAt}
                        onChange={setEditScheduledAt}
                        onFocus={(e) => e.target.blur()}
                        showTimeSelect
                        timeIntervals={30}
                        dateFormat="yyyy/MM/dd HH:mm"
                        timeFormat="HH:mm"
                        className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                        wrapperClassName="w-full"
                        onCalendarOpen={() => {
                          setTimeout(() => {
                            const list = document.querySelector(
                              ".react-datepicker__time-list",
                            );
                            const items = list?.querySelectorAll(
                              ".react-datepicker__time-list-item",
                            );
                            items?.[16]?.scrollIntoView({ block: "start" });
                          }, 0);
                        }}
                      />
                    </div>
                    {editVersions.length > 0 && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1.5">店家版本</p>
                        <div className="space-y-1.5">
                          {editVersions.map((v) => (
                            <button
                              key={v.id}
                              type="button"
                              onClick={() => setEditScriptVersionId(v.id)}
                              className={`w-full text-left rounded-md border px-3 py-2 text-sm transition-colors ${
                                editScriptVersionId === v.id
                                  ? "border-brand bg-brand/5"
                                  : "border-gray-200 hover:border-gray-300 bg-white"
                              }`}
                            >
                              <div className="flex justify-between items-center gap-2">
                                <span className="font-medium text-gray-900">
                                  {v.store.name}
                                </span>
                                {v.version_name && (
                                  <span className="text-xs text-gray-400 shrink-0">
                                    {v.version_name}
                                  </span>
                                )}
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
                <div>
                  <p className="text-xs text-gray-500 mb-1.5">線下已確定朋友</p>
                  {(
                    [
                      ["offline_male", "男"],
                      ["offline_female", "女"],
                    ] as const
                  ).map(([field, label]) => (
                    <div
                      key={field}
                      className="flex items-center justify-between mb-1"
                    >
                      <span className="text-xs text-gray-500">{label}生</span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setEditForm((f) => ({
                              ...f,
                              [field]: Math.max(0, f[field] - 1),
                            }))
                          }
                          className="w-6 h-6 rounded-full border border-gray-300 text-gray-600 text-sm flex items-center justify-center hover:border-brand hover:text-brand"
                        >
                          −
                        </button>
                        <span className="text-sm font-medium w-4 text-center">
                          {editForm[field]}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setEditForm((f) => {
                              const remainingAfterOnline =
                                calcRemainingAfterOnline(
                                  event.script,
                                  confirmedMembers,
                                );
                              const addingGender =
                                field === "offline_male" ? "male" : "female";
                              if (
                                !canAddOffline(
                                  remainingAfterOnline,
                                  f.offline_male,
                                  f.offline_female,
                                  addingGender,
                                  event.allow_cross_gender,
                                )
                              )
                                return f;
                              return { ...f, [field]: f[field] + 1 };
                            })
                          }
                          className="w-6 h-6 rounded-full border border-gray-300 text-gray-600 text-sm flex items-center justify-center hover:border-brand hover:text-brand"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editForm.allow_cross_gender}
                    onChange={(e) =>
                      setEditForm((f) => ({
                        ...f,
                        allow_cross_gender: e.target.checked,
                      }))
                    }
                    className="w-4 h-4 accent-brand rounded"
                  />
                  <span className="text-xs text-gray-600">
                    開放反串（只影響新申請）
                  </span>
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveEdit}
                    className="text-sm bg-brand text-white px-3 py-1.5 rounded-md hover:bg-brand-hover"
                  >
                    儲存
                  </button>
                  <button
                    onClick={() => setEditing(false)}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    取消
                  </button>
                </div>
              </>
            ) : (
              <div className="flex gap-3">
                <button
                  onClick={startEdit}
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  編輯
                </button>
                {event.status !== "cancelled" &&
                  event.status !== "completed" && (
                    <button
                      onClick={handleCancel}
                      className="text-sm text-orange-500 hover:text-orange-700"
                    >
                      取消揪團
                    </button>
                  )}
                {!event.members?.some((m) => m.user.id !== event.host.id) && (
                  <button
                    onClick={handleDelete}
                    className="text-sm text-red-500 hover:text-red-700"
                  >
                    刪除揪團
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {user && !isHost && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            {(!myMember || myMember.status === "cancelled") && (
              <div className="space-y-3">
                {myMember?.status === "cancelled" && (
                  <p className="text-xs text-gray-400">
                    你曾取消報名，可以重新申請
                  </p>
                )}
                {event.allow_cross_gender && (
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={crossGender}
                      onChange={(e) => setCrossGender(e.target.checked)}
                      className="w-4 h-4 accent-brand rounded"
                    />
                    <span className="text-sm text-gray-700">我要反串</span>
                  </label>
                )}
                <button
                  onClick={handleJoin}
                  disabled={
                    event.status === "full" || event.status === "cancelled"
                  }
                  className="bg-brand text-white text-sm px-4 py-2 rounded-md hover:bg-brand-hover disabled:opacity-50"
                >
                  申請加入
                </button>
              </div>
            )}
            {myMember && myMember.status !== "cancelled" && (
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-500">
                  我的狀態：
                  <strong>{MEMBER_STATUS_LABELS[myMember.status]}</strong>
                </span>
                {(myMember.status === "pending" ||
                  myMember.status === "confirmed") && (
                  <button
                    onClick={handleLeave}
                    className="text-sm text-red-500 hover:text-red-700"
                  >
                    退出
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {event.members &&
        (event.members.length > 0 ||
          event.offline_male > 0 ||
          event.offline_female > 0) && (
          <div className="bg-surface rounded-lg border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-3">報名名單</h2>
            <div className="space-y-2">
              {event.members
                .filter(
                  (m) => m.status !== "cancelled" && m.status !== "rejected",
                )
                .map((m) => {
                  const showName =
                    isHost || m.user.id === user?.id || m.status !== "pending";
                  return (
                    <div
                      key={m.id}
                      className="py-1.5 border-b border-gray-50 last:border-0"
                    >
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {showName && m.user.id === event.host.id ? (
                            <Link
                              to={`/users/${m.user.handle}`}
                              className="text-gray-700 font-medium hover:text-brand transition-colors"
                            >
                              {m.user.nickname}
                            </Link>
                          ) : (
                            <span
                              className={
                                showName
                                  ? "text-gray-700 font-medium"
                                  : "text-gray-400 italic"
                              }
                            >
                              {showName ? m.user.nickname : "匿名"}
                            </span>
                          )}
                          {m.user.id === event.host.id && (
                            <span className="text-xs bg-brand text-white px-1.5 py-0.5 rounded">
                              主揪
                            </span>
                          )}
                          <span
                            className={`text-xs w-5 h-5 rounded-full inline-flex items-center justify-center font-medium ${m.user.gender === "male" ? "bg-blue-100 text-blue-600" : "bg-pink-100 text-pink-600"}`}
                          >
                            {m.user.gender === "male" ? "♂" : "♀"}
                          </span>
                          {m.cross_gender && (
                            <span className="text-xs bg-accent/20 text-accent px-1.5 py-0.5 rounded">
                              反串
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-gray-400 text-xs">
                            {MEMBER_STATUS_LABELS[m.status]}
                          </span>
                          {isHost && m.status === "pending" && (
                            <>
                              <button
                                onClick={() =>
                                  handleMemberUpdate(m.id, "confirmed")
                                }
                                className="text-green-600 hover:text-green-800 text-xs"
                              >
                                確認
                              </button>
                              <button
                                onClick={() =>
                                  handleMemberUpdate(m.id, "rejected")
                                }
                                className="text-red-500 hover:text-red-700 text-xs"
                              >
                                拒絕
                              </button>
                            </>
                          )}
                          {isHost && m.status === "leave_requested" && (
                            <button
                              onClick={() =>
                                handleMemberUpdate(m.id, "cancelled")
                              }
                              className="text-orange-500 hover:text-orange-700 text-xs"
                            >
                              同意退出
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-3 mt-0.5 text-xs text-gray-400 flex-wrap">
                        {((isHost && m.user.id !== event.host.id) ||
                          (!isHost && m.user.id === user?.id)) && (
                          <span>
                            申請{" "}
                            {new Date(m.applied_at).toLocaleString("zh-TW", {
                              month: "2-digit",
                              day: "2-digit",
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: false,
                            })}
                          </span>
                        )}
                        {m.confirmed_at && (
                          <span>
                            確認{" "}
                            {new Date(m.confirmed_at).toLocaleString("zh-TW", {
                              month: "2-digit",
                              day: "2-digit",
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: false,
                            })}
                          </span>
                        )}
                        {m.rejected_at && (
                          <span>
                            拒絕{" "}
                            {new Date(m.rejected_at).toLocaleString("zh-TW", {
                              month: "2-digit",
                              day: "2-digit",
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: false,
                            })}
                          </span>
                        )}
                        {m.leave_requested_at && (
                          <span>
                            申請下車{" "}
                            {new Date(m.leave_requested_at).toLocaleString(
                              "zh-TW",
                              {
                                month: "2-digit",
                                day: "2-digit",
                                hour: "2-digit",
                                minute: "2-digit",
                                hour12: false,
                              },
                            )}
                          </span>
                        )}
                        {m.cancelled_at && (
                          <span>
                            取消{" "}
                            {new Date(m.cancelled_at).toLocaleString("zh-TW", {
                              month: "2-digit",
                              day: "2-digit",
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: false,
                            })}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              {Array.from({ length: event.offline_male }).map((_, i) => (
                <div
                  key={`offline-male-${i}`}
                  className="py-1.5 border-b border-gray-50 last:border-0"
                >
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1.5">
                      <span className="text-gray-400 italic">線下成員</span>
                      <span className="text-xs w-5 h-5 rounded-full inline-flex items-center justify-center font-medium bg-blue-100 text-blue-600">
                        ♂
                      </span>
                    </div>
                    <span className="text-gray-400 text-xs">已確認</span>
                  </div>
                </div>
              ))}
              {Array.from({ length: event.offline_female }).map((_, i) => (
                <div
                  key={`offline-female-${i}`}
                  className="py-1.5 border-b border-gray-50 last:border-0"
                >
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1.5">
                      <span className="text-gray-400 italic">線下成員</span>
                      <span className="text-xs w-5 h-5 rounded-full inline-flex items-center justify-center font-medium bg-pink-100 text-pink-600">
                        ♀
                      </span>
                    </div>
                    <span className="text-gray-400 text-xs">已確認</span>
                  </div>
                </div>
              ))}
              {event.members
                .filter(
                  (m) => m.status === "cancelled" || m.status === "rejected",
                )
                .map((m) => {
                  const showName =
                    isHost || m.user.id === user?.id || m.status !== "pending";
                  return (
                    <div
                      key={m.id}
                      className="py-1.5 border-b border-gray-50 last:border-0 opacity-50"
                    >
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className={
                              showName
                                ? "text-gray-700 font-medium"
                                : "text-gray-400 italic"
                            }
                          >
                            {showName ? m.user.nickname : "匿名"}
                          </span>
                          <span
                            className={`text-xs w-5 h-5 rounded-full inline-flex items-center justify-center font-medium ${m.user.gender === "male" ? "bg-blue-100 text-blue-600" : "bg-pink-100 text-pink-600"}`}
                          >
                            {m.user.gender === "male" ? "♂" : "♀"}
                          </span>
                        </div>
                        <span className="text-gray-400 text-xs">
                          {MEMBER_STATUS_LABELS[m.status]}
                        </span>
                      </div>
                      <div className="flex gap-3 mt-0.5 text-xs text-gray-400 flex-wrap">
                        {((isHost && m.user.id !== event.host.id) ||
                          (!isHost && m.user.id === user?.id)) && (
                          <span>
                            申請{" "}
                            {new Date(m.applied_at).toLocaleString("zh-TW", {
                              month: "2-digit",
                              day: "2-digit",
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: false,
                            })}
                          </span>
                        )}
                        {m.rejected_at && (
                          <span>
                            拒絕{" "}
                            {new Date(m.rejected_at).toLocaleString("zh-TW", {
                              month: "2-digit",
                              day: "2-digit",
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: false,
                            })}
                          </span>
                        )}
                        {m.cancelled_at && (
                          <span>
                            取消{" "}
                            {new Date(m.cancelled_at).toLocaleString("zh-TW", {
                              month: "2-digit",
                              day: "2-digit",
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: false,
                            })}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

      {event.audit_logs && event.audit_logs.length > 0 && (
        <div className="bg-surface rounded-lg border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-3">變更紀錄</h2>
          <div className="space-y-2">
            {event.audit_logs.map((log, i) => (
              <div key={i} className="flex items-start justify-between text-sm">
                <span className="text-gray-600">
                  {log.action === "location_changed" && (
                    <>
                      <span className="font-medium">{log.user.nickname}</span>
                      {" 更改地點："}
                      <span className="line-through text-gray-400">
                        {String(log.metadata.from ?? "")}
                      </span>
                      {" → "}
                      <span>{String(log.metadata.to ?? "")}</span>
                    </>
                  )}
                </span>
                <span className="text-xs text-gray-400 shrink-0 ml-3">
                  {new Date(log.created_at).toLocaleString("zh-TW", {
                    month: "2-digit",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false,
                  })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
