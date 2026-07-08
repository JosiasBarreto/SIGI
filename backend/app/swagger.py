def build_swagger_template(app):
    return {
        "swagger": "2.0",
        "info": {
            "title": "API Documentation",
            "description": "API documentation for the backend.",
            "version": "1.0.0"
        },
        "basePath": "/",
        "schemes": [
            "http",
            "https"
        ]
    }
