update plans
set features = '[
  "Hasta 6 barberos activos",
  "Ventas y Gastos",
  "Estadísticas básicas",
  "Soporte vía WhatsApp"
]'::jsonb
where id = 'base';

update plans
set features = '[
  "Barberos ilimitados",
  "Gestión de Equipo (Roles)",
  "Exportación de datos (Excel)",
  "Soporte prioritario"
]'::jsonb
where id = 'pro';

update plans
set features = '[
  "Todo lo de Pro",
  "Predicción de demanda con IA",
  "Alertas inteligentes de stock",
  "Consultoría de negocio"
]'::jsonb
where id = 'expert';
