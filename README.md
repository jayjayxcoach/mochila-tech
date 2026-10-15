# Mochila Tech — tienda tecnológica (pago contra entrega, todo Ecuador)

Sitio estático (HTML/CSS/JS) para GitHub Pages. Por ahora contiene la product page
de la **Laptop HP Estudiantil** en 3 variaciones para probar con anuncios.

```
mochila-tech/
├── laptop-hp-estudiantil/
│   ├── v1-clara.html      ← blanco/azul premium, formulario junto al precio
│   ├── v2-neon.html       ← oscura con brillo, formulario en ventana
│   └── v3-oferta.html     ← landing larga estilo contraentrega, precio gigante
├── assets/
│   ├── img/               ← fotos en WebP (1200, 800, 480 y miniaturas)
│   └── js/
│       ├── config.js      ← ⚙️ EDITA AQUÍ: WhatsApp, URL del Sheet, precio, stock
│       ├── ubicaciones.js ← provincias y cantones del Ecuador
│       └── pedido.js      ← lógica compartida (formulario, galería, sticky, ventana)
└── google-apps-script/
    └── Code.gs            ← script que guarda los pedidos en Google Sheets
```

## Enlaces (una vez activado GitHub Pages)

- `https://TU-USUARIO.github.io/mochila-tech/laptop-hp-estudiantil/v1-clara.html`
- `https://TU-USUARIO.github.io/mochila-tech/laptop-hp-estudiantil/v2-neon.html`
- `https://TU-USUARIO.github.io/mochila-tech/laptop-hp-estudiantil/v3-oferta.html`

Para medir anuncios agrega `?utm_source=facebook&utm_campaign=laptop1` al final del enlace; se guarda en la columna **Origen** del Sheet.

## Puesta en marcha

1. **WhatsApp**: en `assets/js/config.js` pon tu número en `whatsapp` (formato `593` + número sin el 0).
2. **Google Sheets**: sigue las instrucciones de `google-apps-script/Code.gs` y pega la URL `/exec` en `scriptUrl`.
3. **Stock / precio**: en el mismo `config.js`. El precio ancla ($150) y el ahorro se calculan solos.
4. **Testimonios**: busca `TESTIMONIOS SIMULADOS` en cada página y reemplázalos por los reales.
5. **Specs**: verifica Celeron / 4 GB / 64 GB / Windows 10 / 11.6" contra el equipo real.
6. **GitHub Pages**: en github.com → repositorio → Settings → Pages → Branch `main` / `(root)` → Save.

## Flujo del pedido

1. El cliente llena nombre, WhatsApp, cédula (opcional), provincia → ciudad, dirección y referencia.
2. Se guarda en la hoja **Pedidos** con estado "Pendiente confirmar" y un link de WhatsApp ya redactado para confirmarle.
3. El cliente ve la pantalla de gracias y se le abre WhatsApp con su pedido escrito. Si el Sheet fallara, igual llega por WhatsApp.
4. Confirmas por WhatsApp o llamada, cambias el estado en la hoja y despachas por Servientrega.

## Contrato del formulario (para nuevas páginas de producto)

```html
<form class="mt-form" novalidate>
  <div class="mt-ofertas"></div>
  <input name="nombre"> <input name="telefono" type="tel"> <input name="cedula">
  <select name="provincia"><option value="">Provincia</option></select>
  <select name="ciudad"><option value="">Ciudad / cantón</option></select>
  <input name="direccion"> <input name="referencia">
  <input name="empresa" class="mt-hp" tabindex="-1" autocomplete="off">
  <p class="mt-error" hidden></p>
  <button type="submit">Pedir y pagar al recibir — <span data-mt-total></span></button>
</form>
<div class="mt-gracias" hidden> … <a class="mt-wa">Confirmar por WhatsApp</a></div>
```
Textos dinámicos: `<span data-mt="precio|ancla|ahorro|ahorroPct|stock|nombre|entregaDias">`.
