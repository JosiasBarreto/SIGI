from app.core.database import db
from app.models.base import BaseModel

class Empresa(BaseModel):
    __tablename__ = 'empresa'
    
    nome = db.Column(db.String(150), nullable=False)
    nif = db.Column(db.String(50), nullable=True)
    licenca_empresa = db.Column(db.String(100), nullable=True)
    licenca_aplicacao = db.Column(db.String(100), nullable=True)
    endereco_web = db.Column(db.String(150), nullable=True)
    utiliza_iva = db.Column(db.Boolean, default=False)
    correio_eletronico = db.Column(db.String(150), nullable=True)
    telefone = db.Column(db.String(50), nullable=True)
    telemoveis = db.Column(db.String(100), nullable=True)
    localizacao = db.Column(db.String(255), nullable=True)
    logo = db.Column(db.String(255), nullable=True)
    moeda = db.Column(db.String(10), default='STN')
    tipo_formato_impressao = db.Column(db.String(50), nullable=True)
    numero_whatsapp = db.Column(db.String(50), nullable=True)
    
    def __repr__(self):
        return f"<Empresa {self.nome}>"
