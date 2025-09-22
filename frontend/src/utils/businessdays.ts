import dayjs from 'dayjs'

export function businessDaysDiff(start: string, end: string) {
  let from = dayjs(start)
  const to = dayjs(end)

  let diff = 1

  if (from.isSame(to, 'day')) return diff

  while (from.isBefore(to)) {
    if (!(from.day() in [0, 6])) {
      diff++
    }

    from = from.add(1, 'd')
  }

  return diff
}
