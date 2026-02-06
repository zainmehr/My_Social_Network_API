export function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse({
      body: req.body,
      params: req.params,
      query: req.query
    });

    if (!result.success) {
      return res.status(400).json({
        code: 400,
        message: "Bad Request: validation failed",
        issues: result.error.issues
      });
    }

    req.validated = result.data;
    return next();
  };
}
