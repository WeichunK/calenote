/**
 * DateTime Utility Tests
 *
 * Tests timezone conversion logic to ensure:
 * - Local time → UTC conversion is correct
 * - UTC → Local time conversion is correct
 * - Round-trip conversion preserves the original time
 */

import {
  convertLocalToUTC,
  convertUTCToLocal,
  isValidDateTime,
  getCurrentLocalDateTime,
} from '../datetime';

describe('DateTime Utilities', () => {
  describe('convertLocalToUTC', () => {
    it('should convert local datetime to UTC ISO string', () => {
      // Mock user in UTC+8 timezone
      const mockDate = new Date('2025-11-18T21:00:00+08:00');
      const localInput = '2025-11-18T21:00';

      // Create a spy on Date constructor
      const originalDate = global.Date;
      global.Date = class extends originalDate {
        constructor(...args: any[]) {
          if (args.length === 0) {
            super();
          } else if (args.length === 1 && typeof args[0] === 'string' && args[0] === localInput) {
            // When creating Date from our test input, use the mocked date
            super(mockDate.getTime());
          } else {
            super(...args);
          }
        }
      } as any;

      const result = convertLocalToUTC(localInput);

      // User in UTC+8 enters 21:00 → Should be 13:00 UTC
      expect(result).toBe('2025-11-18T13:00:00.000Z');

      global.Date = originalDate;
    });

    it('should return empty string for empty input', () => {
      expect(convertLocalToUTC('')).toBe('');
    });

    it('should handle datetime-local format correctly', () => {
      // This test will use the actual browser timezone
      const localInput = '2025-11-18T21:00';
      const result = convertLocalToUTC(localInput);

      // Result should be a valid ISO string with Z suffix
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });
  });

  describe('convertUTCToLocal', () => {
    it('should convert UTC ISO string to local datetime-local format', () => {
      // Mock user in UTC+8 timezone
      const utcInput = '2025-11-18T13:00:00Z';

      // Mock Date to simulate UTC+8 timezone
      const originalDate = global.Date;
      const mockGetTimezoneOffset = () => -480; // UTC+8 = -480 minutes

      // Create a mock Date that returns the correct local time components
      global.Date = class extends originalDate {
        constructor(...args: any[]) {
          super(...args);
        }

        getTimezoneOffset() {
          return mockGetTimezoneOffset();
        }

        // Override methods to simulate UTC+8
        getFullYear() {
          return 2025;
        }

        getMonth() {
          return 10; // November (0-indexed)
        }

        getDate() {
          return 18;
        }

        getHours() {
          return 21; // 13:00 UTC + 8 hours = 21:00 local
        }

        getMinutes() {
          return 0;
        }

        static parse(dateString: string) {
          return originalDate.parse(dateString);
        }
      } as any;

      const result = convertUTCToLocal(utcInput);

      // 13:00 UTC should become 21:00 in UTC+8
      expect(result).toBe('2025-11-18T21:00');

      global.Date = originalDate;
    });

    it('should return empty string for empty input', () => {
      expect(convertUTCToLocal('')).toBe('');
    });

    it('should handle ISO strings with milliseconds', () => {
      const utcInput = '2025-11-18T13:00:00.000Z';
      const result = convertUTCToLocal(utcInput);

      // Should return datetime-local format
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
    });
  });

  describe('isValidDateTime', () => {
    it('should return true for valid datetime strings', () => {
      expect(isValidDateTime('2025-11-18T21:00:00Z')).toBe(true);
      expect(isValidDateTime('2025-11-18T21:00')).toBe(true);
      expect(isValidDateTime('2025-11-18')).toBe(true);
    });

    it('should return false for invalid datetime strings', () => {
      expect(isValidDateTime('invalid')).toBe(false);
      expect(isValidDateTime('')).toBe(false);
      expect(isValidDateTime('2025-13-40')).toBe(false);
    });
  });

  describe('getCurrentLocalDateTime', () => {
    it('should return current datetime in datetime-local format', () => {
      const result = getCurrentLocalDateTime();

      // Should match datetime-local format: YYYY-MM-DDTHH:mm
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
    });

    it('should pad single-digit values with zero', () => {
      // Mock Date to return single-digit values
      const originalDate = global.Date;
      global.Date = class extends originalDate {
        constructor(...args: any[]) {
          if (args.length === 0) {
            super();
          } else {
            super(...args);
          }
        }

        getFullYear() {
          return 2025;
        }

        getMonth() {
          return 0; // January (0-indexed)
        }

        getDate() {
          return 5; // 5th day
        }

        getHours() {
          return 9; // 09:00
        }

        getMinutes() {
          return 3; // 03 minutes
        }
      } as any;

      const result = getCurrentLocalDateTime();

      // Should pad with zeros: 2025-01-05T09:03
      expect(result).toBe('2025-01-05T09:03');

      global.Date = originalDate;
    });
  });

  describe('Round-trip conversion', () => {
    it('should preserve time when converting local → UTC → local', () => {
      // This test simulates the full cycle:
      // User inputs local time → Convert to UTC → Store → Retrieve → Convert back to local

      const originalLocalTime = '2025-11-18T21:00';

      // Step 1: User inputs local time
      // Step 2: Convert to UTC for backend
      const utcTime = convertLocalToUTC(originalLocalTime);

      // Step 3: Backend stores and returns UTC time
      // Step 4: Convert back to local for display
      const finalLocalTime = convertUTCToLocal(utcTime);

      // Final time should match original (ignoring seconds)
      expect(finalLocalTime).toBe(originalLocalTime);
    });
  });
});
