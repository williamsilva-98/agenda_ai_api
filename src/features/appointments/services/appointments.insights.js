function parseMinutes(label) {
  const [hours, minutes] = String(label).split(':').map(Number);
  return hours * 60 + minutes;
}

function endDateTime(day, slot, durationMinutes) {
  const start = parseMinutes(slot);
  const end = start + Number(durationMinutes || 0);
  const dayKeyValue = String(day).slice(0, 10);
  const hours = String(Math.floor(end / 60)).padStart(2, '0');
  const minutes = String(end % 60).padStart(2, '0');
  return new Date(`${dayKeyValue}T${hours}:${minutes}:00`);
}

function isCompleted(appointment, now = new Date()) {
  if (appointment.status === 'completed') return true;
  if (appointment.status === 'cancelled') return false;
  const end = endDateTime(
    appointment.day,
    appointment.slot,
    appointment.durationMinutes,
  );
  return now.getTime() >= end.getTime();
}

const WEEKDAYS = [
  'Domingo',
  'Segunda',
  'Terça',
  'Quarta',
  'Quinta',
  'Sexta',
  'Sábado',
];

const MONTHS = [
  'Jan',
  'Fev',
  'Mar',
  'Abr',
  'Mai',
  'Jun',
  'Jul',
  'Ago',
  'Set',
  'Out',
  'Nov',
  'Dez',
];

function dayKey(value) {
  if (value instanceof Date) {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  return String(value).slice(0, 10);
}

function parseDay(value) {
  const key = dayKey(value);
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function addDays(date, amount) {
  const next = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  next.setDate(next.getDate() + amount);
  return next;
}

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function startOfYear(date) {
  return new Date(date.getFullYear(), 0, 1);
}

function endOfYear(date) {
  return new Date(date.getFullYear(), 11, 31);
}

function percentChange(current, previous) {
  if (previous <= 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

function classify(appointment, now) {
  const status = appointment.status || 'scheduled';
  if (status === 'cancelled') return 'cancelled';
  if (isCompleted(appointment, now)) return 'completed';
  return 'scheduled';
}

function emptyBucket(key, label) {
  return {
    key,
    label,
    revenueCents: 0,
    completedCount: 0,
    scheduledCount: 0,
    cancelledCount: 0,
  };
}

function buildRanges(period, anchorInput) {
  const anchor = parseDay(anchorInput || new Date());

  if (period === 'day') {
    const from = anchor;
    const to = anchor;
    const seriesFrom = addDays(anchor, -6);
    const prevFrom = addDays(anchor, -1);
    const prevTo = prevFrom;
    const series = [];
    for (let offset = 0; offset < 7; offset += 1) {
      const day = addDays(seriesFrom, offset);
      series.push({
        key: dayKey(day),
        label: String(day.getDate()),
        from: day,
        to: day,
      });
    }
    return {
      period: 'day',
      anchor: dayKey(anchor),
      from: dayKey(from),
      to: dayKey(to),
      prevFrom: dayKey(prevFrom),
      prevTo: dayKey(prevTo),
      seriesFrom: dayKey(seriesFrom),
      series,
    };
  }

  if (period === 'year') {
    const from = startOfYear(anchor);
    const to = endOfYear(anchor);
    const prevFrom = startOfYear(new Date(anchor.getFullYear() - 1, 0, 1));
    const prevTo = endOfYear(new Date(anchor.getFullYear() - 1, 0, 1));
    const series = [];
    for (let month = 0; month < 12; month += 1) {
      const start = new Date(anchor.getFullYear(), month, 1);
      const end = endOfMonth(start);
      series.push({
        key: `${anchor.getFullYear()}-${String(month + 1).padStart(2, '0')}`,
        label: MONTHS[month],
        from: start,
        to: end,
      });
    }
    return {
      period: 'year',
      anchor: dayKey(anchor),
      from: dayKey(from),
      to: dayKey(to),
      prevFrom: dayKey(prevFrom),
      prevTo: dayKey(prevTo),
      seriesFrom: dayKey(from),
      series,
    };
  }

  const from = startOfMonth(anchor);
  const to = endOfMonth(anchor);
  const previousMonth = new Date(anchor.getFullYear(), anchor.getMonth() - 1, 1);
  const prevFrom = startOfMonth(previousMonth);
  const prevTo = endOfMonth(previousMonth);
  const series = [];
  const lastDay = to.getDate();
  for (let day = 1; day <= lastDay; day += 1) {
    const current = new Date(anchor.getFullYear(), anchor.getMonth(), day);
    series.push({
      key: dayKey(current),
      label: String(day),
      from: current,
      to: current,
    });
  }
  return {
    period: 'month',
    anchor: dayKey(anchor),
    from: dayKey(from),
    to: dayKey(to),
    prevFrom: dayKey(prevFrom),
    prevTo: dayKey(prevTo),
    seriesFrom: dayKey(from),
    series,
  };
}

function summarize(rows, now) {
  let revenueCents = 0;
  let completedCount = 0;
  let scheduledCount = 0;
  let cancelledCount = 0;
  const weekdayTotals = Array.from({ length: 7 }, () => 0);
  const serviceMap = new Map();

  for (const row of rows) {
    const kind = classify(row, now);
    if (kind === 'cancelled') {
      cancelledCount += 1;
      continue;
    }
    if (kind === 'completed') {
      completedCount += 1;
      revenueCents += Number(row.priceCents || 0);
      const day = parseDay(row.day);
      weekdayTotals[day.getDay()] += 1;
      const name = String(row.serviceName || 'Serviço').trim() || 'Serviço';
      const current = serviceMap.get(name) || {
        serviceName: name,
        count: 0,
        revenueCents: 0,
      };
      current.count += 1;
      current.revenueCents += Number(row.priceCents || 0);
      serviceMap.set(name, current);
      continue;
    }
    scheduledCount += 1;
  }

  const totalCount = completedCount + scheduledCount + cancelledCount;
  const averageTicketCents =
    completedCount > 0 ? Math.round(revenueCents / completedCount) : 0;
  const completionRate =
    completedCount + scheduledCount > 0
      ? Math.round((completedCount / (completedCount + scheduledCount)) * 1000) /
        10
      : 0;

  let busiestDayLabel = null;
  let busiest = 0;
  for (let index = 0; index < weekdayTotals.length; index += 1) {
    if (weekdayTotals[index] > busiest) {
      busiest = weekdayTotals[index];
      busiestDayLabel = WEEKDAYS[index];
    }
  }

  const topServices = [...serviceMap.values()]
    .sort((a, b) => b.revenueCents - a.revenueCents || b.count - a.count)
    .slice(0, 5);

  return {
    revenueCents,
    completedCount,
    scheduledCount,
    cancelledCount,
    totalCount,
    averageTicketCents,
    completionRate,
    busiestDayLabel,
    topServices,
  };
}

function bucketSeries(rows, series, now) {
  const buckets = series.map((item) => emptyBucket(item.key, item.label));
  const indexByKey = new Map(buckets.map((item, index) => [item.key, index]));

  for (const row of rows) {
    const day = parseDay(row.day);
    let key = dayKey(day);
    // year series uses YYYY-MM
    if (series[0] && series[0].key.length === 7) {
      key = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}`;
    }
    const index = indexByKey.get(key);
    if (index == null) continue;
    const kind = classify(row, now);
    if (kind === 'cancelled') {
      buckets[index].cancelledCount += 1;
      continue;
    }
    if (kind === 'completed') {
      buckets[index].completedCount += 1;
      buckets[index].revenueCents += Number(row.priceCents || 0);
      continue;
    }
    buckets[index].scheduledCount += 1;
  }

  return buckets;
}

function buildInsights(rowsCurrent, rowsPrevious, rowsSeries, ranges, now = new Date()) {
  const current = summarize(rowsCurrent, now);
  const previous = summarize(rowsPrevious, now);
  return {
    period: ranges.period,
    anchor: ranges.anchor,
    range: { from: ranges.from, to: ranges.to },
    previousRange: { from: ranges.prevFrom, to: ranges.prevTo },
    revenueCents: current.revenueCents,
    previousRevenueCents: previous.revenueCents,
    revenueChangePercent: percentChange(
      current.revenueCents,
      previous.revenueCents,
    ),
    completedCount: current.completedCount,
    scheduledCount: current.scheduledCount,
    cancelledCount: current.cancelledCount,
    totalCount: current.totalCount,
    averageTicketCents: current.averageTicketCents,
    completionRate: current.completionRate,
    busiestDayLabel: current.busiestDayLabel,
    topServices: current.topServices,
    series: bucketSeries(rowsSeries, ranges.series, now),
  };
}

module.exports = {
  buildRanges,
  buildInsights,
  dayKey,
};
