from enum import Enum
from app.core.database import db
from datetime import datetime

class EstadoReserva(str, Enum):
    ATIVA = 'Ativa'
    UTILIZADA = 'Utilizada'
    CANCELADA = 'Cancelada'

class ReservaIngrediente(db.Model):
    __tablename__ = 'reservas_ingredientes'

    id = db.Column(db.Integer, primary_key=True)
    ingrediente_id = db.Column(db.Integer, db.ForeignKey('ingredientes.id'), nullable=False)
    pedido_id = db.Column(db.Integer, db.ForeignKey('pedidos.id'), nullable=False)
    quantidade = db.Column(db.Numeric(10, 3), nullable=False)
    data_reserva = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    estado = db.Column(db.Enum(EstadoReserva), default=EstadoReserva.ATIVA)

    ingrediente = db.relationship('Ingrediente')
    pedido = db.relationship('Pedido')
