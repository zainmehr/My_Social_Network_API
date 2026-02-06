import { logError } from "../utils/logger.mjs";

export function notFound(req, res) {
  return res.status(404).json({ code: 404, message: "Not Found" });
}

export function errorHandler(err, req, res, next) {
  logError(err);

  // Erreurs mongoose courantes
  if (err?.name === "ValidationError") {
    return res.status(400).json({ code: 400, message: "ValidationError", details: err.message });
  }
  if (err?.code === 11000) {
    return res.status(409).json({
      code: 409,
      message: "Conflict: duplicate key",
      details: err.keyValue
    });
  }

  return res.status(500).json({ code: 500, message: "Internal Server Error" });
}
