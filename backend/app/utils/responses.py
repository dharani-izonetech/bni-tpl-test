from fastapi import Request
from fastapi.responses import JSONResponse
from app.schemas.schemas import ResponseEnvelope


def ok(data=None, message: str = "OK", status_code: int = 200) -> JSONResponse:
    return JSONResponse(
        status_code=status_code,
        content=ResponseEnvelope(success=True, message=message, data=data).model_dump(mode="json"),
    )


def err(message: str = "Error", status_code: int = 400, data=None) -> JSONResponse:
    return JSONResponse(
        status_code=status_code,
        content=ResponseEnvelope(success=False, message=message, data=data).model_dump(mode="json"),
    )
