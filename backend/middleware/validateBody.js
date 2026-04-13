function validateBody(schema) {
    return (req, res, next) => {
        const result = schema.safeParse(req.body);

        if (!result.success) {
            const firstMessage = result.error.issues[0]?.message || 'Invalid request body';
            return res.status(400).json({
                error: firstMessage,
                details: result.error.issues.map((issue) => ({
                    path: issue.path.join('.') || 'body',
                    message: issue.message
                }))
            });
        }

        req.body = result.data;
        return next();
    };
}

module.exports = validateBody;
