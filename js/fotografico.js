// Lógica para Generación de Registro Fotográfico
let currentFotoFecha = null;
let currentActividades = [];

function obtenerTextoCharlaSeguridad(fecha) {
  const obsList = [];
  if (typeof observacionesManuales !== 'undefined' && observacionesManuales && Array.isArray(observacionesManuales[fecha])) {
    obsList.push(...observacionesManuales[fecha]);
  }
  if (typeof observacionesData !== 'undefined' && observacionesData && observacionesData[fecha]) {
    obsList.push(observacionesData[fecha]);
  }

  let nombre = '';
  let tema = '';

  for (const obs of obsList) {
    if (!obs || typeof obs !== 'string') continue;
    const text = obs.trim();
    if (!text) continue;
    const tLower = text.toLowerCase();

    if (tLower.includes('charla') || tLower.includes('capacitaci') || tLower.includes('seguridad') || tLower.includes('ssoma')) {
      const mN = text.match(/a cargo de(?:l|\s+la)?\s+((?:(?:Ing|Lic|Tec|Arq|Dr|Dra)\.\s+)?[A-ZÁÉÍÓÚa-záéíóú\s]+?)(?:,|con\s+el\s+tema|dando\b|recalcando\b|enfocad|brindad|dirigid|\bcon\s+la\b|\.|$)/i);
      if (mN) {
        nombre = mN[1].trim();
      }

      const mT = text.match(/(?:con el tema|tema)\s+[:\"“]?\s*[\"“]([^\"”\n]+)[\"”]/i);
      if (mT) {
        tema = mT[1].trim();
      } else {
        const mT2 = text.match(/con el tema\s*(?::|de)?\s+([^,\.\n]+?)(?:,|dirigid|donde\b|\.|$)/i);
        if (mT2) {
          tema = mT2[1].trim();
        } else if (tLower.includes('dando recomendaciones generales de seguridad')) {
          tema = 'Recomendaciones generales de seguridad';
        } else if (tLower.includes('recalcando la identificación constante de peligros')) {
          tema = 'Identificación constante de peligros y cumplimiento de procedimientos';
        } else {
          const mS = text.match(/(?:sobre|acerca de)\s+([^,\.\n]+?)(?:,|dirigid|donde\b|\.|$)/i);
          if (mS) {
            tema = mS[1].trim();
          }
        }
      }
      break;
    }
  }

  tema = (tema || 'Seguridad y Salud en el Trabajo').replace(/["'“”]/g, '').trim();

  let res = `Se realizo la charla de seguridad a cargo del area SSOMA con el tema : ${tema}`;
  if (nombre) {
    let nombreClean = nombre.replace(/^(del|la|el)\s+/i, '').trim();
    const conector = /^(Lic|Inga|Sra|Srta)\b/i.test(nombreClean) ? 'de la ' : 'del ';
    res += ` a cargo ${conector}${nombreClean}`;
  }
  return res;
}

function obtenerListaActividadesDia(fecha) {
  const lista = [];

  // 1. Charla de seguridad (siempre al inicio de la jornada)
  const charla = obtenerTextoCharlaSeguridad(fecha);
  if (charla) {
    lista.push(charla);
  }

  // 2. Actividades de las tarjetas (respetando si fueron editadas en el cuaderno)
  if (typeof actividades !== 'undefined' && Array.isArray(actividades)) {
    const actsDiaRaw = actividades.filter(a => a.fecha === fecha);
    const actsOrdenadas = (typeof ordenarPorSecuencia === 'function') ? ordenarPorSecuencia(actsDiaRaw) : actsDiaRaw;
    const actsAgrupadas = (typeof agruparActividadesPorEjes === 'function') ? agruparActividadesPorEjes(actsOrdenadas) : actsOrdenadas;

    actsAgrupadas.forEach(a => {
      let txt = '';
      if (typeof parrafosEditados !== 'undefined' && parrafosEditados && parrafosEditados[a.id]) {
        txt = parrafosEditados[a.id].trim();
      } else if (typeof generarParrafo === 'function') {
        txt = generarParrafo(a).trim();
      } else {
        txt = ((a.descripcion || '') + (a.elemento && a.elemento !== '—' ? ' de ' + a.elemento : '')).trim();
      }
      if (txt && !lista.includes(txt)) {
        lista.push(txt);
      }
    });
  }

  // 3. Actividades manuales del cuaderno de obra
  if (typeof actividadesManuales !== 'undefined' && actividadesManuales && Array.isArray(actividadesManuales[fecha])) {
    actividadesManuales[fecha].forEach(txt => {
      const limpio = (txt || '').trim();
      if (limpio && !lista.includes(limpio)) {
        lista.push(limpio);
      }
    });
  }

  return lista;
}

function abrirModalFoto(fecha) {
  currentFotoFecha = fecha;
  
  // Extraemos actividades completas de ese día (tarjetas editadas, manuales y charla)
  currentActividades = obtenerListaActividadesDia(fecha);

  document.getElementById('modal-foto-lista').innerHTML = '';
  // Inicializamos con 4 slots por defecto
  for(let i=0; i<4; i++){
    agregarFilaFoto();
  }
  
  // Poblar fecha por defecto con la fecha del cuaderno
  const fechaInput = document.getElementById('foto-fecha-reporte');
  if (fechaInput) fechaInput.value = fecha;
  
  document.getElementById('modal-foto').classList.add('active');
}

function cerrarModalFoto() {
  document.getElementById('modal-foto').classList.remove('active');
}

function seleccionarActividadFoto(sel) {
  const row = sel.closest('.foto-row');
  if (!row) return;
  const custom = row.querySelector('.inp-custom-comment');
  if (custom && sel.value) {
    custom.value = sel.value;
  }
  sel.title = sel.value || '';
}

function agregarFilaFoto() {
  const ctn = document.getElementById('modal-foto-lista');
  const idx = ctn.children.length;
  
  if (idx >= 12) {
    alert("El máximo soportado por la plantilla actual son 12 fotos (3 hojas).");
    return;
  }
  
  const div = document.createElement('div');
  div.className = 'foto-row';
  div.style.cssText = 'background:#fff; border:1px solid #ccc; padding:10px; margin-bottom:10px; border-radius:4px; display:flex; gap:10px; align-items:center; min-width:0; width:100%; box-sizing:border-box;';
  
  // Dropdown de actividades
  let selectHtml = `<select class="sel-actividad" onchange="seleccionarActividadFoto(this)" style="width:100%; max-width:100%; min-width:0; box-sizing:border-box; padding:6px; font-size:9pt; border-radius:4px; border:1px solid #ccc; text-align:left; text-align-last:left; direction:ltr; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;"><option value="" style="text-align:left; direction:ltr;">-- Seleccionar actividad o escribir abajo --</option>`;
  currentActividades.forEach(valStr => {
    selectHtml += `<option value="${esc(valStr)}" style="text-align:left; direction:ltr;">${esc(valStr)}</option>`;
  });
  selectHtml += `</select>`;

  div.innerHTML = `
    <label style="width:100px; height:100px; border:1px dashed #aaa; display:flex; align-items:center; justify-content:center; background:#eee; position:relative; overflow:hidden; cursor:pointer; flex-shrink:0;">
       <span style="font-size:24pt; color:#ccc;">📷</span>
       <img src="" style="width:100%; height:100%; object-fit:contain; position:absolute; top:0; left:0; display:none;" class="img-preview" />
       <input type="file" accept="image/*" class="inp-file-foto" style="display:none;" onchange="previewFoto(this)">
    </label>
    <div style="flex:1; display:flex; flex-direction:column; gap:8px; min-width:0; width:100%; overflow:hidden;">
       <label style="font-size:9pt; font-weight:bold; text-align:left;">Selecciona Actividad (opcional):</label>
       ${selectHtml}
       <textarea class="inp-custom-comment" placeholder="Comentario personalizado / descripción a mostrar debajo de la foto..." style="width:100%; max-width:100%; box-sizing:border-box; padding:6px; font-size:9pt; border-radius:4px; border:1px solid #ccc; resize:vertical; min-height:46px; font-family:inherit; text-align:left;"></textarea>
    </div>
    <button class="btn-modal-remove" style="align-self:flex-start; padding:2px 6px; cursor:pointer;" onclick="this.parentElement.remove()">✕</button>
  `;
  ctn.appendChild(div);
}

function previewFoto(input) {
  if(input.files && input.files[0]) {
    const reader = new FileReader();
    reader.onload = function(e) {
      const img = input.parentElement.querySelector('.img-preview');
      img.src = e.target.result;
      img.style.display = 'block';
    }
    reader.readAsDataURL(input.files[0]);
  }
}

function esc(s){ return String(s).replace(/"/g,'&quot;'); }

function readFileAsArrayBuffer(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => resolve(e.target.result);
    reader.onerror = e => reject(e);
    reader.readAsArrayBuffer(file);
  });
}

async function fetchTemplateBuffer(url) {
  const resp = await fetch(url);
  if (!resp.ok) throw new Error('No se pudo cargar la plantilla base de Excel.');
  return await resp.arrayBuffer();
}

async function generarExcelFotografico() {
  const btn = document.getElementById('btn-generar-excel-foto');
  btn.disabled = true;
  btn.innerText = '⏳ Procesando Fotos y Excel...';
  
  try {
    const ctn = document.getElementById('modal-foto-lista');
    const rows = Array.from(ctn.children);
    
    let fotosData = [];
    
    // Leemos inputs
    for(let i=0; i<rows.length; i++){
       const fileInput = rows[i].querySelector('.inp-file-foto');
       const sel = rows[i].querySelector('.sel-actividad');
       const custom = rows[i].querySelector('.inp-custom-comment');
       
       let comment = custom.value.trim() ? custom.value.trim() : sel.value;
       
       if(fileInput.files && fileInput.files[0]){
          const file = fileInput.files[0];
          const arrayBuffer = await readFileAsArrayBuffer(file);
          fotosData.push({ 
            buffer: arrayBuffer, 
            extension: file.name.split('.').pop().toLowerCase() === 'png' ? 'png' : 'jpeg', 
            comment: comment 
          });
       }
    }
    
    if(fotosData.length === 0){
       alert('No has agregado ninguna foto para incluir en el reporte.');
       btn.disabled = false; btn.innerText = '⬇ Generar y Descargar Excel';
       return;
    }
    
    // 2. Fetch template
    const templateBuffer = await fetchTemplateBuffer('assets/template_reg_fotografico.xlsx');
    
    // 3. Load Workbook
    const _ExcelJS = (typeof ExcelJS !== 'undefined') ? ExcelJS : (window.ExcelJS || window.exceljs);
    if (!_ExcelJS) { throw new Error('La librería ExcelJS no se cargó. Intenta recargar la página con Ctrl+F5.'); }
    const workbook = new _ExcelJS.Workbook();
    await workbook.xlsx.load(templateBuffer);
    
    // Cargar logos de encabezado dinámicamente para evitar distorsión de ExcelJS
    const bufLogo1 = await fetchTemplateBuffer('assets/logo1.png');
    const idLogo1 = workbook.addImage({ buffer: bufLogo1, extension: 'png' });
    
    const bufLogo2 = await fetchTemplateBuffer('assets/logo2.png');
    const idLogo2 = workbook.addImage({ buffer: bufLogo2, extension: 'png' });
    
    // Limites de fotos
    const slots = [
       { imgTl: { col: 2.2, row: 4.2 }, imgBr: { col: 21.8, row: 37.8 }, txtCell: 'C39' }, 
       { imgTl: { col: 23.2, row: 4.2 }, imgBr: { col: 42.8, row: 37.8 }, txtCell: 'X39' }, 
       { imgTl: { col: 2.2, row: 43.2 }, imgBr: { col: 21.8, row: 75.8 }, txtCell: 'C77' }, 
       { imgTl: { col: 23.2, row: 43.2 }, imgBr: { col: 42.8, row: 75.8 }, txtCell: 'X77' }
    ];
    
    const maxHojas = workbook.worksheets.length;
    let fotosProcesadas = 0;
    
    // Leer fecha del input del modal (permite al usuario cambiarla)
    const fechaReporte = document.getElementById('foto-fecha-reporte')?.value || currentFotoFecha;
    let [yyyy, mm, dd] = fechaReporte.split('-');
    
    for(let sheetIdx = 0; sheetIdx < maxHojas; sheetIdx++) {
       const worksheet = workbook.worksheets[sheetIdx];
       
       // Escribir Titulo con fecha en H3
       worksheet.getCell('H3').value = "REGISTRO FOTOGRÁFICO " + dd + "/" + mm + "/" + yyyy;
       
       // Inyectar logos dinámicos con medidas exactas en pixeles calculadas a partir de centímetros (1cm = ~37.8px)
       // Logo 1: 1.42cm x 2.09cm -> 54px x 79px. Celda B1 (col: 1)
       worksheet.addImage(idLogo1, { tl: { col: 1.2, row: 0.2 }, ext: { width: 54, height: 79 }, editAs: 'absolute' });
       // Logo 2: 1.99cm x 2.12cm -> 75px x 80px. Celda AL1 (col: 37)
       worksheet.addImage(idLogo2, { tl: { col: 37.2, row: 0.2 }, ext: { width: 75, height: 80 }, editAs: 'absolute' });
       
       // Llenar 4 fotos en esta hoja
       for(let slotIdx = 0; slotIdx < 4; slotIdx++) {
          if (fotosProcesadas >= fotosData.length) break;
          
          let fData = fotosData[fotosProcesadas];
          let slot = slots[slotIdx];
          
          // Escribir Comentario
          worksheet.getCell(slot.txtCell).value = fData.comment;
          
          // Insertar Imagen
          const imageId = workbook.addImage({
            buffer: fData.buffer,
            extension: fData.extension,
          });
          
          worksheet.addImage(imageId, {
            tl: slot.imgTl,
            br: slot.imgBr,
            editAs: 'oneCell' 
          });
          
          fotosProcesadas++;
       }
       
       if (fotosProcesadas >= fotosData.length) break;
    }
    
    // Borrar hojas sobrantes
    const hojasNecesarias = Math.ceil(fotosData.length / 4);
    for(let i = maxHojas; i > hojasNecesarias; i--) {
       const sh = workbook.worksheets[i-1];
       if (sh) {
          workbook.removeWorksheet(sh.id);
       }
    }
    
    // 4. Descargar Excel
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    
    saveAs(blob, `Registro_Fotografico_${dd}-${mm}-${yyyy}.xlsx`);
    
    cerrarModalFoto();
    
  } catch(e) {
    console.error(e);
    alert('Error al generar: ' + e.message);
  } finally {
    btn.disabled = false;
    btn.innerText = '⬇ Generar y Descargar Excel';
  }
}
