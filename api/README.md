# API: Aplicativo tradutor de línguas indígenas

É necessário ter a chave json do firebase na pasta credentials

É necessário configurar o .env com o bucket do firestore e JWT secret

``` bash
pip install -r requirements.txt
.\.venv\Scripts\activate # source .venv/bin/activate
python run.py
``` 

## Seeds

``` bash
python -m app.seeds.seed
``` 