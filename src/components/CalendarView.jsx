import React, { useMemo, useState } from 'react';
import './CalendarView.css';

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date, delta) {
  return new Date(date.getFullYear(), date.getMonth() + delta, 1);
}

function getCalendarDays(current) {
  const start = startOfMonth(current);
  const startWeekday = start.getDay(); // 0 (Sun) - 6 (Sat)
  const days = [];

  // Fill leading blanks
  for (let i = 0; i < startWeekday; i += 1) {
    days.push(null);
  }

  const month = current.getMonth();
  let d = new Date(start);
  while (d.getMonth() === month) {
    days.push(new Date(d));
    d.setDate(d.getDate() + 1);
  }

  return days;
}

function getStatusClass(issue) {
  const status = issue?.status || '';
  if (status === 'to_do' || status === 'to-do' || status === 'pending') {
    return 'todo';
  }
  if (status === 'in_progress' || status === 'in-progress' || status === 'in_review') {
    return 'in-progress';
  }
  if (status === 'done' || status === 'completed') {
    return 'completed';
  }
  return 'default';
}

function CalendarView({ project, issues }) {
  const [currentMonth, setCurrentMonth] = useState(() => startOfMonth(new Date()));

  const issuesByDate = useMemo(() => {
    const map = new Map();
    (issues || []).forEach((issue) => {
      if (!issue.due_date) return;
      const key = new Date(issue.due_date).toISOString().slice(0, 10); // YYYY-MM-DD
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(issue);
    });
    return map;
  }, [issues]);

  const days = getCalendarDays(currentMonth);
  const monthLabel = currentMonth.toLocaleString(undefined, {
    month: 'long',
    year: 'numeric',
  });

  const handlePrevMonth = () => setCurrentMonth((d) => addMonths(d, -1));
  const handleNextMonth = () => setCurrentMonth((d) => addMonths(d, 1));

  const todayKey = new Date().toISOString().slice(0, 10);

  return (
    <div className="calendar-view">
      <div className="calendar-header">
        <div>
          <h1>{project?.name || 'Calendar'}</h1>
          <p>Tasks and issues by due date</p>
        </div>
        <div className="calendar-nav">
          <button type="button" onClick={handlePrevMonth} className="calendar-nav-btn">
            ‹
          </button>
          <span className="calendar-month-label">{monthLabel}</span>
          <button type="button" onClick={handleNextMonth} className="calendar-nav-btn">
            ›
          </button>
        </div>
      </div>

      <div className="calendar-grid-wrap">
        <div className="calendar-weekdays">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
            <div key={d} className="calendar-weekday">
              {d}
            </div>
          ))}
        </div>
        <div className="calendar-grid">
        {days.map((day, index) => {
          if (!day) {
            return <div key={`blank-${index}`} className="calendar-day blank" />;
          }
          const key = day.toISOString().slice(0, 10);
          const dayIssues = issuesByDate.get(key) || [];
          const isToday = key === todayKey;

          return (
            <div
              key={key}
              className={`calendar-day${isToday ? ' today' : ''}`}
            >
              <div className="calendar-day-header">
                <span className="calendar-day-number">{day.getDate()}</span>
                {dayIssues.length > 0 && (
                  <span className="calendar-day-count">{dayIssues.length}</span>
                )}
              </div>
              {dayIssues.length > 0 && (
                <ul className="calendar-day-issues">
                  {dayIssues.slice(0, 3).map((issue) => {
                    const statusClass = getStatusClass(issue);
                    return (
                      <li
                        key={issue.id}
                        title={issue.summary}
                        className={`calendar-issue-pill calendar-issue-${statusClass}`}
                      >
                        <span className="calendar-issue-key">{issue.issue_key}</span>
                        <span className="calendar-issue-summary">{issue.summary}</span>
                      </li>
                    );
                  })}
                  {dayIssues.length > 3 && (
                    <li className="calendar-more">+{dayIssues.length - 3} more</li>
                  )}
                </ul>
              )}
            </div>
          );
        })}
        </div>
      </div>
    </div>
  );
}

export default CalendarView;

