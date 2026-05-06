import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  getEvent,
  joinEvent,
  leaveEvent,
  updateMember,
  deleteEvent,
} from "../api/events";
import { useAuth } from "../contexts/AuthContext";
import type { Event, EventMember } from "../types";

const DIFFICULTY_LABELS: Record<"easy" | "medium" | "hard", string> = {
  easy: "入門",
  medium: "進階",
  hard: "燒腦",
};
const DIFFICULTY_COLORS: Record<"easy" | "medium" | "hard", string> = {
  easy: "bg-blue-100 text-blue-700",
  medium: "bg-orange-100 text-orange-700",
  hard: "bg-red-100 text-red-700",
};

const STATUS_LABELS: Record<Event["status"], string> = {
  recruiting: "招募中",
  full: "已滿員",
  completed: "已完成",
  cancelled: "已取消",
};

const MEMBER_STATUS_LABELS: Record<EventMember["status"], string> = {
  pending: "待審核",
  confirmed: "已確認",
  rejected: "已拒絕",
  cancelled: "已取消",
  leave_requested: "申請退出",
};

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
      navigate("/events");
    } catch (err) {
      setActionMsg(err instanceof Error ? err.message : "刪除失敗");
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

      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-4">
        <div className="flex items-start justify-between mb-4">
          <Link
            to={`/scripts/${event.script.id}`}
            className="text-xl font-bold text-gray-900 hover:text-brand transition-colors"
          >
            {event.script.title}
          </Link>
          <span className="shrink-0 ml-3 text-sm bg-brand-light/30 text-brand-hover px-2 py-0.5 rounded-full">
            {STATUS_LABELS[event.status]}
          </span>
        </div>

        <div className="flex flex-wrap gap-1.5 mb-4">
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-medium ${DIFFICULTY_COLORS[event.script.difficulty]}`}
          >
            {DIFFICULTY_LABELS[event.script.difficulty]}
          </span>
          {event.script.genres.map((g) => (
            <span
              key={g}
              className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full"
            >
              {g}
            </span>
          ))}
        </div>

        <dl className="space-y-2 text-sm mb-4">
          <div className="flex justify-between">
            <dt className="text-gray-400">時間</dt>
            <dd className="text-gray-900">{formatDate(event.scheduled_at)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-400">地點</dt>
            <dd className="text-gray-900">{event.location}</dd>
          </div>
          {!hostInGame && (
            <div className="flex justify-between">
              <dt className="text-gray-400">主辦</dt>
              <dd className="text-gray-900">{event.host.nickname}</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt className="text-gray-400">徵</dt>
            <dd className="text-gray-900">{slotParts}</dd>
          </div>
        </dl>

        {actionMsg && <p className="mt-4 text-sm text-brand">{actionMsg}</p>}

        {isHost && !(event.members && event.members.length > 0) && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <button
              onClick={handleDelete}
              className="text-sm text-red-500 hover:text-red-700"
            >
              刪除揪團
            </button>
          </div>
        )}

        {user && !isHost && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            {!myMember && (
              <div className="space-y-3">
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
            {myMember && (
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

      {event.members && event.members.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-3">報名名單</h2>
          <div className="space-y-2">
            {event.members.map((m) => {
              const showName =
                isHost || m.user.id === user?.id || m.status !== "pending";
              return (
                <div
                  key={m.id}
                  className="flex items-center justify-between text-sm"
                >
                  <span
                    className={
                      showName ? "text-gray-700" : "text-gray-400 italic"
                    }
                  >
                    {showName ? m.user.nickname : "匿名"}
                    {m.user.id === event.host.id && (
                      <span className="ml-1.5 text-xs text-brand-hover bg-brand-light/40 px-1.5 py-0.5 rounded">
                        主揪
                      </span>
                    )}
                  </span>
                  <div className="flex items-center gap-2">
                    {m.cross_gender && (
                      <span className="text-xs bg-accent/20 text-accent px-1.5 py-0.5 rounded">
                        反串
                      </span>
                    )}
                    <span className="text-gray-400">
                      {MEMBER_STATUS_LABELS[m.status]}
                    </span>
                    {isHost && m.status === "pending" && (
                      <>
                        <button
                          onClick={() => handleMemberUpdate(m.id, "confirmed")}
                          className="text-green-600 hover:text-green-800"
                        >
                          確認
                        </button>
                        <button
                          onClick={() => handleMemberUpdate(m.id, "rejected")}
                          className="text-red-500 hover:text-red-700"
                        >
                          拒絕
                        </button>
                      </>
                    )}
                    {isHost && m.status === "leave_requested" && (
                      <button
                        onClick={() => handleMemberUpdate(m.id, "cancelled")}
                        className="text-orange-500 hover:text-orange-700"
                      >
                        同意退出
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
