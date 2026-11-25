# Despacho VATC CRM

Plataforma CRM de Logística ZOOM, Despacho Nacional, Recepción de Equipos y Base Maestro POS (**BDDIC25**) para **VA Technology Communication (VATC)**, construida con **Next.js 16**, **Tailwind CSS v4** (paleta corporativa Verde Esmeralda `#065f46` / `#059669`) y **Neon Serverless PostgreSQL**.

## Módulos Integrados (desde Google Drive)

1. **SIMCARD / Servicio Técnico / Traslado (`SIMCARD_ST`)**: Envíos de SIMCARD Digitel/Movistar, retornos de taller, traslados internos y guías ZOOM.
2. **Despacho - Generación de Kit (`KIT`)**: Despachos de Kits POS y mercancía nacional con seguimiento de estatus ZOOM.
3. **Despacho - Equipos Nuevos (`EQUIPOS_NUEVOS`)**: Envíos de terminales POS nuevos con control de factura, proceso especial, serial y guía ZOOM.
4. **Recepción de Equipos en Despacho**: Registro de ingresos por guía con checklist de accesorios (`Caja`, `Cargador`, `Batería`, `SIMCARD`, `Rollo`, `Forro`).
5. **Base Maestro POS (`BDDIC25`)**: Directorio indexado de **29,986 terminales POS** por Serial, RIF, Razón Social, Banco, Procesadora (`CREDICARD` / `PLATCO`), Plan y Estatus, con autocompletado directo al crear despachos.
6. **Resultados & Dashboard**: KPIs y gráficas ejecutivas en tiempo real.

## Ejecución Local

```bash
npm install
npm run seed
npm run dev
```

Acceso inicial: `admin@vatc.com` / `Admin2026!`
