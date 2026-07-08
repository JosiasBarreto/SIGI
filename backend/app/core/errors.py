from flask import jsonify
from werkzeug.exceptions import HTTPException
from app.services.audit_service import AuditService
from flask_jwt_extended import get_jwt_identity

def register_error_handlers(app):
    @app.errorhandler(Exception)
    def handle_exception(e):
        # We need to extract the user_id if available, though get_jwt_identity could fail if out of context
        user_id = None
        try:
            user_id = get_jwt_identity()
        except:
            pass

        # If it's a known HTTP exception
        if isinstance(e, HTTPException):
            if e.code >= 500:
                AuditService.log_erro("HTTPException", str(e), user_id=user_id)
            return jsonify({
                "success": False,
                "message": e.description if hasattr(e, 'description') else "Erro no servidor",
                "error_code": f"SIGI_{e.code}",
                "details": {}
            }), e.code
            
        # Log unexpected errors
        AuditService.log_erro("Exception", str(e), user_id=user_id)
        return jsonify({
            "success": False,
            "message": "Erro interno do servidor.",
            "error_code": "SIGI_500",
            "details": {"exception": str(e)}
        }), 500

class ApiResponse:
    @staticmethod
    def success(data=None, message="Operação realizada com sucesso", status=200):
        return jsonify({
            "success": True,
            "message": message,
            "data": data if data is not None else {}
        }), status
        
    @staticmethod
    def paginated(items, page, per_page, total, pages, status=200):
        return jsonify({
            "success": True,
            "data": items,
            "pagination": {
                "page": page,
                "per_page": per_page,
                "total": total,
                "pages": pages
            }
        }), status
