import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getEvents } from "../api/events";
import {
  EVENT_STATUS_LABELS as STATUS_LABELS,
  EVENT_STATUS_COLORS as STATUS_COLORS,
  DIFFICULTY_LABELS,
  GENRE_LABELS,
} from "../utils/labels";
import type { Event } from "../types";
import EventLocation from "../components/EventLocation";
import { formatDate } from "../utils/formatDate";

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");

  useEffect(() => {
    setLoading(true);
    getEvents(status ? { status } : {})
      .then(setEvents)
      .finally(() => setLoading(false));
  }, [status]);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
        <h1 className="text-2xl font-bold text-gray-900">揪團活動</h1>
        <div className="flex gap-2 overflow-x-auto pb-1 shrink-0">
          {(["", "recruiting", "full"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${
                status === s
                  ? "bg-brand text-white border-brand"
                  : "border-gray-300 text-gray-600 hover:border-gray-400"
              }`}
            >
              {s === "" ? "全部" : STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center text-gray-400 py-16">載入中...</div>
      ) : events.length === 0 ? (
        <div className="text-center text-gray-400 py-16">目前沒有活動</div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {events.map((event) => (
            <Link
              key={event.id}
              to={`/events/${event.id}`}
              className="flex gap-3 bg-surface rounded-xl p-3 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="w-[72px] shrink-0">
                <div className="aspect-[2/3] rounded-lg overflow-hidden bg-gray-100">
                  {event.script.cover_image_url ? (
                    <img
                      src={event.script.cover_image_url}
                      alt={event.script.title}
                      className="w-full h-full object-cover object-center"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300 text-2xl">
                      📖
                    </div>
                  )}
                </div>
              </div>

              <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                <div>
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <h2 className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2">
                      {event.script.title}
                    </h2>
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded font-medium shrink-0 ${STATUS_COLORS[event.status]}`}
                    >
                      {STATUS_LABELS[event.status]}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                      {DIFFICULTY_LABELS[event.script.difficulty]}
                    </span>
                    {event.script.genres.slice(0, 3).map((g) => (
                      <span
                        key={g}
                        className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded"
                      >
                        {GENRE_LABELS[g]}
                      </span>
                    ))}
                    {event.allow_cross_gender && (
                      <span className="text-xs bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded font-medium">
                        反串
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-2 space-y-0.5 text-xs text-gray-500">
                  <div className="font-medium text-gray-700">
                    {formatDate(event.scheduled_at)}
                  </div>
                  <EventLocation address={event.address} location={event.location} />
                    <div className="flex items-center justify-between pt-0.5">
                      <span className="text-gray-400">{event.host.nickname}</span>
                      {event.slot_parts ? (
                        <span className="text-xs font-medium text-brand bg-brand-light/30 px-2 py-0.5 rounded-full border border-brand/20">
                          缺 {event.slot_parts}
                        </span>
                      ) : (
                        <span className="font-semibold text-gray-800 tabular-nums">
                          {event.confirmed_count}
                          <span className="font-normal text-gray-400">
                            /{event.script.total_slots} 人
                          </span>
                        </span>
                      )}
                    </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
