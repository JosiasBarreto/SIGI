import re
from decimal import Decimal
from typing import Optional, Union, Any
from app.services.importacao.importacao_constants import (
    TIPOS_PRODUTO_PERMITIDOS,
    TIPOS_MATERIAL_PERMITIDOS,
    SERVICOS_PERMITIDOS
)

def normalizar_texto(valor: Any) -> Optional[str]:
    """Remove espaços supérfluos e colapsa múltiplos espaços em branco."""
    if valor is None:
        return None
    texto = str(valor).strip()
    if not texto:
        return None
    # Colapsar múltiplos espaços internos
    return re.sub(r'\s+', ' ', texto)


def normalizar_chave_busca(valor: Any) -> str:
    """Retorna uma chave de comparação minúscula e sem espaços supérfluos."""
    texto = normalizar_texto(valor)
    return texto.lower() if texto else ""


def normalizar_tipo(valor: Any) -> Optional[str]:
    """Valida e normaliza o tipo de item para a grafia oficial."""
    chave = normalizar_chave_busca(valor)
    if not chave:
        return None
    for tipo in TIPOS_PRODUTO_PERMITIDOS:
        if tipo.lower() == chave:
            return tipo
    return None


def normalizar_tipo_material(valor: Any) -> Optional[str]:
    """Normaliza o subtipo de material (Reutilizável ou Consumível)."""
    chave = normalizar_chave_busca(valor)
    if not chave:
        return None
    if chave in ('reutilizavel', 'reutilizável', 'reutil'):
        return 'Reutilizavel'
    if chave in ('consumivel', 'consumível', 'descartavel', 'descartável'):
        return 'Consumivel'
    return None


def normalizar_servico(valor: Any) -> Optional[str]:
    """Normaliza o serviço para maiúsculas aceites."""
    chave = normalizar_chave_busca(valor)
    if not chave:
        return None
    for serv in SERVICOS_PERMITIDOS:
        if serv.lower() == chave:
            return serv
    return None


def normalizar_numero(valor: Any, default: Optional[float] = None) -> Optional[float]:
    """Converte números, inteiros, floats e strings com vírgula para float."""
    if valor is None:
        return default
    if isinstance(valor, (int, float, Decimal)):
        return float(valor)
    texto = str(valor).strip()
    if not texto:
        return default
    # Remover símbolos monetários e espaços
    texto = texto.replace('€', '').replace('$', '').replace('Kz', '').replace('AKZ', '').replace(' ', '')
    # Tratar formato europeu com vírgula decimal (ex: 25,50)
    if ',' in texto and '.' in texto:
        # Ex: 1.250,50 -> remover ponto e trocar vírgula por ponto
        texto = texto.replace('.', '').replace(',', '.')
    elif ',' in texto:
        texto = texto.replace(',', '.')
    try:
        return float(texto)
    except (ValueError, TypeError):
        raise ValueError(f"Valor numérico inválido: '{valor}'")


def normalizar_taxa_iva(valor: Any) -> Optional[float]:
    """Extrai o valor numérico percentual da taxa de IVA (ex: '15%' -> 15.0)."""
    if valor is None:
        return None
    if isinstance(valor, (int, float, Decimal)):
        num = float(valor)
        # Se vier como decimal 0.15, converte para 15
        if 0 < num < 1:
            return num * 100
        return num
    texto = str(valor).strip()
    if not texto:
        return None
    texto = texto.replace('%', '').replace(',', '.').strip()
    if texto.lower() in ('isento', 'isenta', 'sem iva'):
        return 0.0
    try:
        num = float(texto)
        if 0 < num < 1:
            return num * 100
        return num
    except (ValueError, TypeError):
        return None
