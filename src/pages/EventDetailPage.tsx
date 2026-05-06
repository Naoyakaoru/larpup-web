import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getEvent, joinEvent, leaveEvent, updateMember } from '../api/events'
import { useAuth } from '../contexts/AuthContext'
import type { Event, EventMember } from '../types'

const STATUS_LABELS: Record<Event['status'], string> = {
  recruiting: '招募中', full: '已滿員', completed: '已完成', cancelled: '已取消',
}

const MEMBER_STATUS_LABELS: Record<EventMember['status'], string> = {
  pending: '待審核', confirmed: '已確認', rejected: '已拒絕',
  cancelled: '已取消', leave_requested: '申請退出',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('zh-TW', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false,
  })
}

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionMsg, setActionMsg] = useState('')
  const { user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    getEvent(Number(id)).then(setEvent).finally(() => setLoading(false))
  }, [id])

  async function handleJoin() {
    try {
      const res = await joinEvent(Number(id))
      setActionMsg(res.message)
      setEvent(await getEvent(Number(id)))
    } catch (err) {
      setActionMsg(err instanceof Error ? err.message : '操作失敗')
    }
  }

  async function handleLeave() {
    try {
      const res = await leaveEvent(Number(id))
      setActionMsg(res.message)
      setEvent(await getEvent(Number(id)))
    } catch (err) {
      setActionMsg(err instanceof Error ? err.message : '操作失敗')
    }
  }

  async function handleMemberUpdate(memberId: number, status: string) {
    try {
      await updateMember(Number(id), memberId, status)
      setEvent(await getEvent(Number(id)))
    } catch (err) {
      setActionMsg(err instanceof Error ? err.message : '操作失敗')
    }
  }

  if (loading) return <div className="text-center text-gray-400 py-16">載入中...</div>
  if (!event) return <div className="text-center text-gray-400 py-16">找不到活動</div>

  const isHost = user?.id === event.host.id
  const myMember = event.members?.find(m => m.user.id === user?.id)

  return (
    <div className="max-w-2xl">
      <button onClick={() => navigate(-1)} className="text-sm text-gray-400 hover:text-gray-600 mb-4">← 返回</button>

      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-4">
        <div className="flex items-start justify-between mb-4">
          <h1 className="text-xl font-bold text-gray-900">{event.script.title}</h1>
          <span className="text-sm bg-brand-light/30 text-brand-hover px-2 py-0.5 rounded-full">
            {STATUS_LABELS[event.status]}
          </span>
        </div>
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div><dt className="text-gray-400">時間</dt><dd className="text-gray-900">{formatDate(event.scheduled_at)}</dd></div>
          <div><dt className="text-gray-400">地點</dt><dd className="text-gray-900">{event.location}</dd></div>
          <div><dt className="text-gray-400">主辦</dt><dd className="text-gray-900">{event.host.nickname}</dd></div>
          <div><dt className="text-gray-400">人數</dt><dd className="text-gray-900">{event.confirmed_count} / {event.script.total_slots} 人（剩 {event.available_slots}）</dd></div>
        </dl>

        {actionMsg && <p className="mt-4 text-sm text-brand">{actionMsg}</p>}

        {user && !isHost && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            {!myMember && (
              <button onClick={handleJoin} disabled={event.status === 'full' || event.status === 'cancelled'}
                className="bg-brand text-white text-sm px-4 py-2 rounded-md hover:bg-brand-hover disabled:opacity-50">
                申請加入
              </button>
            )}
            {myMember && (
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-500">我的狀態：<strong>{MEMBER_STATUS_LABELS[myMember.status]}</strong></span>
                {(myMember.status === 'pending' || myMember.status === 'confirmed') && (
                  <button onClick={handleLeave} className="text-sm text-red-500 hover:text-red-700">退出</button>
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
            {event.members.map(m => (
              <div key={m.id} className="flex items-center justify-between text-sm">
                <span className="text-gray-700">{m.user.nickname}</span>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">{MEMBER_STATUS_LABELS[m.status]}</span>
                  {isHost && m.status === 'pending' && (
                    <>
                      <button onClick={() => handleMemberUpdate(m.id, 'confirmed')}
                        className="text-green-600 hover:text-green-800">確認</button>
                      <button onClick={() => handleMemberUpdate(m.id, 'rejected')}
                        className="text-red-500 hover:text-red-700">拒絕</button>
                    </>
                  )}
                  {isHost && m.status === 'leave_requested' && (
                    <button onClick={() => handleMemberUpdate(m.id, 'cancelled')}
                      className="text-orange-500 hover:text-orange-700">同意退出</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
