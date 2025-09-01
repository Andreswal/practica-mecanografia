const original = document.getElementById("original");
const entrada = document.getElementById("entrada");
const resultado = document.getElementById("resultado");
const tiempoDiv = document.getElementById("tiempo");
const palabrasDiv = document.getElementById("palabras");
const progresoDiv = document.getElementById("progreso");
const textoOriginalDiv = document.getElementById("textoOriginal");

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

// Funciones
function actualizarTiempo() {
    if (inicio) {
        const ahora = new Date();
        let tiempoTranscurridoMs = tiempoAcumulado + (ahora - inicio);

        if (tiempoLimite > 0) {
            let tiempoRestanteMs = tiempoLimite * 1000 - tiempoTranscurridoMs;
            if (tiempoRestanteMs <= 0) {
                tiempoRestanteMs = 0;
                manejarFinDeTiempo();
            }

            const segundos = Math.floor(tiempoRestanteMs / 1000);
            const minutos = Math.floor(segundos / 60);
            const segundosRestantes = segundos % 60;
            const segundosFormateados = segundosRestantes < 10 ? `0${segundosRestantes}` : segundosRestantes;
            tiempoDiv.innerHTML = `⏱ Tiempo restante: ${minutos}:${segundosFormateados}`;
        } else {
            const segundos = Math.floor(tiempoTranscurridoMs / 1000);
            const minutos = Math.floor(segundos / 60);
            const segundosRestantes = segundos % 60;
            const segundosFormateados = segundosRestantes < 10 ? `0${segundosRestantes}` : segundosRestantes;
            tiempoDiv.innerHTML = `⏱ Tiempo: ${minutos}:${segundosFormateados}`;
        }
        actualizarProgreso();
    }
}

function iniciar() {
    if (!inicio && textoBase.length > 0) {
        
        alarmaSonido.play().then(() => {
            alarmaSonido.pause();
            alarmaSonido.currentTime = 0;
        }).catch(error => {
            console.error("No se pudo precargar el audio de alarma:", error);
        });

        fondoSonido.play().catch(error => {
            console.error("No se pudo precargar el audio de fondo:", error);
        });

        inicio = new Date();
        intervalo = setInterval(actualizarTiempo, 100);
        entrada.disabled = false;
        entrada.focus();
        btnIniciar.disabled = true;
        btnPausar.disabled = false;
        btnReiniciar.disabled = false;
        opcionesTiempo.disabled = true;
        entrada.classList.remove("incorrecto");
    }
}

function pausar() {
    if (!enPausa) {
        clearInterval(intervalo);
        tiempoAcumulado += new Date() - inicio;
        inicio = null;
        enPausa = true;
        btnPausar.textContent = "▶ Reanudar";
        entrada.disabled = true;
        fondoSonido.pause(); // Pausar el sonido
    } else {
        iniciar();
        enPausa = false;
        btnPausar.textContent = "⏸ Pausar";
        entrada.disabled = false;
        fondoSonido.play(); // Reanudar el sonido
    }
}

function reiniciar() {
    clearInterval(intervalo);
    inicio = null;
    tiempoAcumulado = 0;
    enPausa = false;
    entrada.value = "";
    entrada.disabled = true;
    resultado.innerHTML = "";
    tiempoDiv.innerHTML = "⏱ Tiempo: 0:00";
    palabrasDiv.innerHTML = `📖 Palabras: 0/${palabrasOriginales.length} | ✅ Correctas: 0`;
    progresoDiv.innerHTML = "💨 PPM: 0 | 🎯 Precisión: 0%";
    btnIniciar.disabled = false;
    btnPausar.disabled = true;
    btnReiniciar.disabled = true;
    opcionesTiempo.disabled = false;
    resaltarTexto();
    fondoSonido.pause(); 
    fondoSonido.currentTime = 0; 
}

function actualizarProgreso() {
    const escrito = entrada.value.trim();
    const palabrasEscritas = escrito.split(/\s+/).filter(p => p.length > 0);
    const tiempoTranscurrido = (tiempoAcumulado + (new Date() - inicio)) / 1000 / 60;
    let correctas = 0;

    
    for (let i = 0; i < palabrasEscritas.length; i++) {
        
        if (palabrasOriginales[i] && palabrasEscritas[i] === palabrasOriginales[i]) {
            correctas++;
        }
    }

    const ppm = tiempoTranscurrido > 0 ? (correctas / tiempoTranscurrido).toFixed(2) : 0;
    const precision = palabrasEscritas.length > 0 ? ((correctas / palabrasEscritas.length) * 100).toFixed(2) : 0;

    palabrasDiv.innerHTML = `📖 Palabras: ${palabrasEscritas.length}/${palabrasOriginales.length} | ✅ Correctas: ${correctas}`;
    progresoDiv.innerHTML = `💨 PPM: ${ppm} | 🎯 Precisión: ${precision}%`;
}

function resaltarTexto() {
    const escrito = entrada.value;
    const palabrasEscritas = escrito.split(/\s+/);
    let htmlTextoOriginal = "";
    let esCorrecto = true;

    for (let i = 0; i < palabrasOriginales.length; i++) {
        let palabra = palabrasOriginales[i];
        let palabraEscrita = palabrasEscritas[i];

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
    original.innerHTML = htmlTextoOriginal;

    if (esCorrecto) {
        entrada.classList.remove("incorrecto");
        entrada.classList.add("correcto");
    } else {
        entrada.classList.remove("correcto");
        entrada.classList.add("incorrecto");
    }
}

function manejarFinDeTiempo() {
    clearInterval(intervalo);
    entrada.disabled = true;
    btnPausar.disabled = true;
    alarmaSonido.play(); 
    const palabrasEscritas = entrada.value.trim().split(/\s+/).filter(p => p.length > 0);
    const correctas = palabrasEscritas.filter((p, i) => p === palabrasOriginales[i]).length;
    const ppm = (correctas / (tiempoLimite / 60)).toFixed(2);
    const precision = ((correctas / palabrasEscritas.length) * 100).toFixed(2);
    alarmaSonido.play();
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
        alarmaSonido.play();
        fondoSonido.pause();
        fondoSonido.currentTime = 0;

        const tiempoTotal = (tiempoAcumulado + (new Date() - inicio)) / 1000;
        const palabrasEscritas = entrada.value.trim().split(/\s+/).filter(p => p.length > 0);
        const correctas = palabrasEscritas.filter((p, i) => p === palabrasOriginales[i]).length;
        const tiempoTotalMinutos = tiempoTotal / 60;
        const ppm = (correctas / tiempoTotalMinutos).toFixed(2);
        const precision = ((correctas / palabrasEscritas.length) * 100).toFixed(2);
        
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