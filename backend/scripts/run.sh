#!/bin/bash
export FLASK_APP=run.py
export FLASK_DEBUG=1
export FLASK_ENV=development

echo "🚀 A iniciar o servidor backend localmente em http://127.0.0.1:5000"
flask run --host=127.0.0.1 --port=5000
