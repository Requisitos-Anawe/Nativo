
from app.seeds import IdiomaSeed, DiscursoCategoriaSeed, PerfilSeed, ReporteTipoSeed, UsuarioSeed

def main():
    print("Iniciando seed do banco de dados...")

    DiscursoCategoriaSeed.run()
    IdiomaSeed.run()
    # ReporteTipoSeed.run()
    UsuarioSeed.run()
    IdiomaSeed.run()
    PerfilSeed.run()


    print("Seed finalizado com sucesso.")

if __name__ == "__main__":
    main()
