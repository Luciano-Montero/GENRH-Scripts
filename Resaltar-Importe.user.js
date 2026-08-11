// ==UserScript==
// @name         Resaltar palabra + etiqueta
// @namespace    Luciano Montero
// @version      1.2
// @description  Resalta una palabra específica y agrega un texto 
// @match        https://genrrhh-gtf.nomadesoft.com.ar/GENRRHHDOCENTES/servlet/com.rh.lqnovedadesleg*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function () {
    'use strict';

    // Cadena de texto a buscar
    const palabra = "Importe/Valor";

    // Texto que aparece
    const textoExtra = "⚠️ NO TOCAR";

    // Color de fondo
    const colorFondo = "yellow";

    // Color del texto de la palabra resaltada
    const colorTexto = "black";

    // Color del texto extra (la etiqueta "no tocar")
    const colorTextoExtra = "red";

    const sensibleMayusculas = false;

    // Texto a la derecha de palabra
    const separacionTexto = 15;

    // Función principal: recorre el HTML buscando la palabra y la resalta
    function resaltarTexto(nodo) {
        // Creamos la expresión de búsqueda (regex) según la palabra configurada
        // "g" = busca todas las coincidencias, no solo la primera
        // "i" = ignora mayúsculas/minúsculas (se agrega si sensibleMayusculas es false)
        const regex = new RegExp(`(${palabra})`, sensibleMayusculas ? "g" : "gi");

        // Función interna que recorre todos los elementos del HTML de forma recursiva
        function recorrer(nodo) {

            // Caso 1: el nodo es texto plano (por ejemplo, el contenido de un párrafo)
            if (nodo.nodeType === Node.TEXT_NODE) {

                // Si el texto contiene la palabra que buscamos...
                if (regex.test(nodo.textContent)) {

                    // Creamos un contenedor nuevo (span) para reemplazar ese texto
                    const span = document.createElement("span");

                    // Reemplazamos la palabra encontrada por:
                    // 1) <mark> = la palabra resaltada con color de fondo
                    // 2) <span> = el texto extra al lado, con la separación configurada
                    span.innerHTML = nodo.textContent.replace(
                        regex,
                        `<mark style="background:${colorFondo}; color:${colorTexto};">$1</mark>` +
                        `<span style="color:${colorTextoExtra}; font-weight:bold; margin-left:${separacionTexto}px;">${textoExtra}</span>`
                    );

                    // Reemplazamos el texto original de la página por nuestro nuevo contenido
                    nodo.replaceWith(span);
                }

            // Caso 2: el nodo es un elemento HTML (div, p, span, etc.)
            } else if (
                nodo.nodeType === Node.ELEMENT_NODE &&
                // Evitamos entrar en scripts, estilos, campos de texto o nuestras propias etiquetas
                !["SCRIPT", "STYLE", "TEXTAREA", "MARK"].includes(nodo.tagName)
            ) {
                // Convertimos los hijos a un array (por seguridad, ya que vamos a modificarlos)
                // y llamamos a la función de nuevo para cada uno (recursividad)
                Array.from(nodo.childNodes).forEach(recorrer);
            }
        }

        // Arrancamos el recorrido desde el nodo que nos pasaron
        recorrer(nodo);
    }

    // Ejecutamos el resaltado una primera vez sobre toda la página al cargar
    resaltarTexto(document.body);

    // ============================
    // DETECCIÓN DE CONTENIDO NUEVO (páginas dinámicas, AJAX, scroll infinito, etc.)
    // ============================

    // Un "observer" vigila la página por si se agrega contenido nuevo después de cargar
    // (por ejemplo, si el sitio carga más info al hacer scroll, sin recargar la página)
    const observer = new MutationObserver((mutaciones) => {
        mutaciones.forEach((m) => {
            m.addedNodes.forEach((n) => {
                // Si se agregó un elemento o texto nuevo, lo procesamos también
                if (n.nodeType === Node.ELEMENT_NODE || n.nodeType === Node.TEXT_NODE) {
                    resaltarTexto(n);
                }
            });
        });
    });

    // Le decimos al observer que vigile todo el <body> y todos sus hijos/descendientes
    observer.observe(document.body, { childList: true, subtree: true });

})();
