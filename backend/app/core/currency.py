def get_system_currency_code() -> str:
    from app.models.empresa import Empresa

    empresa = Empresa.query.first()
    moeda = str(empresa.moeda or "").strip() if empresa else ""
    return moeda or "STN"
