alter table service_types add column if not exists default_price numeric(10,2);

-- Precios sugeridos en los servicios globales
update service_types set default_price = 5000 where name = 'Corte'      and barbershop_id is null;
update service_types set default_price = 4000 where name = 'Barba'      and barbershop_id is null;
update service_types set default_price = 7000 where name = 'Corte + Barba' and barbershop_id is null;
update service_types set default_price = 2000 where name = 'Cejas'      and barbershop_id is null;
update service_types set default_price = 3000 where name = 'Afeitado'   and barbershop_id is null;
