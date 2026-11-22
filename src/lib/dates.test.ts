import { describe, expect, it } from 'vitest';
import { addDays, dayInZone, daysInRange, isValidDay, resolvePreset, startOfDay } from './dates';

const MEXICO_CITY = 'America/Mexico_City'; // UTC-6, no DST
const CANCUN = 'America/Cancun'; // UTC-5, no DST

describe('isValidDay', () => {
  it('accepts real calendar days and rejects the rest', () => {
    expect(isValidDay('2026-11-19')).toBe(true);
    expect(isValidDay('2028-02-29')).toBe(true);
    expect(isValidDay('2026-02-30')).toBe(false);
    expect(isValidDay('2026-11-9')).toBe(false);
    expect(isValidDay('hoy')).toBe(false);
  });
});

describe('dayInZone', () => {
  it('gives a different day depending on the time zone', () => {
    // 05:30 UTC on Nov 20 is 00:30 on the 20th in Cancún but still 23:30 on the 19th in Mexico City
    const instant = new Date('2026-11-20T05:30:00Z');
    expect(dayInZone(instant, CANCUN)).toBe('2026-11-20');
    expect(dayInZone(instant, MEXICO_CITY)).toBe('2026-11-19');
  });
});

describe('startOfDay', () => {
  it('returns local midnight as a UTC instant', () => {
    expect(startOfDay('2026-11-19', MEXICO_CITY).toISOString()).toBe('2026-11-19T06:00:00.000Z');
    expect(startOfDay('2026-11-19', CANCUN).toISOString()).toBe('2026-11-19T05:00:00.000Z');
  });

  it('handles zones with daylight saving time', () => {
    // New York is UTC-5 in winter and UTC-4 in summer
    expect(startOfDay('2026-01-15', 'America/New_York').toISOString()).toBe('2026-01-15T05:00:00.000Z');
    expect(startOfDay('2026-07-15', 'America/New_York').toISOString()).toBe('2026-07-15T04:00:00.000Z');
  });
});

describe('resolvePreset', () => {
  const today = '2026-11-19'; // a Thursday

  it('resolves each preset relative to today', () => {
    expect(resolvePreset('today', today)).toEqual({ from: '2026-11-19', to: '2026-11-19' });
    expect(resolvePreset('yesterday', today)).toEqual({ from: '2026-11-18', to: '2026-11-18' });
    expect(resolvePreset('week', today)).toEqual({ from: '2026-11-16', to: '2026-11-19' }); // from Monday
    expect(resolvePreset('month', today)).toEqual({ from: '2026-11-01', to: '2026-11-19' });
  });

  it('starts the week on the same day when today is Monday', () => {
    expect(resolvePreset('week', '2026-11-16')).toEqual({ from: '2026-11-16', to: '2026-11-16' });
  });

  it('crosses month and year boundaries', () => {
    expect(resolvePreset('yesterday', '2026-01-01')).toEqual({ from: '2025-12-31', to: '2025-12-31' });
  });
});

describe('addDays and daysInRange', () => {
  it('count calendar days', () => {
    expect(addDays('2026-02-28', 1)).toBe('2026-03-01');
    expect(daysInRange({ from: '2026-11-19', to: '2026-11-19' })).toBe(1);
    expect(daysInRange({ from: '2026-01-01', to: '2026-12-31' })).toBe(365);
  });
});
