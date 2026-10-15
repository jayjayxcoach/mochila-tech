/* ============================================================
   MOCHILA TECH — lógica compartida de la product page
   - Rellena precios/stock desde config.js  (data-mt="...")
   - Ofertas por cantidad + resumen del pedido
   - Provincia -> ciudad (ubicaciones.js)
   - Validación (WhatsApp ecuatoriano 09XXXXXXXX)
   - Envío a Google Sheets (Apps Script, fetch no-cors)
   - Pantalla de gracias + enlace a WhatsApp con el pedido
   - Galería, barra sticky, modal, FAQ
   Markup esperado: ver README.md ("Contrato del formulario")
   ============================================================ */
(function () {
  "use strict";
  var C = window.MT_CONFIG || {};
  var P = C.producto || {};
  var money = function (n) { return "$" + Number(n).toFixed(2); };

  /* ---------- 1. Textos dinámicos ---------- */
  var ahorro = (P.precioAncla || 0) - (P.precio || 0);
  var vals = {
    precio: money(P.precio),
    ancla: money(P.precioAncla),
    ahorro: "$" + Math.round(ahorro),   // $60, no $60.01
    ahorroPct: Math.round(ahorro / (P.precioAncla || 1) * 100) + "%",
    stock: P.stock,
    nombre: P.nombre,
    entregaDias: P.entregaDias,
    tienda: C.tienda
  };
  document.querySelectorAll("[data-mt]").forEach(function (el) {
    var k = el.getAttribute("data-mt");
    if (vals[k] !== undefined) el.textContent = vals[k];
  });
  // Enlaces de WhatsApp para preguntas (antes de comprar)
  var preguntaMsg = encodeURIComponent("Hola " + C.tienda + ", tengo una pregunta sobre la " + P.nombre + " de " + money(P.precio) + ".");
  document.querySelectorAll("[data-mt-wa]").forEach(function (a) {
    a.href = "https://wa.me/" + C.whatsapp + "?text=" + preguntaMsg;
    a.target = "_blank"; a.rel = "noopener";
  });

  /* ---------- 2. Formularios ---------- */
  var forms = document.querySelectorAll("form.mt-form");
  forms.forEach(initForm);

  function initForm(form) {
    // Ofertas por cantidad
    var box = form.querySelector(".mt-ofertas");
    if (box && P.ofertas) {
      box.innerHTML = P.ofertas.map(function (o, i) {
        return '<label class="mt-oferta' + (o.destacada ? " is-destacada" : "") + '">' +
          '<input type="radio" name="cantidad" value="' + o.cantidad + '" data-total="' + o.total + '"' + (i === 0 ? " checked" : "") + '>' +
          '<span class="mt-oferta-txt"><strong>' + o.etiqueta + '</strong><small>' + o.nota + '</small></span>' +
          '<span class="mt-oferta-precio">' + money(o.total) + '</span></label>';
      }).join("");
    }
    // Provincias
    var selProv = form.querySelector('select[name="provincia"]');
    var selCity = form.querySelector('select[name="ciudad"]');
    var U = window.MT_UBICACIONES || {};
    if (selProv) {
      Object.keys(U).forEach(function (p) { selProv.add(new Option(p, p)); });
      selProv.addEventListener("change", function () {
        selCity.innerHTML = '<option value="">Ciudad / cantón</option>';
        (U[selProv.value] || []).concat(["Otra ciudad"]).forEach(function (c) { selCity.add(new Option(c, c)); });
        selCity.disabled = !selProv.value;
      });
      if (selCity) selCity.disabled = true;
    }
    // Origen (anuncio) y producto ocultos
    var qs = new URLSearchParams(location.search);
    setHidden(form, "origen", qs.get("utm_source") || qs.get("utm_campaign") || document.referrer || "directo");
    setHidden(form, "producto", P.nombre);
    setHidden(form, "pagina", location.pathname);

    form.addEventListener("change", function () { updateResumen(form); });
    updateResumen(form);

    // Teléfono: solo números
    var tel = form.querySelector('input[name="telefono"]');
    if (tel) tel.addEventListener("input", function () { tel.value = tel.value.replace(/\D/g, "").slice(0, 10); });

    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      enviar(form);
    });
  }

  function setHidden(form, name, value) {
    var i = form.querySelector('input[name="' + name + '"]');
    if (!i) { i = document.createElement("input"); i.type = "hidden"; i.name = name; form.appendChild(i); }
    i.value = value;
  }

  function ofertaActual(form) {
    var r = form.querySelector('input[name="cantidad"]:checked');
    var total = r ? parseFloat(r.getAttribute("data-total")) : P.precio;
    return { cantidad: r ? parseInt(r.value, 10) : 1, total: total };
  }

  function updateResumen(form) {
    var o = ofertaActual(form);
    setHidden(form, "total", o.total.toFixed(2));
    form.querySelectorAll("[data-mt-total]").forEach(function (el) { el.textContent = money(o.total); });
    form.querySelectorAll("[data-mt-subtotal]").forEach(function (el) { el.textContent = money(o.total); });
    form.querySelectorAll("[data-mt-cant]").forEach(function (el) { el.textContent = o.cantidad; });
  }

  function showError(form, msg, field) {
    var e = form.querySelector(".mt-error");
    if (e) { e.textContent = msg; e.hidden = false; }
    if (field) { field.focus(); field.classList.add("is-invalid"); setTimeout(function(){ field.classList.remove("is-invalid"); }, 2500); }
  }

  function enviar(form) {
    var e = form.querySelector(".mt-error"); if (e) e.hidden = true;
    var f = function (n) { return form.querySelector('[name="' + n + '"]'); };
    var nombre = f("nombre"), tel = f("telefono"), prov = f("provincia"), city = f("ciudad"), dir = f("direccion");

    if (!nombre.value.trim() || nombre.value.trim().split(/\s+/).length < 2) return showError(form, "Escribe tu nombre y apellido para la guía de envío.", nombre);
    var telv = tel.value.replace(/\D/g, "");
    if (!/^09\d{8}$/.test(telv)) return showError(form, "Tu WhatsApp debe tener 10 dígitos y empezar con 09 (ej. 0991234567).", tel);
    if (/^(\d)\1{9}$/.test(telv)) return showError(form, "Revisa tu número de WhatsApp, parece incompleto.", tel);
    if (prov && !prov.value) return showError(form, "Elige tu provincia.", prov);
    if (city && !city.value) return showError(form, "Elige tu ciudad o cantón.", city);
    if (dir.value.trim().length < 8) return showError(form, "Escribe tu dirección completa (calle principal y secundaria, o la agencia Servientrega más cercana).", dir);
    var hp = f("empresa"); if (hp && hp.value) return; // bot

    tel.value = telv;
    var btn = form.querySelector('[type="submit"]');
    var btnTxt = btn.innerHTML; btn.disabled = true; btn.innerHTML = "Enviando tu pedido…";

    var o = ofertaActual(form);
    var data = new FormData(form);
    data.set("cantidad", o.cantidad);
    data.set("total", o.total.toFixed(2));

    var done = function () {
      mostrarGracias(form, {
        nombre: nombre.value.trim(), telefono: telv, cantidad: o.cantidad, total: o.total,
        direccion: dir.value.trim(), ciudad: city ? city.value : "", provincia: prov ? prov.value : "",
        referencia: f("referencia") ? f("referencia").value.trim() : ""
      });
      if (window.fbq) { try { fbq("track", "Lead", { value: o.total, currency: "USD", content_name: P.nombre }); } catch (_) {} }
    };

    if (C.scriptUrl) {
      // Petición "simple" (FormData + no-cors): sin preflight; la respuesta es opaca.
      fetch(C.scriptUrl, { method: "POST", mode: "no-cors", body: data })
        .then(done)
        .catch(function () {
          // Si falla la red igual mandamos al cliente a WhatsApp: el pedido no se pierde.
          done();
        });
    } else {
      setTimeout(done, 600);
    }
    setTimeout(function () { btn.disabled = false; btn.innerHTML = btnTxt; }, 4000);
  }

  function mostrarGracias(form, d) {
    var msg = "Hola " + C.tienda + " 👋 Acabo de hacer mi pedido:\n" +
      "• " + d.cantidad + " × " + P.nombre + "\n" +
      "• Total a pagar al recibir: " + money(d.total) + "\n" +
      "• Nombre: " + d.nombre + "\n" +
      "• Entrega: " + d.direccion + (d.referencia ? " (" + d.referencia + ")" : "") + ", " + d.ciudad + ", " + d.provincia + "\n" +
      "Confírmenme por favor ✅";
    var wa = "https://wa.me/" + C.whatsapp + "?text=" + encodeURIComponent(msg);

    var g = document.querySelector(".mt-gracias");
    var holder = form.closest(".mt-form-wrap") || form.parentNode;
    form.hidden = true;
    if (g) {
      holder.appendChild(g); g.hidden = false;
      var n = g.querySelector("[data-mt-gracias-nombre]"); if (n) n.textContent = d.nombre.split(" ")[0];
      var t = g.querySelector("[data-mt-gracias-total]"); if (t) t.textContent = money(d.total);
      var a = g.querySelector(".mt-wa"); if (a) { a.href = wa; a.target = "_blank"; a.rel = "noopener"; }
      g.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    var sticky = document.querySelector(".mt-sticky"); if (sticky) sticky.hidden = true;
    if (C.autoAbrirWhatsapp) setTimeout(function () { window.open(wa, "_blank"); }, 2500);
  }

  /* ---------- 3. Galería ---------- */
  document.querySelectorAll(".mt-gallery").forEach(function (g) {
    var main = g.querySelector(".mt-gallery-main img");
    var thumbs = g.querySelectorAll(".mt-thumbs button");
    var counter = g.querySelector(".mt-gallery-count");
    var i = 0;
    function show(n) {
      i = (n + thumbs.length) % thumbs.length;
      var b = thumbs[i];
      main.src = b.getAttribute("data-src");
      if (b.getAttribute("data-srcset")) main.srcset = b.getAttribute("data-srcset");
      main.alt = b.querySelector("img").alt;
      thumbs.forEach(function (t, k) { t.classList.toggle("is-active", k === i); });
      if (counter) counter.textContent = (i + 1) + " / " + thumbs.length;
    }
    thumbs.forEach(function (b, k) { b.addEventListener("click", function () { show(k); }); });
    g.querySelectorAll("[data-mt-prev]").forEach(function (b) { b.addEventListener("click", function () { show(i - 1); }); });
    g.querySelectorAll("[data-mt-next]").forEach(function (b) { b.addEventListener("click", function () { show(i + 1); }); });
    // swipe
    var x0 = null;
    main.addEventListener("touchstart", function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    main.addEventListener("touchend", function (e) {
      if (x0 === null) return; var dx = e.changedTouches[0].clientX - x0; x0 = null;
      if (Math.abs(dx) > 40) show(dx < 0 ? i + 1 : i - 1);
    });
    show(0);
  });

  /* ---------- 4. Barra sticky: se oculta cuando el formulario está a la vista ---------- */
  var sticky = document.querySelector(".mt-sticky");
  var anchor = document.querySelector("[data-mt-anchor]");
  if (sticky && anchor && "IntersectionObserver" in window) {
    new IntersectionObserver(function (en) {
      sticky.classList.toggle("is-hidden", en[0].isIntersecting);
    }, { threshold: 0.15 }).observe(anchor);
  }

  /* ---------- 5. Modal ---------- */
  var modal = document.getElementById("mt-modal");
  if (modal) {
    var open = function () { modal.hidden = false; document.body.classList.add("mt-modal-open"); var f = modal.querySelector("input[name=nombre]"); };
    var close = function () { modal.hidden = true; document.body.classList.remove("mt-modal-open"); };
    document.querySelectorAll("[data-mt-open]").forEach(function (b) { b.addEventListener("click", function (e) { e.preventDefault(); open(); }); });
    modal.querySelectorAll("[data-mt-close]").forEach(function (b) { b.addEventListener("click", close); });
    modal.addEventListener("click", function (e) { if (e.target === modal) close(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !modal.hidden) close(); });
  }

  /* ---------- 6. Scroll suave a #pedido ---------- */
  document.querySelectorAll('a[href="#pedido"]').forEach(function (a) {
    a.addEventListener("click", function (e) {
      var t = document.getElementById("pedido"); if (!t) return;
      e.preventDefault(); t.scrollIntoView({ behavior: "smooth", block: "start" });
      setTimeout(function () { var n = t.querySelector("input[name=nombre]"); if (n && window.innerWidth > 700) n.focus(); }, 600);
    });
  });
})();
