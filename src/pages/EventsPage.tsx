import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getEvents } from "../api/events";
import {
  EVENT_STATUS_LABELS as STATUS_LABELS,
  EVENT_STATUS_COLORS as STATUS_COLORS,
  DIFFICULTY_LABELS,
  GENRE_LABELS,
  GENRES,
  REGION_OPTIONS,
  SLOT_TOKENS,
} from "../utils/labels";
import type { Event } from "../types";
import EventLocation from "../components/EventLocation";
import { formatDate, getTimeSlot, type TimeSlot } from "../utils/formatDate";

const TIME_SLOT_OPTIONS: { value: TimeSlot; label: string }[] = [
  { value: "weekday_day", label: "平白" },
  { value: "weekday_night", label: "平晚" },
  { value: "friday_night", label: "五晚" },
  { value: "weekend", label: "假日" },
];

function EventCardSkeleton() {
  return (
    <div data-testid="event-card-skeleton" className="flex gap-3 bg-surface rounded-xl p-3 shadow-sm overflow-hidden animate-pulse">
      <div className="w-[72px] shrink-0">
        <div className="aspect-[2/3] rounded-lg bg-gray-200" />
      </div>
      <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
        <div>
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <div className="h-4 bg-gray-200 rounded w-3/4" />
            <div className="h-4 bg-gray-200 rounded w-10 shrink-0" />
          </div>
          <div className="flex flex-wrap gap-1">
            <div className="h-4 bg-gray-200 rounded w-12" />
            <div className="h-4 bg-gray-200 rounded w-8" />
            <div className="h-4 bg-gray-200 rounded w-14" />
          </div>
        </div>
        <div className="mt-2 space-y-1.5">
          <div className="h-3 bg-gray-200 rounded w-2/3" />
          <div className="h-3 bg-gray-200 rounded w-1/2" />
          <div className="flex items-center justify-between pt-0.5">
            <div className="h-3 bg-gray-200 rounded w-16" />
            <div className="h-4 bg-gray-200 rounded w-14" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState("");
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | "">("");
  const [selectedGenres, setSelectedGenres] = useState<number[]>([]);
  const [needsMale, setNeedsMale] = useState(false);
  const [needsFemale, setNeedsFemale] = useState(false);
  const [crossGenderOnly, setCrossGenderOnly] = useState(false);

  useEffect(() => {
    setLoading(true);
    getEvents(status ? { status } : {})
      .then(setEvents)
      .finally(() => setLoading(false));
  }, [status]);

  // FE-2: reset client-side filters when server-side status filter changes
  useEffect(() => {
    clearFilters();
  }, [status]);

  // FE-4: Escape to close drawer + body scroll lock
  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDrawerOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [drawerOpen]);

  // FE-1: memoize filter computation
  const filteredEvents = useMemo(
    () =>
      events
        .filter((e) => !selectedRegion || e.address?.region === selectedRegion)
        .filter((e) => {
          if (!selectedTimeSlot) return true;
          const slot = getTimeSlot(e.scheduled_at);
          if (selectedTimeSlot === "weekday_night") return slot === "weekday_night" || slot === "friday_night";
          return slot === selectedTimeSlot;
        })
        .filter((e) => selectedGenres.length === 0 || selectedGenres.some((g) => e.script.genres.includes(g)))
        // FE-3: use SLOT_TOKENS instead of hardcoded Chinese strings
        .filter((e) => !needsMale || (e.slot_parts ?? "").includes(SLOT_TOKENS.male) || (e.slot_parts ?? "").includes(SLOT_TOKENS.any))
        .filter((e) => !needsFemale || (e.slot_parts ?? "").includes(SLOT_TOKENS.female) || (e.slot_parts ?? "").includes(SLOT_TOKENS.any))
        .filter((e) => !crossGenderOnly || e.allow_cross_gender),
    [events, selectedRegion, selectedTimeSlot, selectedGenres, needsMale, needsFemale, crossGenderOnly]
  );

  const activeFilterCount =
    [selectedRegion, selectedTimeSlot, needsMale, needsFemale, crossGenderOnly].filter(Boolean).length +
    selectedGenres.length;

  // FE-6: clearFilters does NOT close drawer (B: clear-only; apply button closes)
  function clearFilters() {
    setSelectedRegion("");
    setSelectedTimeSlot("");
    setSelectedGenres([]);
    setNeedsMale(false);
    setNeedsFemale(false);
    setCrossGenderOnly(false);
  }

  function toggleGenre(g: number) {
    setSelectedGenres((prev) =>
      prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6 gap-3">
        <h1 className="text-2xl font-bold text-gray-900">揪團活動</h1>
        <div className="flex gap-2 shrink-0">
          {(["", "recruiting"] as const).map((s) => (
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
          <button
            onClick={() => setDrawerOpen(true)}
            className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full border transition-colors ${
              activeFilterCount > 0
                ? "bg-brand text-white border-brand"
                : "border-gray-300 text-gray-600 hover:border-gray-400"
            }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="4" y1="6" x2="20" y2="6" />
              <line x1="8" y1="12" x2="16" y2="12" />
              <line x1="11" y1="18" x2="13" y2="18" />
            </svg>
            篩選
            {activeFilterCount > 0 && (
              <span className="bg-surface text-brand font-bold rounded-full w-4 h-4 flex items-center justify-center text-xs leading-none">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <EventCardSkeleton key={i} />
          ))}
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="text-center text-gray-400 py-16">
          {events.length > 0 ? "沒有符合篩選條件的活動" : "目前沒有活動"}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {filteredEvents.map((event) => (
            <Link
              key={event.id}
              to={`/events/${event.id}`}
              className="flex gap-3 bg-surface rounded-xl p-3 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
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
                    {event.script.genres
                      .filter((g) => g >= 15)
                      .map((g) => (
                        <span
                          key={g}
                          className="text-xs bg-amber-100 text-amber-700 font-medium px-1.5 py-0.5 rounded"
                        >
                          {GENRE_LABELS[g]}
                        </span>
                      ))}
                    <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                      {DIFFICULTY_LABELS[event.script.difficulty]}
                    </span>
                    {event.script.genres
                      .filter((g) => g < 15)
                      .slice(0, 3)
                      .map((g) => (
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
                  <EventLocation address={event.address} location={event.location} truncate />
                  {event.script.store && (
                    <div className="truncate text-gray-400">{event.script.store.name}</div>
                  )}
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

      {/* Filter Drawer */}
      {drawerOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-40"
            onClick={() => setDrawerOpen(false)}
          />
          {/* FE-5: ARIA dialog semantics */}
          <div
            className="fixed right-0 top-0 h-full w-72 bg-surface shadow-xl z-50 flex flex-col border-l border-gray-200"
            role="dialog"
            aria-modal="true"
            aria-labelledby="filter-drawer-title"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
              <h2 id="filter-drawer-title" className="font-semibold text-gray-900">篩選條件</h2>
              <button
                onClick={() => setDrawerOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-xl leading-none"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2.5">時段</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedTimeSlot("")}
                    className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${
                      selectedTimeSlot === ""
                        ? "bg-brand text-white border-brand"
                        : "border-gray-300 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    全部
                  </button>
                  {TIME_SLOT_OPTIONS.map((t) => (
                    <button
                      key={t.value}
                      onClick={() =>
                        setSelectedTimeSlot(
                          selectedTimeSlot === t.value ? "" : t.value
                        )
                      }
                      className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${
                        selectedTimeSlot === t.value
                          ? "bg-brand text-white border-brand"
                          : "border-gray-300 text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700 mb-2.5">地區</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedRegion("")}
                    className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${
                      selectedRegion === ""
                        ? "bg-brand text-white border-brand"
                        : "border-gray-300 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    全部
                  </button>
                  {REGION_OPTIONS.map((r) => (
                    <button
                      key={r.value}
                      onClick={() =>
                        setSelectedRegion(
                          selectedRegion === r.value ? "" : r.value
                        )
                      }
                      className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${
                        selectedRegion === r.value
                          ? "bg-brand text-white border-brand"
                          : "border-gray-300 text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700 mb-2.5">類型</p>
                <div className="flex flex-wrap gap-2">
                  {GENRES.map(([id, label]) => (
                    <button
                      key={id}
                      onClick={() => toggleGenre(id)}
                      className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${
                        selectedGenres.includes(id)
                          ? "bg-brand text-white border-brand"
                          : "border-gray-300 text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700 mb-2.5">其他</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setNeedsMale(!needsMale)}
                    className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${
                      needsMale
                        ? "bg-brand text-white border-brand"
                        : "border-gray-300 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    徵男
                  </button>
                  <button
                    onClick={() => setNeedsFemale(!needsFemale)}
                    className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${
                      needsFemale
                        ? "bg-brand text-white border-brand"
                        : "border-gray-300 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    徵女
                  </button>
                  <button
                    onClick={() => setCrossGenderOnly(!crossGenderOnly)}
                    className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${
                      crossGenderOnly
                        ? "bg-brand text-white border-brand"
                        : "border-gray-300 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    反串
                  </button>
                </div>
              </div>
            </div>

            <div className="px-5 py-4 border-t border-gray-200 flex gap-2">
              <button
                onClick={clearFilters}
                className="flex-1 py-2 text-sm border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
              >
                清除篩選
              </button>
              <button
                onClick={() => setDrawerOpen(false)}
                className="flex-1 py-2 text-sm bg-brand text-white rounded-lg hover:bg-brand-hover transition-colors"
              >
                套用
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
