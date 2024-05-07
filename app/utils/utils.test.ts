import { formatDuration, validateEmail } from "./utils.ts";

test("validateEmail returns false for non-emails", () => {
  expect(validateEmail(undefined)).toBe(false);
  expect(validateEmail(null)).toBe(false);
  expect(validateEmail("")).toBe(false);
  expect(validateEmail("not-an-email")).toBe(false);
  expect(validateEmail("n@")).toBe(false);
});

test("validateEmail returns true for emails", () => {
  expect(validateEmail("kody@example.com")).toBe(true);
});

test("formatDuration return valid format", () => {
  expect(formatDuration(0)).toBe("00:00");
  expect(formatDuration(1)).toBe("00:01");
  expect(formatDuration(62)).toBe("01:02");
  expect(formatDuration(3600)).toBe("01:00:00");
  expect(formatDuration(7280)).toBe("02:01:20");
});

test("formatDuration throws error for negative duration", () => {
  expect(() => formatDuration(-1)).toThrow();
});
