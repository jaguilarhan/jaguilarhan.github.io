/**
 * Módulo de Integración con el Cuaderno de Obra Digital de INFOBRAS
 * Gestión de Asientos, Bandeja de Observaciones del Inspector y Respuestas Técnicas.
 */

let infobrasAsientos = [];
let infobrasCargado = false;

// Clave en localStorage para no sobrecargar Firebase ni la red
const STORAGE_KEY_INFOBRAS = 'infobras_asientos_cache_v1';
const STORAGE_KEY_OBS_STATUS = 'infobras_obs_status_v1'; // { asientoNum: 'respondido' | 'pendiente' | 'descartado' }

/**
 * Inicializa y carga los asientos (desde caché local o desde el archivo del proyecto)
 */
async function cargarAsientosInfobras() {
  if (infobrasCargado && infobrasAsientos.length > 0) return infobrasAsientos;

  // 1. Intentar desde LocalStorage
  const cached = localStorage.getItem(STORAGE_KEY_INFOBRAS);
  if (cached) {
    try {
      infobrasAsientos = JSON.parse(cached);
      infobrasCargado = true;
      actualizarBadgeObservaciones();
      return infobrasAsientos;
    } catch (e) {
      console.warn("Error leyendo caché de Infobras:", e);
    }
  }

  // 2. Si no hay caché, cargar el JSON estructurado del proyecto
  try {
    const resp = await fetch('DATA_EXPEDIENTE/asientos_infobras.json');
    if (resp.ok) {
      infobrasAsientos = await resp.json();
      localStorage.setItem(STORAGE_KEY_INFOBRAS, JSON.stringify(infobrasAsientos));
      infobrasCargado = true;
      actualizarBadgeObservaciones();
      return infobrasAsientos;
    }
  } catch (err) {
    console.warn("No se pudo cargar DATA_EXPEDIENTE/asientos_infobras.json:", err);
  }

  return infobrasAsientos;
}

/**
 * Obtiene el estado de las observaciones guardado localmente
 */
function getObservacionesStatus() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY_OBS_STATUS) || '{}');
  } catch (e) {
    return {};
  }
}

/**
 * Actualiza el estado de una observación (pendiente, respondido, descartado)
 */
function setObservacionStatus(asientoNum, status) {
  const st = getObservacionesStatus();
  st[asientoNum] = status;
  localStorage.setItem(STORAGE_KEY_OBS_STATUS, JSON.stringify(st));
  actualizarBadgeObservaciones();
  renderBandejaObservaciones();
}

/**
 * Extrae las observaciones realizadas por el Inspector
 */
function obtenerObservacionesInspector() {
  const statusMap = getObservacionesStatus();
  const res = [];

  infobrasAsientos.forEach(a => {
    if (a.rol !== 'INSPECTOR') return;

    const descLower = (a.descripcion || '').toLowerCase();
    const tienePalabrasClave = descLower.includes('observ') || descLower.includes('solicita') || descLower.includes('aclarar') || descLower.includes('deberá') || descLower.includes('debera');
    const tieneOcurrencias = !!(a.ocurrencias && a.ocurrencias.trim());
    const refiereAsientos = (a.asientos_referidos && a.asientos_referidos.length > 0);

    if (tienePalabrasClave || tieneOcurrencias || refiereAsientos) {
      let estado = statusMap[a.numero] || 'pendiente';
      
      // Extraer fragmento específico de observación o usar ocurrencias
      let textoObs = a.ocurrencias || '';
      if (!textoObs) {
        const lineas = (a.descripcion || '').split('\n');
        const relevantes = lineas.filter(l => {
          const ll = l.toLowerCase();
          return ll.includes('observ') || ll.includes('solicita') || ll.includes('aclarar') || ll.includes('asiento n');
        });
        textoObs = relevantes.join('\n').trim() || a.descripcion.substring(0, 300);
      }

      res.push({
        numero: a.numero,
        fecha: a.fecha_asiento,
        autor: a.autor,
        titulo: a.titulo,
        asientos_referidos: a.asientos_referidos || [],
        texto_observacion: textoObs,
        descripcion_completa: a.descripcion,
        estado: estado
      });
    }
  });

  return res.reverse(); // Más recientes primero
}

/**
 * Actualiza el contador visible en el botón de la barra superior
 */
function actualizarBadgeObservaciones() {
  const badge = document.getElementById('badge-infobras-obs');
  if (!badge) return;
  const obs = obtenerObservacionesInspector();
  const pendientes = obs.filter(o => o.estado === 'pendiente').length;
  if (pendientes > 0) {
    badge.innerText = pendientes;
    badge.style.display = 'inline-block';
  } else {
    badge.style.display = 'none';
  }
}

/**
 * Abre el modal de Infobras
 */
async function abrirModalInfobras() {
  await cargarAsientosInfobras();
  let modal = document.getElementById('modal-infobras');
  if (!modal) {
    crearModalInfobrasDOM();
    modal = document.getElementById('modal-infobras');
  }
  cambiarTabInfobras('obs');
  modal.classList.add('active');
}

function cerrarModalInfobras() {
  const modal = document.getElementById('modal-infobras');
  if (modal) modal.classList.remove('active');
}

function cambiarTabInfobras(tabName) {
  document.querySelectorAll('.tab-infobras-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab-infobras-content').forEach(c => c.style.display = 'none');

  const btn = document.getElementById(`tab-btn-${tabName}`);
  const content = document.getElementById(`tab-content-${tabName}`);
  if (btn) btn.classList.add('active');
  if (content) content.style.display = 'block';

  if (tabName === 'obs') renderBandejaObservaciones();
  else if (tabName === 'asientos') renderListaAsientos();
  else if (tabName === 'descargas') renderTabDescargas();
}

/**
 * Renderiza la Bandeja de Observaciones del Inspector
 */
function renderBandejaObservaciones() {
  const ctn = document.getElementById('infobras-obs-list');
  if (!ctn) return;

  const obs = obtenerObservacionesInspector();
  if (obs.length === 0) {
    ctn.innerHTML = '<div style="text-align:center; padding:30px; color:#666;">No se encontraron observaciones del Inspector registradas.</div>';
    return;
  }

  let html = '';
  obs.forEach(o => {
    const esPendiente = o.estado === 'pendiente';
    const esRespondido = o.estado === 'respondido';
    const bg = esPendiente ? '#fff9f0' : (esRespondido ? '#f1f8e9' : '#f5f5f5');
    const border = esPendiente ? '#ffb74d' : (esRespondido ? '#81c784' : '#bdbdbd');
    const badgeColor = esPendiente ? '#e65100' : (esRespondido ? '#2e7d32' : '#757575');
    const badgeTxt = esPendiente ? '🔴 PENDIENTE' : (esRespondido ? '🟢 RESPONDIDO' : '⚪ SOLO CONOCIMIENTO');

    let refHtml = '';
    if (o.asientos_referidos.length > 0) {
      refHtml = `<div style="margin:4px 0; font-size:8.5pt; color:#0d47a1; font-weight:600;">
        Observa a los Asientos del Residente: N° ${o.asientos_referidos.join(', ')}
      </div>`;
    }

    html += `
      <div style="background:${bg}; border:1px solid ${border}; border-radius:6px; padding:12px; margin-bottom:12px; box-shadow:0 1px 4px rgba(0,0,0,0.05);">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:6px;">
          <div>
            <strong style="color:#0d47a1; font-size:10pt;">Asiento N° ${o.numero} — ${o.titulo}</strong>
            <span style="font-size:8.5pt; color:#666; margin-left:8px;">📅 ${o.fecha} | Inspector: ${o.autor}</span>
          </div>
          <span style="font-size:8pt; font-weight:bold; color:${badgeColor}; background:rgba(255,255,255,0.8); border:1px solid ${border}; padding:2px 8px; border-radius:10px;">${badgeTxt}</span>
        </div>
        ${refHtml}
        <div style="background:#fff; border:1px solid #e0e0e0; border-radius:4px; padding:8px 10px; margin:8px 0; font-size:9pt; line-height:1.45; white-space:pre-wrap; max-height:160px; overflow-y:auto; color:#222;">${esc(o.texto_observacion)}</div>
        <div style="display:flex; gap:8px; align-items:center; justify-content:flex-end; flex-wrap:wrap; margin-top:6px;">
          <button type="button" class="btn" style="background:#0d47a1; color:#fff; font-size:8pt; padding:4px 10px;" onclick="responderObservacionEnCuaderno(${o.numero})">📝 Responder en Asiento de Hoy</button>
          <button type="button" class="btn" style="background:#2e7d32; color:#fff; font-size:8pt; padding:4px 10px;" onclick="setObservacionStatus(${o.numero}, 'respondido')">✓ Marcar Respondido</button>
          <button type="button" class="btn" style="background:#757575; color:#fff; font-size:8pt; padding:4px 8px;" onclick="setObservacionStatus(${o.numero}, 'descartado')">Ignorar</button>
          <button type="button" class="btn" style="background:#e0e0e0; color:#333; font-size:8pt; padding:4px 8px;" onclick="verAsientoDetalleModal(${o.numero})">Ver Completo</button>
        </div>
      </div>
    `;
  });

  ctn.innerHTML = html;
}

/**
 * Inserta la respuesta en el cuaderno de obra para la fecha actualmente seleccionada
 */
function responderObservacionEnCuaderno(asientoNum) {
  const obs = infobrasAsientos.find(a => a.numero === asientoNum);
  if (!obs) return;

  // Fecha destino: la fecha del filtro "Hasta" o la fecha actual
  let fechaDestino = document.getElementById('rep-hasta') ? document.getElementById('rep-hasta').value : '';
  if (!fechaDestino) {
    fechaDestino = new Date().toISOString().split('T')[0];
  }

  // Generar borrador inteligente de respuesta
  let textoBase = `En atención a lo observado/solicitado por el Inspector de Obra en el Asiento N° ${obs.numero} (${obs.fecha_asiento}), se precisa lo siguiente: `;

  // Añadir pistas inteligentes según la observación:
  const oLower = (obs.texto_observacion || '').toLowerCase();
  if (oLower.includes('apisonador') || oLower.includes('horas máquina') || oLower.includes('horas maquina')) {
    textoBase += `Respecto a los equipos, se precisa que el apisonador tipo canguro operó en la compactación de las capas de relleno de falso piso y base granular durante la jornada. `;
  }
  if (oLower.includes('gasohol') || oLower.includes('combustible')) {
    textoBase += `En relación al combustible, los galones de gasohol fueron destinados al abastecimiento de los apisonadores tipo canguro empleados en los trabajos de compactación. `;
  }
  if (oLower.includes('winche')) {
    textoBase += `Sobre el winche eléctrico, se precisa que es un equipo asignado a la obra para las labores de izaje vertical de materiales. `;
  }
  if (oLower.includes('tubo') || oLower.includes('tubería') || oLower.includes('pvc')) {
    textoBase += `Respecto a los materiales de PVC, fueron empleados en las partidas correspondientes a las instalaciones eléctricas y sanitarias ejecutadas en la fecha. `;
  }
  if (oLower.includes('topogr') || oLower.includes('partida')) {
    textoBase += `Se toma en cuenta la recomendación de simplificación de mención para partidas continuas en el cuaderno de obra. `;
  }

  // Insertar en observaciones manuales del día si existe la estructura
  if (typeof observacionesManuales !== 'undefined') {
    if (!observacionesManuales[fechaDestino]) observacionesManuales[fechaDestino] = [];
    observacionesManuales[fechaDestino].push(textoBase.trim());
    if (typeof cambiosPendientes !== 'undefined') cambiosPendientes = true;
    const btnGuardar = document.getElementById('btn-guardar');
    if (btnGuardar) btnGuardar.style.display = 'inline-block';
    if (typeof renderDocumento === 'function') renderDocumento();
    
    setObservacionStatus(asientoNum, 'respondido');
    cerrarModalInfobras();
    alert(`✓ Se insertó el borrador de respuesta técnica al Asiento N° ${asientoNum} en las observaciones del día ${fechaDestino}.\n\nPuedes revisarlo y dar clic en "Guardar ediciones".`);
  } else {
    // Si no está disponible, copiar al portapapeles
    if (navigator.clipboard) navigator.clipboard.writeText(textoBase);
    alert(`Se copió la propuesta de respuesta al portapapeles:\n\n${textoBase}`);
  }
}

/**
 * Renderiza el buscador de asientos
 */
function renderListaAsientos() {
  const ctn = document.getElementById('infobras-asientos-list');
  if (!ctn) return;

  const filtroRol = document.getElementById('infobras-filtro-rol').value;
  const filtroTexto = (document.getElementById('infobras-filtro-texto').value || '').toLowerCase().trim();

  const filtrados = infobrasAsientos.filter(a => {
    if (filtroRol && a.rol !== filtroRol) return false;
    if (filtroTexto) {
      const matchNum = String(a.numero).includes(filtroTexto);
      const matchTit = (a.titulo || '').toLowerCase().includes(filtroTexto);
      const matchDesc = (a.descripcion || '').toLowerCase().includes(filtroTexto);
      const matchFecha = (a.fecha_asiento || '').includes(filtroTexto);
      if (!matchNum && !matchTit && !matchDesc && !matchFecha) return false;
    }
    return true;
  });

  // Mostrar los primeros 50 para máxima velocidad
  const limite = 50;
  const listaMostrar = filtrados.slice(-limite).reverse();

  let html = `<div style="font-size:8.5pt; color:#666; margin-bottom:8px;">Mostrando ${listaMostrar.length} de ${filtrados.length} asientos encontrados:</div>`;

  listaMostrar.forEach(a => {
    const esInspector = a.rol === 'INSPECTOR';
    const tagBg = esInspector ? '#e3f2fd' : '#e8f5e9';
    const tagColor = esInspector ? '#0d47a1' : '#2e7d32';

    html += `
      <div style="background:#fff; border:1px solid #ddd; border-left:4px solid ${tagColor}; border-radius:4px; padding:10px; margin-bottom:8px;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <div>
            <strong style="color:${tagColor};">Asiento N° ${a.numero}</strong> — 
            <span style="font-weight:600; color:#333;">${esc(a.titulo)}</span>
            <span style="font-size:8pt; background:${tagBg}; color:${tagColor}; padding:1px 6px; border-radius:8px; font-weight:bold; margin-left:6px;">${a.rol}</span>
          </div>
          <span style="font-size:8pt; color:#777;">📅 ${a.fecha_asiento}</span>
        </div>
        <div style="font-size:8.5pt; color:#555; margin:4px 0 6px;">Por: <strong>${esc(a.autor)}</strong> | Registrado: ${a.fecha_registro}</div>
        <div style="font-size:8.5pt; color:#333; line-height:1.4; max-height:80px; overflow:hidden; text-overflow:ellipsis;">${esc(a.descripcion.substring(0, 220))}...</div>
        <div style="text-align:right; margin-top:6px;">
          <button type="button" class="btn" style="background:#f5f5f5; border:1px solid #ccc; color:#333; font-size:7.5pt; padding:3px 8px;" onclick="verAsientoDetalleModal(${a.numero})">🔍 Ver Completo</button>
        </div>
      </div>
    `;
  });

  ctn.innerHTML = html;
}

/**
 * Modal para ver un asiento completo
 */
function verAsientoDetalleModal(asientoNum) {
  const a = infobrasAsientos.find(x => x.numero === asientoNum);
  if (!a) return;

  const pdfBtn = a.pdf_url ? `<a href="${a.pdf_url}" target="_blank" class="btn" style="background:#c62828; color:#fff; text-decoration:none; padding:4px 10px; font-size:8pt;">📄 Ver PDF Oficial en Infobras</a>` : '';

  const modalHtml = `
    <div class="modal-overlay active" id="modal-asiento-detalle" style="z-index:450;">
      <div class="modal-content" style="max-width:700px; max-height:85vh; display:flex; flex-direction:column; padding:20px;">
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:2px solid #0d47a1; padding-bottom:8px; margin-bottom:12px;">
          <h3 style="margin:0; color:#0d47a1; font-size:1.1rem;">Asiento N° ${a.numero} — ${esc(a.titulo)}</h3>
          <span class="modal-close" onclick="document.getElementById('modal-asiento-detalle').remove()" style="cursor:pointer; font-size:1.3rem;">✕</span>
        </div>
        <div style="font-size:8.5pt; color:#555; margin-bottom:10px; display:flex; gap:12px; flex-wrap:wrap; background:#f5f5f5; padding:8px; border-radius:4px;">
          <div><strong>Rol:</strong> ${a.rol}</div>
          <div><strong>Autor:</strong> ${esc(a.autor)}</div>
          <div><strong>Fecha Asiento:</strong> ${a.fecha_asiento}</div>
          <div><strong>Fecha Registro:</strong> ${a.fecha_registro}</div>
        </div>
        <div style="flex:1; overflow-y:auto; font-size:9pt; line-height:1.55; white-space:pre-wrap; background:#fff; border:1px solid #ccc; padding:12px; border-radius:4px; font-family:inherit;">${esc(a.descripcion)}</div>
        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:14px;">
          ${pdfBtn}
          <button type="button" class="btn" style="background:#0d47a1; color:#fff; padding:6px 16px;" onclick="document.getElementById('modal-asiento-detalle').remove()">Cerrar</button>
        </div>
      </div>
    </div>
  `;
  const div = document.createElement('div');
  div.innerHTML = modalHtml;
  document.body.appendChild(div.firstElementChild);
}

/**
 * Renderiza la pestaña de Descargas Mensuales
 */
function renderTabDescargas() {
  const ctn = document.getElementById('tab-content-descargas');
  if (!ctn) return;

  // Extraer meses disponibles
  const mesesSet = new Set();
  infobrasAsientos.forEach(a => {
    if (a.fecha_asiento && a.fecha_asiento.includes('/')) {
      const parts = a.fecha_asiento.split('/');
      if (parts.length === 3) {
        mesesSet.add(`${parts[1]}/${parts[2]}`);
      }
    }
  });

  const mesesArray = Array.from(mesesSet).sort().reverse();
  const nombresMes = { '01':'Enero', '02':'Febrero', '03':'Marzo', '04':'Abril', '05':'Mayo', '06':'Junio', '07':'Julio', '08':'Agosto', '09':'Setiembre', '10':'Octubre', '11':'Noviembre', '12':'Diciembre' };

  let optionsHtml = '';
  mesesArray.forEach(m => {
    const [mm, yyyy] = m.split('/');
    const nombre = nombresMes[mm] || mm;
    const selected = (mm === '10' && yyyy === '2026') ? 'selected' : '';
    optionsHtml += `<option value="${m}" ${selected}>${nombre} ${yyyy}</option>`;
  });

  ctn.innerHTML = `
    <div style="padding:15px; background:#fff; border:1px solid #ddd; border-radius:6px;">
      <h4 style="margin-top:0; color:#0d47a1; font-size:11pt;">📥 Descarga de Asientos Consolidados por Mes</h4>
      <p style="font-size:9pt; color:#666; margin-bottom:14px;">Genera un documento consolidado de todos los asientos del mes seleccionado (ideal para adjuntar al informe mensual o para archivo técnico).</p>
      
      <div style="display:flex; gap:12px; align-items:center; flex-wrap:wrap; margin-bottom:16px;">
        <label style="font-weight:bold; font-size:9pt;">Selecciona el Mes:</label>
        <select id="infobras-sel-mes" style="padding:6px 12px; font-size:9pt; border-radius:4px; border:1px solid #ccc;">
          ${optionsHtml}
        </select>
      </div>

      <div style="display:flex; gap:10px; flex-wrap:wrap;">
        <button type="button" class="btn" style="background:#0d47a1; color:#fff; padding:8px 14px; font-size:9pt;" onclick="exportarConsolidadoMes('RESIDENTE')">📘 Consolidado Residente</button>
        <button type="button" class="btn" style="background:#1565c0; color:#fff; padding:8px 14px; font-size:9pt;" onclick="exportarConsolidadoMes('INSPECTOR')">📙 Consolidado Inspector</button>
        <button type="button" class="btn" style="background:#2e7d32; color:#fff; padding:8px 14px; font-size:9pt;" onclick="exportarConsolidadoMes('AMBOS')">📗 Consolidado Completo (Ambos)</button>
      </div>
    </div>
  `;
}

/**
 * Exporta el texto consolidado del mes a un archivo de texto/documento descargable
 */
function exportarConsolidadoMes(rolFiltro) {
  const selMes = document.getElementById('infobras-sel-mes').value;
  if (!selMes) return;

  const [mm, yyyy] = selMes.split('/');
  const filtrados = infobrasAsientos.filter(a => {
    if (!a.fecha_asiento.includes(`/${mm}/${yyyy}`)) return false;
    if (rolFiltro !== 'AMBOS' && a.rol !== rolFiltro) return false;
    return true;
  });

  if (filtrados.length === 0) {
    alert("No se encontraron asientos para el mes y rol seleccionados.");
    return;
  }

  let doc = `================================================================================\n`;
  doc += `CONSOLIDADO DE CUADERNO DE OBRA DIGITAL — INFOBRAS\n`;
  doc += `MES: ${mm}/${yyyy}  |  FILTRO: ${rolFiltro}\n`;
  doc += `OBRA ID: 539128\n`;
  doc += `TOTAL DE ASIENTOS: ${filtrados.length}\n`;
  doc += `================================================================================\n\n`;

  filtrados.forEach(a => {
    doc += `--------------------------------------------------------------------------------\n`;
    doc += `ASIENTO N° ${a.numero} — ${a.rol}\n`;
    doc += `TÍTULO: ${a.titulo}\n`;
    doc += `FECHA ASIENTO: ${a.fecha_asiento}  |  FECHA REGISTRO: ${a.fecha_registro}\n`;
    doc += `AUTOR: ${a.autor}\n`;
    doc += `--------------------------------------------------------------------------------\n`;
    doc += `${a.descripcion}\n\n`;
  });

  const blob = new Blob([doc], { type: 'text/plain;charset=utf-8' });
  const filename = `Consolidado_Asientos_${rolFiltro}_${mm}_${yyyy}.txt`;
  
  if (typeof saveAs !== 'undefined') {
    saveAs(blob, filename);
  } else {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
  }
}

/**
 * Sincroniza en vivo directamente con el servidor de Infobras
 */
async function sincronizarConInfobrasLive() {
  const btn = document.getElementById('btn-sync-infobras');
  if (btn) {
    btn.disabled = true;
    btn.innerText = '⏳ Sincronizando con Infobras...';
  }

  try {
    const url = 'https://infobras.contraloria.gob.pe/InfobrasWeb/Mapa/CuadernoObraDigital?obraId=539128';
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const html = await resp.text();

    const match = html.match(/var\s+lAsientoDigital\s*=\s*(\[[\s\S]*?\]);\s*var/);
    if (!match) throw new Error("No se encontró la lista de asientos en Infobras.");

    const rawList = JSON.parse(match[1]);
    const nuevosAsientos = rawList.map(raw => {
      let desc = (raw.Descripcion || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();
      let oc = '';
      const mOc = desc.match(/(?:-|\*|\b)?\s*Ocurrencias\s*:\s*([\s\S]+)/i);
      if (mOc) oc = mOc[1].trim();

      const refMatches = desc.match(/Asiento\s+(?:N[º°]?\s*)?(\d+)/gi) || [];
      const asientosRef = Array.from(new Set(refMatches.map(m => {
        const num = m.match(/\d+/);
        return num ? parseInt(num[0]) : null;
      }).filter(n => n && n !== raw.Numero)));

      return {
        numero: raw.Numero,
        codigo: raw.Codigo,
        tipo: (raw.Tipo || '').trim(),
        titulo: (raw.Titulo || '').trim(),
        rol: (raw.Rol || '').trim().toUpperCase(),
        autor: (raw.Usuario || '').trim(),
        fecha_asiento: (raw.FechaAsiento || '').trim(),
        fecha_registro: (raw.FechaRegistro || '').trim(),
        descripcion: desc,
        ocurrencias: oc,
        asientos_referidos: asientosRef,
        url_doc_hash: raw.UrlDocumento || '',
        pdf_url: raw.UrlDocumento ? `https://infobras.contraloria.gob.pe/InfobrasWeb/Mapa/GetFileFolder?codigo=${raw.UrlDocumento}&extension=pdf&carpeta=cuo_asientos_firma` : ''
      };
    });

    nuevosAsientos.sort((a,b) => a.numero - b.numero);

    const anteriores = infobrasAsientos.length;
    infobrasAsientos = nuevosAsientos;
    localStorage.setItem(STORAGE_KEY_INFOBRAS, JSON.stringify(infobrasAsientos));
    infobrasCargado = true;

    actualizarBadgeObservaciones();
    renderBandejaObservaciones();

    const dif = nuevosAsientos.length - anteriores;
    if (dif > 0) {
      alert(`¡Sincronización exitosa! Se encontraron y agregaron ${dif} nuevos asientos de Infobras.`);
    } else {
      alert(`¡Al día! Se verificaron los ${nuevosAsientos.length} asientos en Infobras y no hay asientos nuevos.`);
    }

  } catch (err) {
    console.error("Error sincronizando con Infobras:", err);
    alert(`No se pudo sincronizar automáticamente con Infobras (${err.message}). Se continuará usando la base de datos local guardada.`);
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerText = '🔄 Sincronizar Infobras';
    }
  }
}

/**
 * Crea la estructura HTML del Modal de Infobras
 */
function crearModalInfobrasDOM() {
  const div = document.createElement('div');
  div.className = 'modal-overlay';
  div.id = 'modal-infobras';
  div.style.zIndex = '350';

  div.innerHTML = `
    <div class="modal-content" style="max-width:850px; width:92vw; max-height:90vh; display:flex; flex-direction:column; padding:20px;">
      <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:2px solid #0d47a1; padding-bottom:8px; margin-bottom:12px;">
        <h2 style="margin:0; color:#0d47a1; font-size:1.15rem; display:flex; align-items:center; gap:8px;">
          🏛️ Cuaderno de Obra Digital — INFOBRAS
        </h2>
        <div style="display:flex; align-items:center; gap:10px;">
          <button type="button" class="btn" id="btn-sync-infobras" style="background:#e8f5e9; border:1px solid #81c784; color:#2e7d32; font-size:8.5pt; padding:5px 12px; font-weight:bold;" onclick="sincronizarConInfobrasLive()">🔄 Sincronizar Infobras</button>
          <span class="modal-close" onclick="cerrarModalInfobras()" style="cursor:pointer; font-size:1.3rem;">✕</span>
        </div>
      </div>

      <!-- Barra de Pestañas -->
      <div style="display:flex; gap:6px; border-bottom:1px solid #ccc; margin-bottom:12px;">
        <button type="button" class="tab-infobras-btn active" id="tab-btn-obs" style="padding:8px 14px; font-size:9pt; font-weight:bold; border:none; background:#f0f4ff; color:#0d47a1; border-radius:4px 4px 0 0; cursor:pointer;" onclick="cambiarTabInfobras('obs')">⚠️ Observaciones del Inspector</button>
        <button type="button" class="tab-infobras-btn" id="tab-btn-asientos" style="padding:8px 14px; font-size:9pt; font-weight:bold; border:none; background:#eee; color:#555; border-radius:4px 4px 0 0; cursor:pointer;" onclick="cambiarTabInfobras('asientos')">📖 Todos los Asientos</button>
        <button type="button" class="tab-infobras-btn" id="tab-btn-descargas" style="padding:8px 14px; font-size:9pt; font-weight:bold; border:none; background:#eee; color:#555; border-radius:4px 4px 0 0; cursor:pointer;" onclick="cambiarTabInfobras('descargas')">📥 Descargas Consolidadas</button>
      </div>

      <!-- Contenido Tab 1: Observaciones -->
      <div class="tab-infobras-content" id="tab-content-obs" style="flex:1; overflow-y:auto; padding-right:6px;">
        <div id="infobras-obs-list"></div>
      </div>

      <!-- Contenido Tab 2: Todos los Asientos -->
      <div class="tab-infobras-content" id="tab-content-asientos" style="flex:1; overflow-y:auto; display:none; padding-right:6px;">
        <div style="display:flex; gap:8px; margin-bottom:12px; flex-wrap:wrap;">
          <input type="text" id="infobras-filtro-texto" placeholder="Buscar por palabra clave, número o fecha..." style="flex:1; min-width:200px; padding:6px 10px; font-size:9pt; border:1px solid #ccc; border-radius:4px;" oninput="renderListaAsientos()" />
          <select id="infobras-filtro-rol" style="padding:6px; font-size:9pt; border:1px solid #ccc; border-radius:4px;" onchange="renderListaAsientos()">
            <option value="">Todos los Roles</option>
            <option value="INSPECTOR">Solo Inspector</option>
            <option value="RESIDENTE">Solo Residente</option>
          </select>
        </div>
        <div id="infobras-asientos-list"></div>
      </div>

      <!-- Contenido Tab 3: Descargas -->
      <div class="tab-infobras-content" id="tab-content-descargas" style="flex:1; overflow-y:auto; display:none;">
      </div>

      <div style="display:flex; justify-content:flex-end; margin-top:12px;">
        <button type="button" class="btn" style="background:#0d47a1; color:#fff; padding:6px 16px;" onclick="cerrarModalInfobras()">Cerrar</button>
      </div>
    </div>
  `;

  document.body.appendChild(div);
}

// Carga inicial en segundo plano al cargar el script
document.addEventListener('DOMContentLoaded', () => {
  cargarAsientosInfobras();
});
