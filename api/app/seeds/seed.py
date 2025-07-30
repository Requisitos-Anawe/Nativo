from app.seeds import DiscursoCategoriaSeed, PerfilSeed, ReporteTipoSeed, UsuarioSeed

def main():
    print("Iniciando seed do banco de dados...")

    DiscursoCategoriaSeed.run()
    PerfilSeed.run()
    ReporteTipoSeed.run()
    UsuarioSeed.run()

    print("Seed finalizado com sucesso.")

if __name__ == "__main__":
    main()
