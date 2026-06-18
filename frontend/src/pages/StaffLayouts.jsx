import { useEffect, useRef, useState } from 'react'
import { apiGet } from '../api'

const CANVAS_W = 820
const CANVAS_H = 580

function drawElement(ctx, el) {
  const { x, y, w, h, type, color, label } = el

  ctx.save()
  ctx.strokeStyle = '#1e293b'
  ctx.lineWidth = 1.5
  ctx.fillStyle = (color || '#2563eb') + 'cc'

  if (type === 'table-round') {
    ctx.beginPath()
    ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
  } else {
    ctx.beginPath()
    ctx.rect(x, y, w, h)
    ctx.fill()
    ctx.stroke()
  }

  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 11px system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  const maxW = w - 8
  let text = label || ''
  while (text.length > 3 && ctx.measureText(text).width > maxW) {
    text = text.slice(0, -1)
  }
  ctx.fillText(text, x + w / 2, y + h / 2)

  ctx.restore()
}

function renderCanvas(canvas, elements) {
  const ctx = canvas.getContext('2d')
  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H)

  ctx.fillStyle = '#f8fafc'
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H)

  ctx.strokeStyle = '#e2e8f0'
  ctx.lineWidth = 0.5
  for (let gx = 0; gx <= CANVAS_W; gx += 40) {
    ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, CANVAS_H); ctx.stroke()
  }
  for (let gy = 0; gy <= CANVAS_H; gy += 40) {
    ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(CANVAS_W, gy); ctx.stroke()
  }

  if (Array.isArray(elements)) {
    elements.forEach((el) => drawElement(ctx, el))
  }
}

function LayoutCanvas({ elements }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (canvas) renderCanvas(canvas, elements)
  }, [elements])

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_W}
      height={CANVAS_H}
      className="floor-plan-canvas floor-plan-readonly"
    />
  )
}

function formatDate(value) {
  return value ? new Date(value).toLocaleDateString() : 'No date'
}

function StaffLayouts({ currentUser }) {
  const [layouts, setLayouts] = useState([])
  const [openLayoutId, setOpenLayoutId] = useState(null)
  const [message, setMessage] = useState('')

  useEffect(() => {
    async function loadLayouts() {
      try {
        const tasks = await apiGet(`/tasks/staff/${currentUser.id}`)
        const eventsById = new Map()

        tasks.forEach((task) => {
          eventsById.set(task.event_id, {
            id: task.event_id,
            name: task.event_name,
            event_date: task.event_date,
          })
        })

        const layoutGroups = await Promise.all(
          Array.from(eventsById.keys()).map((eventId) =>
            apiGet(`/layouts/event/${eventId}?staff_id=${currentUser.id}`)
          )
        )

        const sharedLayouts = layoutGroups
          .flat()
          .filter((layout) => layout.shared_with_team)
          .map((layout) => ({
            ...layout,
            event: eventsById.get(layout.event_id),
            elements: Array.isArray(layout.layout_data) ? layout.layout_data : [],
          }))

        setLayouts(sharedLayouts)
        setMessage('')
      } catch (err) {
        setMessage(err.message || 'Could not load shared layouts.')
      }
    }

    loadLayouts()
  }, [currentUser.id])

  return (
    <div className="workspace-section">
      <div className="section-heading">
        <p className="eyebrow">Layout utilization</p>
        <h1>Shared Floor Plans</h1>
        <p>Floor plans shared with you by the event organizer. Select a layout to view it.</p>
      </div>

      {message && <p className="error-text">{message}</p>}

      <section className="page-panel">
        <div className="panel-header">
          <h2>Shared Layouts</h2>
          <span>{layouts.length}</span>
        </div>
        {layouts.length === 0 ? (
          <p className="empty-state">No floor plans have been shared with you yet.</p>
        ) : (
          <ul className="list data-list staff-layout-list">
            {layouts.map((layout) => (
              <li key={layout.id}>
                <strong>{layout.name}</strong>
                <span>
                  {layout.event?.name || `Event #${layout.event_id}`}
                  {layout.event?.event_date ? ` · ${formatDate(layout.event.event_date)}` : ''}
                </span>
                <button
                  type="button"
                  className="secondary-button"
                  style={{ justifySelf: 'start', marginTop: 4 }}
                  onClick={() => setOpenLayoutId(openLayoutId === layout.id ? null : layout.id)}
                >
                  {openLayoutId === layout.id ? 'Hide Floor Plan' : 'View Floor Plan'}
                </button>
                {openLayoutId === layout.id && (
                  <div className="staff-layout-viewer">
                    <LayoutCanvas elements={layout.elements} />
                    {layout.elements.length === 0 && (
                      <p className="empty-state" style={{ marginTop: 8 }}>This layout has no elements yet.</p>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

export default StaffLayouts
