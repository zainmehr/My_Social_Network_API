import rateLimit from "express-rate-limit";

export function makeRateLimiter({ windowMs, max }) {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false
  });
}
