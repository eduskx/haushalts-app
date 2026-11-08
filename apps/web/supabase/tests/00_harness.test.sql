-- Smoke test for the pgTAP harness. Real table tests live next to their migrations.
begin;
select plan(2);

select has_extension('pgtap', 'pgTAP is available');
select ok(current_setting('server_version_num')::int >= 170000, 'runs on Postgres 17 or newer');

select * from finish();
rollback;
