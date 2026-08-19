alter table public.ad_slots drop constraint if exists ad_slots_position_key;
alter table public.ad_slots add column if not exists block_no integer;
with ord as (
  select id, row_number() over (order by created_at) as rn from public.ad_slots
)
update public.ad_slots a set block_no = ord.rn from ord where ord.id = a.id and a.block_no is null;
insert into public.ad_slots (block_no, position, label, enabled, code)
select g, '', 'Bloco ' || g, false, ''
from generate_series(1, 16) g
where not exists (select 1 from public.ad_slots s where s.block_no = g);
alter table public.ad_slots alter column block_no set not null;
create unique index if not exists ad_slots_block_no_key on public.ad_slots (block_no);