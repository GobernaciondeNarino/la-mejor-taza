-- Datos iniciales para "La Mejor Taza" (8 stands del prototipo).
-- Compatible con MySQL/MariaDB y SQLite (sintaxis básica común).
INSERT INTO stands (id, nombre, municipio, region, direccion, correo, descripcion, coords_x, coords_y, color, votos_bueno, votos_regular, votos_malo)
VALUES
('st-01', 'Finca El Tambo', 'La Unión', 'Norte de Nariño', 'Calle 5 #3-21, La Unión', 'contacto@fincaeltambo.co',
 'Caficultura de altura, proceso lavado. Tres generaciones cultivando en laderas del Patía.', 0.42, 0.38, 'oklch(0.42 0.09 50)', 127, 14, 3),
('st-02', 'Café Galeras', 'Pasto', 'Centro de Nariño', 'Cra 24 #18-44, Pasto', 'hola@cafegaleras.com',
 'Tostado en Pasto a la sombra del volcán. Notas a chocolate y panela.', 0.55, 0.52, 'oklch(0.45 0.11 30)', 203, 21, 5),
('st-03', 'Sindamanoy', 'Sandoná', 'Occidente', 'Parque principal, Sandoná', 'info@sindamanoy.co',
 'Cooperativa de 34 familias. Microlotes de variedad Caturra y Castillo.', 0.38, 0.48, 'oklch(0.52 0.09 145)', 98, 19, 4),
('st-04', 'Juanambú', 'Buesaco', 'Valle de Juanambú', 'Vereda Alto Ijagui, Buesaco', 'juanambu@correo.co',
 'Proceso honey y natural. Finca a 1.900 msnm.', 0.50, 0.34, 'oklch(0.48 0.1 60)', 156, 11, 2),
('st-05', 'Tumaqueño', 'Tumaco', 'Costa Pacífica', 'Malecón, Tumaco', 'cafe@tumaqueno.co',
 'Fusión: caña panela tumaqueña + café de altura nariñense.', 0.18, 0.72, 'oklch(0.5 0.1 200)', 74, 22, 8),
('st-06', 'Chimangual', 'Samaniego', 'Sur', 'Vereda Chimangual, Samaniego', 'chimangual@correo.co',
 'Caficultura orgánica certificada. Proceso fermentado anaeróbico.', 0.32, 0.62, 'oklch(0.4 0.08 120)', 189, 8, 1),
('st-07', 'Guambuyaco', 'El Peñol', 'Norte', 'El Peñol, Nariño', 'guambuyaco@correo.co',
 'Microtostadora familiar. Despulpado manual, secado al sol.', 0.44, 0.42, 'oklch(0.45 0.1 40)', 112, 17, 4),
('st-08', 'Doña Lucía', 'Chachagüí', 'Centro', 'Vía aeropuerto, Chachagüí', 'donalucia@correo.co',
 'Café de finca única. Variedad Bourbon rosado, edición limitada.', 0.52, 0.46, 'oklch(0.55 0.12 20)', 241, 6, 0);
