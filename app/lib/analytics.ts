import { RoleClickEvent } from './types';

const MAX_EVENTS = 200;
const events: RoleClickEvent[] = [];

export function recordRoleClick(event: Omit<RoleClickEvent, 'timestamp'>): RoleClickEvent {
  const entry: RoleClickEvent = {
    ...event,
    timestamp: new Date().toISOString(),
  };

  events.push(entry);
  if (events.length > MAX_EVENTS) {
    events.splice(0, events.length - MAX_EVENTS);
  }

  return entry;
}

export function getRecentRoleClicks(limit = 25): RoleClickEvent[] {
  return events.slice(-limit).reverse();
}

