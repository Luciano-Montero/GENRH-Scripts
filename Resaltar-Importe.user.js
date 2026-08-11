// ==UserScript==
// @name         Resaltar IMPORTE
// @namespace    Luciano Montero
// @version      2.0
// @description  Resalta Importe y envia cartel de advertencia
// @match        https://genrrhh-gtf.nomadesoft.com.ar/GENRRHHDOCENTES/servlet/com.rh.lqnovedadesleg*
// @updateURL    https://github.com/Luciano-Montero/GENRH-Scripts/raw/refs/heads/main/Resaltar-Importe.user.js
// @downloadURL  https://github.com/Luciano-Montero/GENRH-Scripts/raw/refs/heads/main/Resaltar-Importe.user.js
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function () {
    'use strict';

    const palabra = "Importe/Valor";
    const textoExtra = "⚠️ NO TOCAR";

    // Color Resaltado
    const colorFondo = "yellow";
    const colorTexto = "black";
    const colorTextoExtra = "red";
    const separacionTexto = 15; // píxeles de separación del texto extra

    // true = distingue mayúsculas/minúsculas
    const sensibleMayusculas = false;

    // ID Campo Importe
    const idCampo = "W0002LQNVIMPORTE";
    const valorInicial = "0,00";

    // Mensaje que se muestra al cambiar valor de Importe
    const mensajeAviso = () =>
        `⚠️ Este importe fue modificado durante esta sesión.<br>Recargue la página`;

    // Color de fondo de Campo Importe
    const colorFondoCampoModificado = "#F09595";

    // Resaltar Importe/Valor

    function resaltarTexto(nodo) {
        const regex = new RegExp(`(${palabra})`, sensibleMayusculas ? "g" : "gi");

        function recorrer(nodo) {
            if (nodo.nodeType === Node.TEXT_NODE) {
                if (regex.test(nodo.textContent)) {
                    const span = document.createElement("span");
                    span.innerHTML = nodo.textContent.replace(
                        regex,
                        `<mark class="script-resaltado" style="background:${colorFondo}; color:${colorTexto};">$1</mark>` +
                        `<span style="color:${colorTextoExtra}; font-weight:bold; margin-left:${separacionTexto}px;">${textoExtra}</span>`
                    );
                    nodo.replaceWith(span);
                }
            } else if (
                nodo.nodeType === Node.ELEMENT_NODE &&
                !["SCRIPT", "STYLE", "TEXTAREA", "MARK"].includes(nodo.tagName)
            ) {
                Array.from(nodo.childNodes).forEach(recorrer);
            }
        }

        recorrer(nodo);
    }


    // Creacion de Banner persistente

    function crearBanner() {
        let banner = document.getElementById("script-banner-advertencia");
        if (!banner) {
            banner = document.createElement("div");
            banner.id = "script-banner-advertencia";
            banner.style.position = "fixed";
            banner.style.top = "0";
            banner.style.left = "0";
            banner.style.right = "0";
            banner.style.zIndex = "999999";
            banner.style.background = "#B00020";
            banner.style.color = "white";
            banner.style.padding = "10px 16px";
            banner.style.fontFamily = "Arial, sans-serif";
            banner.style.fontSize = "14px";
            banner.style.fontWeight = "bold";
            banner.style.textAlign = "center";
            banner.style.lineHeight = "1.4";
            banner.style.boxShadow = "0 2px 6px rgba(0,0,0,0.3)";
            banner.style.display = "none"; // oculto hasta que haya un cambio real
            document.body.appendChild(banner);
            // Empujamos el contenido de la página un poco hacia abajo cuando el banner está visible
            document.body.style.transition = "padding-top 0.2s ease";
        }
        return banner;
    }

    // Muestra el banner
    function mostrarBannerPersistente(texto) {
        const banner = crearBanner();
        banner.innerHTML = texto; // innerHTML (no textContent) para que el <br> funcione como salto de línea
        if (banner.style.display === "none") {
            banner.style.display = "block";
            document.body.style.paddingTop = banner.offsetHeight + "px";
        }
    }

    // Deja el campo Importe marcado con fondo rojo de forma fija
    function marcarCampoModificado(campo) {
        campo.style.backgroundColor = colorFondoCampoModificado;
    }


    // Funcion para detectar cambio de importe

    function vigilarCampo() {
        const campo = document.getElementById(idCampo);

        // Si el campo todavía no cargó en la página, o ya lo estamos vigilando, no hacemos nada
        if (!campo || campo.dataset.vigilado === "true") return;
        campo.dataset.vigilado = "true";

        // Guardamos si ya se disparó la advertencia en esta sesión de la página.
        // Una vez en true, queda en true pase lo que pase (hasta recargar la página).
        let yaSeModifico = false;

        function chequearCambio() {
            const valorActual = campo.value;

            // Si el campo ya no tiene el valor original, marcamos que hubo un cambio
            if (valorActual !== valorInicial) {
                yaSeModifico = true;
            }

            // Si en algún momento de esta sesión hubo un cambio (aunque ahora esté
            // de nuevo en el valor original), la advertencia se mantiene fija.
            if (yaSeModifico) {
                mostrarBannerPersistente(mensajeAviso());
                marcarCampoModificado(campo); // se re-aplica en cada evento del usuario, por si el campo cambia varias veces
            }
        }

        // Solo se dispara por usuario
        campo.addEventListener("input", chequearCambio);
        campo.addEventListener("change", chequearCambio);
    }


    // Ejecuccion
    resaltarTexto(document.body);
    vigilarCampo();

    // Por si la página carga contenido nuevo dinámicamente (AJAX, scroll, etc.)
    const observerPagina = new MutationObserver((mutaciones) => {
        mutaciones.forEach((m) => {
            m.addedNodes.forEach((n) => {
                if (n.nodeType === Node.ELEMENT_NODE || n.nodeType === Node.TEXT_NODE) {
                    resaltarTexto(n);
                }
            });
        });
        vigilarCampo();
    });

    observerPagina.observe(document.body, { childList: true, subtree: true });

})();
