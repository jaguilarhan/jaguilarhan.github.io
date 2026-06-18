// Lógica para Generación de Registro Fotográfico
let currentFotoFecha = null;
let currentActividades = [];

function abrirModalFoto(fecha) {
  currentFotoFecha = fecha;
  
  // Extraemos actividades de ese día
  currentActividades = [];
  if (typeof actividades !== 'undefined' && Array.isArray(actividades)) {
    currentActividades = actividades.filter(a => a.fecha === fecha);
  }

  document.getElementById('modal-foto-lista').innerHTML = '';
  // Inicializamos con 4 slots por defecto
  for(let i=0; i<4; i++){
    agregarFilaFoto();
  }
  
  document.getElementById('modal-foto').classList.add('active');
}

function cerrarModalFoto() {
  document.getElementById('modal-foto').classList.remove('active');
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
  div.style.cssText = 'background:#fff; border:1px solid #ccc; padding:10px; margin-bottom:10px; border-radius:4px; display:flex; gap:10px; align-items:center;';
  
  // Dropdown de actividades
  let selectHtml = `<select class="sel-actividad" style="flex:1; padding:6px; font-size:9pt; border-radius:4px; border:1px solid #ccc;"><option value="">-- Escribir un comentario personalizado abajo --</option>`;
  currentActividades.forEach((a, i) => {
    let descCorta = (a.descripcion || 'Sin descripción') + (a.elemento && a.elemento!=='—' ? ' - ' + a.elemento : '');
    // Usamos la descripción completa (párrafo generado)
    let valStr = typeof generarParrafo === 'function' ? generarParrafo(a) : descCorta;
    
    selectHtml += `<option value="${esc(valStr)}">${esc(valStr)}</option>`;
  });
  selectHtml += `</select>`;

  div.innerHTML = `
    <label style="width:100px; height:100px; border:1px dashed #aaa; display:flex; align-items:center; justify-content:center; background:#eee; position:relative; overflow:hidden; cursor:pointer; flex-shrink:0;">
       <span style="font-size:24pt; color:#ccc;">📷</span>
       <img src="" style="width:100%; height:100%; object-fit:contain; position:absolute; top:0; left:0; display:none;" class="img-preview" />
       <input type="file" accept="image/*" class="inp-file-foto" style="display:none;" onchange="previewFoto(this)">
    </label>
    <div style="flex:1; display:flex; flex-direction:column; gap:8px;">
       <label style="font-size:9pt; font-weight:bold;">Selecciona Actividad (opcional):</label>
       ${selectHtml}
       <textarea class="inp-custom-comment" placeholder="Comentario personalizado / descripción a mostrar debajo de la foto..." style="padding:6px; font-size:9pt; border-radius:4px; border:1px solid #ccc; resize:vertical; min-height:40px;"></textarea>
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
    
    // Limites de fotos
    const slots = [
       { imgTl: { col: 2.2, row: 4.2 }, imgBr: { col: 21.8, row: 37.8 }, txtCell: 'C39' }, 
       { imgTl: { col: 23.2, row: 4.2 }, imgBr: { col: 42.8, row: 37.8 }, txtCell: 'X39' }, 
       { imgTl: { col: 2.2, row: 43.2 }, imgBr: { col: 21.8, row: 75.8 }, txtCell: 'C77' }, 
       { imgTl: { col: 23.2, row: 43.2 }, imgBr: { col: 42.8, row: 75.8 }, txtCell: 'X77' }
    ];
    
    const maxHojas = workbook.worksheets.length;
    let fotosProcesadas = 0;
    
    for(let sheetIdx = 0; sheetIdx < maxHojas; sheetIdx++) {
       const worksheet = workbook.worksheets[sheetIdx];
       
       // Escribir Titulo con fecha en H3
       let [yyyy, mm, dd] = currentFotoFecha.split('-');
       worksheet.getCell('H3').value = "REGISTRO FOTOGRÁFICO " + dd + "/" + mm + "/" + yyyy;
       
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
    
    let [y, m, d] = currentFotoFecha.split('-');
    saveAs(blob, `Registro_Fotografico_${d}-${m}-${y}.xlsx`);
    
    cerrarModalFoto();
    
  } catch(e) {
    console.error(e);
    alert('Error al generar: ' + e.message);
  } finally {
    btn.disabled = false;
    btn.innerText = '⬇ Generar y Descargar Excel';
  }
}
