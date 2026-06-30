const original = document.getElementById("original");
const originalResaltado = document.getElementById("original-resaltado");
const entrada = document.getElementById("entrada");
const resultado = document.getElementById("resultado");
const tiempoDiv = document.getElementById("tiempo");
const palabrasDiv = document.getElementById("palabras");
const progresoDiv = document.getElementById("progreso");

const btnIniciar = document.getElementById("iniciar");
const btnPausar = document.getElementById("pausar");
const btnReiniciar = document.getElementById("reiniciar");
const opcionesTiempo = document.getElementById("opciones-tiempo");

const alarmaSonido = new Audio('sonidos/campanilla.mp3');

const fondoSonido = new Audio('sonidos/teclas-351701.mp3');
fondoSonido.loop = true;

let inicio = null;
let intervalo = null;
let tiempoAcumulado = 0;
let enPausa = false;
let textoBase = "";
let palabrasOriginales = [];
let tiempoLimite = 0;
let audioPermitido = false;
let contadorTick = 0;

// Cuántos ticks de 100ms deben pasar entre cada recálculo de PPM/precisión.
// 100ms x 5 = 500ms: suficiente para que se vea fluido sin recalcular 10 veces por segundo.
const TICKS_POR_RECALCULO = 5;

// Funciones
function formatearTiempo(ms) {
    const segundos = Math.floor(ms / 1000);
    const minutos = Math.floor(segundos / 60);
    const segundosRestantes = segundos % 60;
    const segundosFormateados = segundosRestantes < 10 ? `0${segundosRestantes}` : segundosRestantes;
    return `${minutos}:${segundosFormateados}`;
}

function actualizarTiempo() {
    if (!inicio) return;

    const ahora = new Date();
    const tiempoTranscurridoMs = tiempoAcumulado + (ahora - inicio);

    if (tiempoLimite > 0) {
        let tiempoRestanteMs = tiempoLimite * 1000 - tiempoTranscurridoMs;
        if (tiempoRestanteMs <= 0) {
            tiempoDiv.innerHTML = "⏱ Tiempo restante: 0:00";
            manejarFinDeTiempo();
            return;
        }
        tiempoDiv.innerHTML = `⏱ Tiempo restante: ${formatearTiempo(tiempoRestanteMs)}`;
    } else {
        tiempoDiv.innerHTML = `⏱ Tiempo: ${formatearTiempo(tiempoTranscurridoMs)}`;
    }

    // El PPM y la precisión no necesitan recalcularse 10 veces por segundo:
    // se recalculan cada TICKS_POR_RECALCULO ticks para ahorrar trabajo.
    contadorTick++;
    if (contadorTick % TICKS_POR_RECALCULO === 0) {
        actualizarProgreso();
    }
}

function iniciarIntervalo() {
    inicio = new Date();
    intervalo = setInterval(actualizarTiempo, 100);
}

function iniciar() {
    if (inicio || textoBase.length === 0) return;

    // El audio solo se "desbloquea" una vez, no en cada inicio/reanudación.
    if (!audioPermitido) {
        audioPermitido = true;
        alarmaSonido.play().then(() => {
            alarmaSonido.pause();
            alarmaSonido.currentTime = 0;
        }).catch(error => {
            console.error("No se pudo precargar el audio de alarma:", error);
        });
    }

    fondoSonido.play().catch(error => {
        console.error("No se pudo precargar el audio de fondo:", error);
    });

    iniciarIntervalo();
    entrada.disabled = false;
    entrada.focus();
    btnIniciar.disabled = true;
    btnPausar.disabled = false;
    btnReiniciar.disabled = false;
    opcionesTiempo.disabled = true;
    entrada.classList.remove("incorrecto");

    // Bloqueamos el texto original para que no se pueda editar a mitad de la práctica
    // (antes era posible y rompía la comparación de palabras).
    original.disabled = true;
    original.classList.add("oculto");
    originalResaltado.classList.remove("oculto");
    resaltarTexto();
}

function pausar() {
    if (!enPausa) {
        clearInterval(intervalo);
        tiempoAcumulado += new Date() - inicio;
        inicio = null;
        enPausa = true;
        btnPausar.textContent = "▶ Reanudar";
        entrada.disabled = true;
        fondoSonido.pause();
    } else {
        iniciarIntervalo();
        enPausa = false;
        btnPausar.textContent = "⏸ Pausar";
        entrada.disabled = false;
        entrada.focus();
        fondoSonido.play().catch(() => {});
    }
}

function reiniciar() {
    clearInterval(intervalo);
    inicio = null;
    tiempoAcumulado = 0;
    enPausa = false;
    contadorTick = 0;

    entrada.value = "";
    entrada.disabled = true;
    entrada.classList.remove("correcto", "incorrecto");

    resultado.innerHTML = "";
    tiempoDiv.innerHTML = "⏱ Tiempo: 0:00";
    palabrasDiv.innerHTML = `📖 Palabras: 0/${palabrasOriginales.length} | ✅ Correctas: 0`;
    progresoDiv.innerHTML = "💨 PPM: 0 | 🎯 Precisión: 0%";

    btnIniciar.disabled = palabrasOriginales.length === 0;
    btnPausar.disabled = true;
    btnPausar.textContent = "⏸ Pausar";
    btnReiniciar.disabled = true;
    opcionesTiempo.disabled = false;

    // Devolvemos el textarea original a su estado editable
    original.disabled = false;
    original.classList.remove("oculto");
    originalResaltado.classList.add("oculto");
    originalResaltado.innerHTML = "";

    fondoSonido.pause();
    fondoSonido.currentTime = 0;
}

function actualizarProgreso() {
    const escrito = entrada.value.trim();
    const palabrasEscritas = escrito.split(/\s+/).filter(p => p.length > 0);
    const tiempoTranscurrido = (tiempoAcumulado + (inicio ? new Date() - inicio : 0)) / 1000 / 60;
    let correctas = 0;

    for (let i = 0; i < palabrasEscritas.length; i++) {
        if (palabrasOriginales[i] && palabrasEscritas[i] === palabrasOriginales[i]) {
            correctas++;
        }
    }

    const ppm = tiempoTranscurrido > 0 ? (correctas / tiempoTranscurrido).toFixed(2) : "0.00";
    const precision = palabrasEscritas.length > 0 ? ((correctas / palabrasEscritas.length) * 100).toFixed(2) : "0.00";

    palabrasDiv.innerHTML = `📖 Palabras: ${palabrasEscritas.length}/${palabrasOriginales.length} | ✅ Correctas: ${correctas}`;
    progresoDiv.innerHTML = `💨 PPM: ${ppm} | 🎯 Precisión: ${precision}%`;
}

function resaltarTexto() {
    const escrito = entrada.value;
    const palabrasEscritas = escrito.split(/\s+/);
    let htmlTextoOriginal = "";
    let esCorrecto = true;

    for (let i = 0; i < palabrasOriginales.length; i++) {
        const palabra = palabrasOriginales[i];
        const palabraEscrita = palabrasEscritas[i];

        if (palabraEscrita) {
            if (palabraEscrita === palabra) {
                htmlTextoOriginal += `<span class="palabra-correcta">${palabra}</span> `;
            } else {
                htmlTextoOriginal += `<span class="palabra-incorrecta">${palabra}</span> `;
                esCorrecto = false;
            }
        } else {
            htmlTextoOriginal += `${palabra} `;
        }
    }
    // Antes esto escribía en un <textarea>, que no renderiza HTML.
    // Ahora se escribe en el div de resaltado, que sí lo muestra.
    originalResaltado.innerHTML = htmlTextoOriginal;

    if (esCorrecto) {
        entrada.classList.remove("incorrecto");
        entrada.classList.add("correcto");
    } else {
        entrada.classList.remove("correcto");
        entrada.classList.add("incorrecto");
    }
}

function calcularResultadoFinal(tiempoTotalSegundos) {
    const palabrasEscritas = entrada.value.trim().split(/\s+/).filter(p => p.length > 0);
    const correctas = palabrasEscritas.filter((p, i) => p === palabrasOriginales[i]).length;
    const tiempoTotalMinutos = tiempoTotalSegundos / 60;
    const ppm = tiempoTotalMinutos > 0 ? (correctas / tiempoTotalMinutos).toFixed(2) : "0.00";
    const precision = palabrasEscritas.length > 0 ? ((correctas / palabrasEscritas.length) * 100).toFixed(2) : "0.00";
    return { palabrasEscritas, correctas, ppm, precision };
}

function manejarFinDeTiempo() {
    clearInterval(intervalo);
    entrada.disabled = true;
    btnPausar.disabled = true;

    const tiempoTotal = tiempoAcumulado / 1000 + (inicio ? (new Date() - inicio) / 1000 : 0);
    const { palabrasEscritas, correctas, ppm, precision } = calcularResultadoFinal(tiempoLimite);

    inicio = null;
    alarmaSonido.play().catch(() => {});
    fondoSonido.pause();
    fondoSonido.currentTime = 0;

    resultado.innerHTML = `
        ⏱ ¡Tiempo terminado!<br>
        📖 Palabras totales: <span class="info-destacada">${palabrasEscritas.length}</span><br>
        ✅ Palabras correctas: <span class="info-destacada">${correctas}</span><br>
        💨 Velocidad: <span class="info-destacada">${ppm} PPM</span><br>
        🎯 Precisión: <span class="info-destacada">${precision}%</span>
    `;
    opcionesTiempo.disabled = false;
}

// Eventos
btnIniciar.addEventListener("click", iniciar);
btnPausar.addEventListener("click", pausar);
btnReiniciar.addEventListener("click", reiniciar);

original.addEventListener("input", () => {
    textoBase = original.value.trim();
    palabrasOriginales = textoBase.split(/\s+/).filter(p => p.length > 0);
    palabrasDiv.innerHTML = `📖 Palabras: 0/${palabrasOriginales.length} | ✅ Correctas: 0`;
    btnIniciar.disabled = palabrasOriginales.length === 0;
});

entrada.addEventListener("input", () => {
    actualizarProgreso();
    resaltarTexto();

    if (entrada.value.trim() === textoBase) {
        clearInterval(intervalo);
        alarmaSonido.play().catch(() => {});
        fondoSonido.pause();
        fondoSonido.currentTime = 0;

        const tiempoTotal = tiempoAcumulado / 1000 + (inicio ? (new Date() - inicio) / 1000 : 0);
        const { palabrasEscritas, correctas, ppm, precision } = calcularResultadoFinal(tiempoTotal);
        inicio = null;

        resultado.innerHTML = `
            🎉 ¡Texto completado!<br>
            ⏱ Tiempo total: <span class="info-destacada">${tiempoTotal.toFixed(2)} segundos</span><br>
            📖 Palabras totales: <span class="info-destacada">${palabrasEscritas.length}</span><br>
            ✅ Palabras correctas: <span class="info-destacada">${correctas}</span><br>
            💨 Velocidad: <span class="info-destacada">${ppm} PPM</span><br>
            🎯 Precisión: <span class="info-destacada">${precision}%</span>
        `;
        entrada.disabled = true;
        btnPausar.disabled = true;
        opcionesTiempo.disabled = false;
    }
});

opcionesTiempo.addEventListener("change", (e) => {
    tiempoLimite = parseInt(e.target.value) * 60;
    reiniciar();
});

// Inicialización
window.onload = () => {
    entrada.disabled = true;
    btnPausar.disabled = true;
    btnReiniciar.disabled = true;
    btnIniciar.disabled = true;
};
