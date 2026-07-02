# API: Aplicativo tradutor de línguas indígenas

É necessário ter a chave json do firebase na pasta credentials

É necessário configurar o .env com o bucket do firestore e JWT secret

``` bash
pip install -r requirements.txt # pip freeze > requirements.txt
.\.venv\Scripts\activate # source .venv/bin/activate
python run.py
``` 

## Seeds

``` bash
python -m app.seeds.seed
``` 

## Testes

> unittest.TestCase

Exemplo:

``` bash
python -m unittest tests/test_discurso_route.py
``` 

## Rotas

A documentação na rota é disponibilizada em ambiente de desenvolvimento via swagger

http://localhost:5000/apidocs/#/