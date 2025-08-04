# API: Aplicativo tradutor de línguas indígenas

É necessário ter a chave json do firebase na pasta credentials

É necessário configurar o .env com o bucket do firestore 

``` bash
pip install -r requirements.txt
.\.venv\Scripts\activate # source .venv/bin/activate
flask run --host=0.0.0.0 --port=5000
``` 

## Seeds

``` bash
python -m app.seeds.seed
``` 