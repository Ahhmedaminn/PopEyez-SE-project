import { useEffect, useState } from 'react'

const monthNames = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

function pad(value) {
  return String(value).padStart(2, '0')
}

function parseDate(value) {
  if (!value) {
    return { year: '', month: '', day: '' }
  }

  const [year, month, day] = value.split('-')
  return { year, month, day }
}

function dateToNumber(value) {
  if (!value) {
    return null
  }

  return Number(value.replaceAll('-', ''))
}

function getDaysInMonth(year, month) {
  if (!year || !month) {
    return 31
  }

  return new Date(Number(year), Number(month), 0).getDate()
}

function getYearOptions(minYear, maxYear) {
  const years = []

  for (let year = minYear; year <= maxYear; year += 1) {
    years.push(year)
  }

  return years
}

function buildDate(year, month, day) {
  if (!year || !month || !day) {
    return ''
  }

  return `${year}-${pad(month)}-${pad(day)}`
}

function DateSelect({
  value,
  onChange,
  minYear = 2024,
  maxYear = 2035,
  minDate = '',
  required = false,
  allowEmpty = true,
}) {
  const [selected, setSelected] = useState(() => parseDate(value))

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelected(parseDate(value))
  }, [value])

  const daysInMonth = getDaysInMonth(selected.year, selected.month)
  const selectedDay = selected.day && Number(selected.day) > daysInMonth ? '' : selected.day
  const minDateParts = parseDate(minDate)
  const minDateNumber = dateToNumber(minDate)
  const effectiveMinYear = minDateParts.year ? Math.max(minYear, Number(minDateParts.year)) : minYear

  function isBeforeMinDate(year, month, day) {
    const date = buildDate(year, month, day)
    const dateNumber = dateToNumber(date)
    return minDateNumber && dateNumber && dateNumber < minDateNumber
  }

  function updateDate(part, nextValue) {
    const next = {
      ...selected,
      day: selectedDay,
      [part]: nextValue,
    }

    const nextDaysInMonth = getDaysInMonth(next.year, next.month)
    if (next.day && Number(next.day) > nextDaysInMonth) {
      next.day = ''
    }

    if (next.year && next.month && minDateParts.year === next.year && Number(next.month) < Number(minDateParts.month)) {
      next.month = ''
      next.day = ''
    }

    if (next.year && next.month && next.day && isBeforeMinDate(next.year, next.month, next.day)) {
      next.day = ''
    }

    setSelected(next)
    onChange(buildDate(next.year, next.month, next.day))
  }

  return (
    <div className="date-select">
      <select value={selected.year} onChange={(event) => updateDate('year', event.target.value)} required={required}>
        {allowEmpty && <option value="">Year</option>}
        {getYearOptions(effectiveMinYear, maxYear).map((year) => (
          <option key={year} value={year}>{year}</option>
        ))}
      </select>

      <select value={selected.month} onChange={(event) => updateDate('month', event.target.value)} required={required}>
        {allowEmpty && <option value="">Month</option>}
        {monthNames.map((month, index) => {
          const monthValue = pad(index + 1)
          const disabled = selected.year && minDateParts.year === selected.year && Number(monthValue) < Number(minDateParts.month)

          return <option key={month} value={monthValue} disabled={disabled}>{month}</option>
        })}
      </select>

      <select value={selectedDay} onChange={(event) => updateDate('day', event.target.value)} required={required}>
        {allowEmpty && <option value="">Day</option>}
        {Array.from({ length: daysInMonth }, (_, index) => index + 1).map((day) => (
          <option key={day} value={pad(day)} disabled={isBeforeMinDate(selected.year, selected.month, pad(day))}>{day}</option>
        ))}
      </select>
    </div>
  )
}

export default DateSelect
