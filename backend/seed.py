from app import create_app
from app.core.database import db
from app.models.user import User, RoleEnum
from werkzeug.security import generate_password_hash, check_password_hash

app = create_app()

def seed_db():
    with app.app_context():
        db.create_all()
        
        admin_email = "admin@saborimbativel.com"
        if not User.query.filter_by(email=admin_email).first():
            hashed_pw = generate_password_hash("admin123")
            admin = User(
                name="System Administrator",
                email=admin_email,
                password_hash=hashed_pw,
                role=RoleEnum.ADMINISTRADOR
            )
            db.session.add(admin)
            db.session.commit()
            print("Database seeded with default Admin user.")
        else:
            print("Admin user already exists.")
            
        # Seed Formas de Pagamento
        from app.models.financeiro import FormaPagamento
        formas_padrao = ["Dinheiro", "Multicaixa", "Transferência", "Cheque", "TPA"]
        for nome in formas_padrao:
            if not FormaPagamento.query.filter_by(nome=nome).first():
                db.session.add(FormaPagamento(nome=nome, ativo=True))
        db.session.commit()
        print("Database seeded with default Formas de Pagamento.")

if __name__ == "__main__":
    seed_db()
