class AppError(Exception):
    def __init__(
        self,
        detail: str,
        code: str = "APP_ERROR",
        status_code: int = 400,
        fields: dict[str, str] | None = None,
    ) -> None:
        self.detail = detail
        self.code = code
        self.status_code = status_code
        self.fields = fields
        super().__init__(detail)


class NotFoundError(AppError):
    def __init__(self, detail: str = "Resource not found", code: str = "NOT_FOUND") -> None:
        super().__init__(detail=detail, code=code, status_code=404)


class ValidationError(AppError):
    def __init__(
        self,
        detail: str = "Validation failed",
        fields: dict[str, str] | None = None,
    ) -> None:
        super().__init__(
            detail=detail,
            code="VALIDATION_ERROR",
            status_code=422,
            fields=fields or {},
        )
