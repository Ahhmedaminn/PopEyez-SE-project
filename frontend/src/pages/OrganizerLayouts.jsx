import { useCallback, useEffect, useRef, useState } from 'react'
import { apiGet, apiPatch, apiPost, apiPut } from '../api'

const CANVAS_W = 820
const CANVAS_H = 580

const ELEMENT_TYPES = [
  { type: 'table-round', label: 'Round Table', color: '#2563eb', w: 64, h: 64 },
  { type: 'table-rect', label: 'Rect Table', color: '#16a34a', w: 90, h: 44 },
  { type: 'stage', label: 'Stage', color: '#b45309', w: 130, h: 60 },
  { type: 'entrance', label: 'Entrance', color: '#7c3aed', w: 80, h: 34 },
  { type: 'bar', label: 'Bar', color: '#dc2626', w: 110, h: 44 },
  { type: 'dance-floor', label: 'Dance Floor', color: '#0891b2', w: 130, h: 100 },
  { type: 'chairs', label: 'Chairs Row', color: '#64748b', w: 110, h: 26 },
  { type: 'text', label: 'Label / Note', color: '#475569', w: 100, h: 36 },
]

function makeId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
}

function getNextElementPosition(count, template) {
  return {
    x: 60 + ((count * 72) % Math.max(1, CANVAS_W - template.w - 120)),
    y: 60 + ((count * 54) % Math.max(1, CANVAS_H - template.h - 120)),
  }
}

function drawElement(ctx, el, isSelected) {
  const { x, y, w, h, type, color, label } = el

  ctx.save()
  ctx.strokeStyle = isSelected ? '#ff5722' : '#1e293b'
  ctx.lineWidth = isSelected ? 2.5 : 1.5
  ctx.fillStyle = color + 'cc'

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

  if (isSelected) {
    ctx.strokeStyle = '#ff5722'
    ctx.lineWidth = 1
    ctx.setLineDash([5, 3])
    ctx.strokeRect(x - 4, y - 4, w + 8, h + 8)
    ctx.setLineDash([])
  }

  ctx.restore()
}

function renderCanvas(canvas, elements, selectedId) {
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

  elements.forEach((el) => drawElement(ctx, el, el.id === selectedId))
}

function hitTest(el, px, py) {
  return px >= el.x && px <= el.x + el.w && py >= el.y && py <= el.y + el.h
}

function getCanvasPos(canvas, event) {
  const rect = canvas.getBoundingClientRect()
  return {
    x: (event.clientX - rect.left) * (CANVAS_W / rect.width),
    y: (event.clientY - rect.top) * (CANVAS_H / rect.height),
  }
}

function OrganizerLayouts({ currentUser }) {
  const canvasRef = useRef(null)
  const dragRef = useRef(null)

  const [events, setEvents] = useState([])
  const [selectedEventId, setSelectedEventId] = useState('')
  const [layoutId, setLayoutId] = useState(null)
  const [layoutName, setLayoutName] = useState('Floor Plan')
  const [elements, setElements] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [sharedWithTeam, setSharedWithTeam] = useState(false)
  const [editLabel, setEditLabel] = useState('')
  const [message, setMessage] = useState('')
  const [isError, setIsError] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (canvas) renderCanvas(canvas, elements, selectedId)
  }, [elements, selectedId])

  useEffect(() => {
    apiGet(`/events?organizer_id=${currentUser.id}`)
      .then(setEvents)
      .catch(() => { setMessage('Could not load events.'); setIsError(true) })
  }, [currentUser.id])

  const loadLayout = useCallback(async (eventId) => {
    try {
      const layouts = await apiGet(`/layouts/event/${eventId}?organizer_id=${currentUser.id}`)
      if (layouts.length > 0) {
        const layout = layouts[0]
        setLayoutId(layout.id)
        setLayoutName(layout.name || 'Floor Plan')
        setElements(Array.isArray(layout.layout_data) ? layout.layout_data : [])
        setSharedWithTeam(!!layout.shared_with_team)
      } else {
        setLayoutId(null)
        setLayoutName('Floor Plan')
        setElements([])
        setSharedWithTeam(false)
      }
      setSelectedId(null)
      setEditLabel('')
      setMessage('')
      setIsError(false)
    } catch {
      setMessage('Could not load layout for this event.')
      setIsError(true)
    }
  }, [currentUser.id])

  function handleEventChange(eventId) {
    setSelectedEventId(eventId)
    if (eventId) loadLayout(eventId)
    else {
      setElements([])
      setLayoutId(null)
      setSharedWithTeam(false)
      setSelectedId(null)
      setEditLabel('')
    }
  }

  function addElement(type) {
    if (!selectedEventId) {
      setMessage('Select an event before adding elements.')
      setIsError(true)
      return
    }
    const template = ELEMENT_TYPES.find((t) => t.type === type)
    const position = getNextElementPosition(elements.length, template)
    const newEl = {
      id: makeId(),
      type,
      label: template.label,
      color: template.color,
      w: template.w,
      h: template.h,
      ...position,
    }
    setElements((prev) => [...prev, newEl])
    setSelectedId(newEl.id)
    setEditLabel(newEl.label)
  }

  function deleteSelected() {
    if (!selectedId) return
    setElements((prev) => prev.filter((el) => el.id !== selectedId))
    setSelectedId(null)
    setEditLabel('')
  }

  function applyLabel() {
    if (!selectedId) return
    setElements((prev) => prev.map((el) => el.id === selectedId ? { ...el, label: editLabel } : el))
  }

  function onMouseDown(event) {
    const { x, y } = getCanvasPos(canvasRef.current, event)
    const hit = [...elements].reverse().find((el) => hitTest(el, x, y))
    if (hit) {
      setSelectedId(hit.id)
      setEditLabel(hit.label || '')
      dragRef.current = { elementId: hit.id, offsetX: x - hit.x, offsetY: y - hit.y }
    } else {
      setSelectedId(null)
      setEditLabel('')
      dragRef.current = null
    }
  }

  function onMouseMove(event) {
    if (!dragRef.current) return
    const { x, y } = getCanvasPos(canvasRef.current, event)
    const { elementId, offsetX, offsetY } = dragRef.current
    setElements((prev) =>
      prev.map((el) =>
        el.id === elementId
          ? {
              ...el,
              x: Math.max(0, Math.min(CANVAS_W - el.w, x - offsetX)),
              y: Math.max(0, Math.min(CANVAS_H - el.h, y - offsetY)),
            }
          : el
      )
    )
  }

  function onMouseUp() {
    dragRef.current = null
  }

  async function saveLayout() {
    if (!selectedEventId) {
      setMessage('Select an event first.')
      setIsError(true)
      return
    }
    try {
      if (layoutId) {
        await apiPut(`/layouts/${layoutId}`, {
          created_by: currentUser.id,
          name: layoutName.trim() || 'Floor Plan',
          layout_data: elements,
          shared_with_team: sharedWithTeam,
        })
      } else {
        const created = await apiPost('/layouts', {
          event_id: Number(selectedEventId),
          created_by: currentUser.id,
          name: layoutName.trim() || 'Floor Plan',
          layout_data: elements,
          shared_with_team: sharedWithTeam,
        })
        setLayoutId(created.id)
      }
      setMessage('Layout saved successfully.')
      setIsError(false)
    } catch (err) {
      setMessage(err.message || 'Could not save layout.')
      setIsError(true)
    }
  }

  async function toggleShare() {
    if (!layoutId) {
      setMessage('Save the layout first before sharing.')
      setIsError(true)
      return
    }
    const newShared = !sharedWithTeam
    try {
      await apiPatch(`/layouts/${layoutId}/share`, {
        shared_with_team: newShared,
        organizer_id: currentUser.id,
      })
      setSharedWithTeam(newShared)
      setMessage(newShared ? 'Layout shared with the setup team.' : 'Layout is now private.')
      setIsError(false)
    } catch (err) {
      setMessage(err.message || 'Could not update sharing.')
      setIsError(true)
    }
  }

  function exportPNG() {
    const canvas = canvasRef.current
    if (!canvas) return
    const link = document.createElement('a')
    link.download = `${(layoutName || 'layout').replace(/\s+/g, '_')}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  function exportPDF() {
    const canvas = canvasRef.current
    if (!canvas) return
    const imgData = canvas.toDataURL('image/png')
    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(
      `<html><head><title>${layoutName}</title><style>body{margin:0}img{max-width:100%;display:block}</style></head>` +
      `<body><img src="${imgData}"><script>window.onload=function(){window.print()}</script></body></html>`
    )
    win.document.close()
  }

  const selectedEl = elements.find((el) => el.id === selectedId)

  return (
    <div className="workspace-section">
      <div className="section-heading">
        <p className="eyebrow">Event planning</p>
        <h1>Venue Layout Designer</h1>
        <p>Design your floor plan by adding and dragging elements onto the canvas. Save and share with your setup team.</p>
      </div>

      {message && <p className={isError ? 'error-text' : 'status-message'}>{message}</p>}

      <div className="layout-designer">
        <section className="page-panel layout-controls">
          <div className="panel-header"><h2>Settings</h2></div>

          <div className="form">
            <label>
              Event
              <select value={selectedEventId} onChange={(e) => handleEventChange(e.target.value)}>
                <option value="">Select an event</option>
                {events.map((ev) => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
              </select>
            </label>
            <label>
              Layout name
              <input value={layoutName} onChange={(e) => setLayoutName(e.target.value)} />
            </label>
          </div>

          <div className="layout-section-label">Add Elements</div>
          <div className="element-palette">
            {ELEMENT_TYPES.map((t) => (
              <button
                key={t.type}
                type="button"
                className="palette-button secondary-button"
                style={{ borderLeft: `4px solid ${t.color}` }}
                onClick={() => addElement(t.type)}
              >
                {t.label}
              </button>
            ))}
          </div>

          {selectedEl && (
            <>
              <div className="layout-section-label">Selected: {selectedEl.type}</div>
              <div className="form">
                <label>
                  Label
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <input
                      value={editLabel}
                      onChange={(e) => setEditLabel(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') applyLabel() }}
                    />
                    <button type="button" style={{ whiteSpace: 'nowrap', minWidth: 60 }} onClick={applyLabel}>Apply</button>
                  </div>
                </label>
              </div>
              <button type="button" className="danger-button" style={{ width: '100%', marginTop: 4 }} onClick={deleteSelected}>
                Delete Element
              </button>
            </>
          )}

          <div className="layout-actions">
            <button type="button" style={{ width: '100%' }} onClick={saveLayout}>Save Layout</button>
            <button
              type="button"
              style={{ width: '100%' }}
              className={sharedWithTeam ? 'danger-button' : 'secondary-button'}
              onClick={toggleShare}
            >
              {sharedWithTeam ? 'Unshare from Team' : 'Share with Team'}
            </button>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" className="secondary-button" style={{ flex: 1 }} onClick={exportPNG}>Export PNG</button>
              <button type="button" className="secondary-button" style={{ flex: 1 }} onClick={exportPDF}>Export PDF</button>
            </div>
          </div>
        </section>

        <section className="page-panel layout-canvas-panel">
          <div className="panel-header">
            <h2>{layoutName || 'Floor Plan'}</h2>
            {sharedWithTeam && <span className="shared-badge">Shared with team</span>}
          </div>
          <canvas
            ref={canvasRef}
            width={CANVAS_W}
            height={CANVAS_H}
            className="floor-plan-canvas"
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
          />
          <p className="canvas-hint">Click to select · Drag to reposition · Use the left panel to add or delete elements</p>
        </section>
      </div>
    </div>
  )
}

export default OrganizerLayouts
