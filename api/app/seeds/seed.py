from app.seeds import DiscursoCategoriaSeed, ReporteTipoSeed, UsuarioSeed, IdiomaSeed

def main():
    print("Iniciando seed do banco de dados...")

    DiscursoCategoriaSeed.run()
    IdiomaSeed.run()
    # ReporteTipoSeed.run()
    UsuarioSeed.run()

    print("Seed finalizado com sucesso.")

if __name__ == "__main__":
    main()
