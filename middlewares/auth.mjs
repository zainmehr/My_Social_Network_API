import jwt from "jsonwebtoken";
import config from "../config.mjs";

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const [type, token] = header.split(" ");

  if (type !== "Bearer" || !token) {
    return res.status(401).json({ code: 401, message: "Unauthorized: missing Bearer token" });
  }

  try {
    const payload = jwt.verify(token, config.jwt.secret);
    req.auth = payload; // { sub, role }
    return next();
  } catch {
    return res.status(401).json({ code: 401, message: "Unauthorized: invalid/expired token" });
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.auth?.role) {
      return res.status(403).json({ code: 403, message: "Forbidden: no role" });
    }
    if (!roles.includes(req.auth.role)) {
      return res.status(403).json({ code: 403, message: "Forbidden: insufficient role" });
    }
    return next();
  };
}
