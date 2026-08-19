-- Executado automaticamente pelo Postgres na PRIMEIRA vez que o container sobe.
-- O banco controle_financeiro ja e criado via POSTGRES_DB no docker-compose.yml;
-- aqui criamos o banco separado usado pelos testes automatizados.
CREATE DATABASE controle_financeiro_test;
