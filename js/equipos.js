// js/equipos.js

let globalActividades = [];
let globalActividadesManuales = {};

// Opciones de tiempo para selects
const optManana = ['', '07:00', '07:30', '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00'];
const optTarde = ['', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00'];

function buildOptions(arr, selectedValue = '') {
  return arr.map(v => `<option value="${v}" ${v === selectedValue ? 'selected' : ''}>${v}</option>`).join('');
}

// Load Firebase Data on start
document.addEventListener('DOMContentLoaded', () => {
  fbLoad('actividades', []).then(data => {
    globalActividades = Array.isArray(data) ? data : Object.values(data || {});
  });
  
  fbLoad('actividades_manuales', {}).then(data => {
    globalActividadesManuales = data || {};
  });
  
  // Cargar datos por defecto al iniciar (Topografia)
  setTimeout(() => cargarControl(), 500);
});

function timeDiff(start, end) {
  if (!start || !end) return 0;
  let [h1, m1] = start.split(':').map(Number);
  let [h2, m2] = end.split(':').map(Number);
  let d1 = new Date(2000, 0, 1, h1, m1);
  let d2 = new Date(2000, 0, 1, h2, m2);
  let diffMs = d2 - d1;
  if (diffMs < 0) return 0;
  return diffMs / (1000 * 60 * 60); // Horas decimales
}

function calcRow(el) {
  const tr = el.closest('tr');
  const mIni = tr.querySelector('.inp-m-ini').value;
  const mFin = tr.querySelector('.inp-m-fin').value;
  const tIni = tr.querySelector('.inp-t-ini').value;
  const tFin = tr.querySelector('.inp-t-fin').value;
  
  let mCant = timeDiff(mIni, mFin);
  let tCant = timeDiff(tIni, tFin);
  
  tr.querySelector('.inp-m-cant').value = mCant > 0 ? mCant.toFixed(2) : '';
  tr.querySelector('.inp-t-cant').value = tCant > 0 ? tCant.toFixed(2) : '';
  
  let tot = mCant + tCant;
  tr.querySelector('.inp-tot').value = tot > 0 ? tot.toFixed(2) : '';
  
  calcGlobales();
}

function calcGlobales() {
  const rows = document.querySelectorAll('#tbody-equipos tr');
  let tMan = 0, tTar = 0, tGen = 0, tComb = 0;
  
  rows.forEach(tr => {
    tMan += Number(tr.querySelector('.inp-m-cant').value) || 0;
    tTar += Number(tr.querySelector('.inp-t-cant').value) || 0;
    tGen += Number(tr.querySelector('.inp-tot').value) || 0;
    tComb += Number(tr.querySelector('.inp-comb').value) || 0;
  });
  
  document.getElementById('tot-manana').value = tMan > 0 ? tMan.toFixed(2) : '';
  document.getElementById('tot-tarde').value = tTar > 0 ? tTar.toFixed(2) : '';
  document.getElementById('tot-general').value = tGen > 0 ? tGen.toFixed(2) : '';
  document.getElementById('tot-combustible').value = tComb > 0 ? tComb.toFixed(2) : '';
}

function agregarFila(data = null) {
  const tbody = document.getElementById('tbody-equipos');
  const idx = tbody.children.length + 1;
  const tr = document.createElement('tr');
  
  // Extraer valores si viene data (para la carga de Firebase)
  const mes = data && data.mes ? data.mes : document.getElementById('mes-reporte').value;
  const fecha = data && data.fecha ? data.fecha : '';
  
  let diaStr = '';
  if (fecha) {
    const d = new Date(fecha + 'T00:00:00');
    const dias = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];
    diaStr = dias[d.getDay()];
  }
  
  const dia = data && data.dia ? data.dia : diaStr;
  const mIni = data && data.mIni ? data.mIni : '';
  const mFin = data && data.mFin ? data.mFin : '';
  const mCant = data && data.mCant ? data.mCant : '';
  const tIni = data && data.tIni ? data.tIni : '';
  const tFin = data && data.tFin ? data.tFin : '';
  const tCant = data && data.tCant ? data.tCant : '';
  const tot = data && data.tot ? data.tot : '';
  const comb = data && data.comb ? data.comb : '';
  const desc = data && data.desc ? data.desc : '';

  tr.innerHTML = `
    <td><span class="row-idx">${idx}</span></td>
    <td><input type="text" class="inp-mes" value="${mes}" /></td>
    <td><input type="date" class="inp-fecha" value="${fecha}" onchange="actualizarDia(this)" /></td>
    <td><input type="text" class="inp-dia" value="${dia}" readonly /></td>
    <td><select class="inp-m-ini" onchange="calcRow(this)">${buildOptions(optManana, mIni)}</select></td>
    <td><select class="inp-m-fin" onchange="calcRow(this)">${buildOptions(optManana, mFin)}</select></td>
    <td><input type="text" class="inp-m-cant" value="${mCant}" readonly placeholder="0.00" /></td>
    <td><select class="inp-t-ini" onchange="calcRow(this)">${buildOptions(optTarde, tIni)}</select></td>
    <td><select class="inp-t-fin" onchange="calcRow(this)">${buildOptions(optTarde, tFin)}</select></td>
    <td><input type="text" class="inp-t-cant" value="${tCant}" readonly placeholder="0.00" /></td>
    <td><input type="text" class="inp-tot" value="${tot}" readonly placeholder="0.00" /></td>
    <td><input type="number" class="inp-comb" value="${comb}" step="0.01" onchange="calcGlobales()" /></td>
    <td><textarea class="inp-desc">${desc}</textarea></td>
    <td><button class="btn btn-danger" onclick="removerFila(this)">X</button></td>
  `;
  tbody.appendChild(tr);
  calcGlobales(); // Actualizar totales
  return tr;
}

function removerFila(btn) {
  const tr = btn.closest('tr');
  tr.remove();
  
  // Re-enumerar
  const rows = document.querySelectorAll('#tbody-equipos tr');
  rows.forEach((row, i) => {
    row.querySelector('.row-idx').textContent = i + 1;
  });
  
  calcGlobales();
}

function actualizarDia(inputFecha) {
  const tr = inputFecha.closest('tr');
  const dateStr = inputFecha.value;
  if (!dateStr) return;
  
  const d = new Date(dateStr + 'T00:00:00');
  const dias = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];
  tr.querySelector('.inp-dia').value = dias[d.getDay()];
}

function cambiarTipoEquipo() {
  const tipo = document.getElementById('tipo-equipo').value;
  const nombreInput = document.getElementById('nombre-equipo');
  
  if (tipo === 'TOPOGRAFIA') {
    nombreInput.value = "ALQUILER DE EQUIPOS DE TOPOGRAFIA DIVERSOS - ESTACION TOTAL";
  } else if (tipo === 'MEZCLADORA') {
    nombreInput.value = "ALQUILER DE MEZCLADORA";
  } else if (tipo === 'VIBRADORA') {
    nombreInput.value = "ALQUILER DE VIBRADORA";
  } else if (tipo === 'APISONADOR') {
    nombreInput.value = "ALQUILER DE APISONADOR";
  } else if (tipo === 'MIXER') {
    nombreInput.value = "ALQUILER DE MIXER";
  }
  
  // Limpiar tabla e intentar cargar datos
  document.getElementById('tbody-equipos').innerHTML = '';
  calcGlobales();
  cargarControl();
}

function parseMonth(mesStr) {
  const map = {
    'enero': 1, 'febrero': 2, 'marzo': 3, 'abril': 4, 'mayo': 5, 'junio': 6,
    'julio': 7, 'agosto': 8, 'septiembre': 9, 'octubre': 10, 'noviembre': 11, 'diciembre': 12
  };
  return map[mesStr.toLowerCase()] || 0;
}

function extraerActividades() {
  const tipo = document.getElementById('tipo-equipo').value;
  const mesReporte = document.getElementById('mes-reporte').value;
  const anioReporte = document.getElementById('anio-reporte').value;
  const mesNum = parseMonth(mesReporte);
  
  let extracciones = 0;
  const tbody = document.getElementById('tbody-equipos');
  
  if (tipo === 'TOPOGRAFIA') {
    // Lógica antigua: Extrae solo para las filas ya creadas manualmente
    const rows = tbody.querySelectorAll('tr');
    rows.forEach(tr => {
      const fecha = tr.querySelector('.inp-fecha').value;
      if (fecha) {
        const vinculadas = globalActividades.filter(a => a.fecha === fecha && a.partida && a.partida.codigo === '11.01.01');
        
        if (vinculadas.length > 0) {
          const lineas = vinculadas.map(a => formatearActividad(a));
          tr.querySelector('.inp-desc').value = lineas.join('\n');
          extracciones++;
        }
      }
    });
    
    if (extracciones > 0) {
      Swal.fire('Éxito', `Se extrajeron actividades topográficas para ${extracciones} filas.`, 'success');
    } else {
      Swal.fire('Aviso', 'No se encontraron actividades topográficas para las fechas ingresadas.', 'info');
    }
    
  } else if (tipo === 'APISONADOR') {
    // Lógica Apisonador (usando actividades_manuales de cuaderno)
    const porFecha = {};
    for (const fecha in globalActividadesManuales) {
      let [y, m, d] = fecha.split('-');
      if (parseInt(y) === parseInt(anioReporte) && parseInt(m) === mesNum) {
        const actividadesDelDia = globalActividadesManuales[fecha] || [];
        const filtradas = actividadesDelDia.filter(actTexto => {
          const txt = actTexto.toLowerCase();
          return txt.includes('compactacion') || txt.includes('compactación') || txt.includes('compactado');
        });
        if (filtradas.length > 0) {
          porFecha[fecha] = filtradas;
        }
      }
    }
    
    const fechasSorted = Object.keys(porFecha).sort();
    if (fechasSorted.length === 0) {
      Swal.fire('Aviso', `No se encontraron actividades de compactación en el Cuaderno para ${mesReporte} ${anioReporte}.`, 'info');
      return;
    }
    
    fechasSorted.forEach(fecha => {
      let trExistente = null;
      const rows = tbody.querySelectorAll('tr');
      rows.forEach(tr => {
        if (tr.querySelector('.inp-fecha').value === fecha) {
          trExistente = tr;
        }
      });
      
      const lineas = porFecha[fecha].map(texto => `• ${texto}`);
      const descFinal = lineas.join('\n');
      
      if (trExistente) {
        trExistente.querySelector('.inp-desc').value = descFinal;
      } else {
        const tr = agregarFila({ fecha: fecha });
        tr.querySelector('.inp-desc').value = descFinal;
      }
      extracciones++;
    });
    
    ordenarFilasPorFecha();
    Swal.fire('Éxito', `Se extrajeron ${extracciones} días con compactación desde el cuaderno.`, 'success');
    
  } else {
    // Lógica para MEZCLADORA / VIBRADORA / MIXER
    const actsMes = globalActividades.filter(a => {
      if (!a.fecha) return false;
      let [y, m, d] = a.fecha.split('-');
      return (parseInt(y) === parseInt(anioReporte) && parseInt(m) === mesNum);
    });
    
    const exclusionesRegex = /(columna|placa|losa|macisa|maciza|escalera)/i;
    
    const actsFiltradas = actsMes.filter(a => {
      const desc = (a.descripcion || '').toLowerCase();
      const pNombre = (a.partida && a.partida.nombre) ? a.partida.nombre.toLowerCase() : '';
      const elem = (a.elemento || '');
      
      const tieneVaciado = desc.includes('vaciado') || pNombre.includes('vaciado');
      const coincideConExclusiones = exclusionesRegex.test(elem);
      
      if (tipo === 'MIXER') {
        // Mixer solo incluye columnas/placas/losas/escaleras
        return tieneVaciado && coincideConExclusiones;
      } else {
        // Mezcladora y Vibradora incluyen TODOS los vaciados sin excepciones
        return tieneVaciado;
      }
    });
    
    if (actsFiltradas.length === 0) {
      Swal.fire('Aviso', `No se encontraron actividades de vaciado acordes al filtro en ${mesReporte} ${anioReporte}.`, 'info');
      return;
    }
    
    const porFecha = {};
    actsFiltradas.forEach(a => {
      if(!porFecha[a.fecha]) porFecha[a.fecha] = [];
      porFecha[a.fecha].push(a);
    });
    
    const fechasSorted = Object.keys(porFecha).sort();
    
    fechasSorted.forEach(fecha => {
      let trExistente = null;
      const rows = tbody.querySelectorAll('tr');
      rows.forEach(tr => {
        if (tr.querySelector('.inp-fecha').value === fecha) {
          trExistente = tr;
        }
      });
      
      const lineas = porFecha[fecha].map(a => formatearActividad(a));
      const descFinal = lineas.join('\n');
      
      if (trExistente) {
        trExistente.querySelector('.inp-desc').value = descFinal;
      } else {
        const tr = agregarFila({ fecha: fecha });
        tr.querySelector('.inp-desc').value = descFinal;
      }
      extracciones++;
    });
    
    ordenarFilasPorFecha();
    Swal.fire('Éxito', `Se extrajeron actividades y se actualizaron/crearon ${extracciones} fechas en la tabla.`, 'success');
  }
}

function ordenarFilasPorFecha() {
  const tbody = document.getElementById('tbody-equipos');
  const rows = Array.from(tbody.querySelectorAll('tr'));
  
  rows.sort((a, b) => {
    const fA = a.querySelector('.inp-fecha').value;
    const fB = b.querySelector('.inp-fecha').value;
    if (!fA && fB) return 1;
    if (fA && !fB) return -1;
    if (fA < fB) return -1;
    if (fA > fB) return 1;
    return 0;
  });
  
  rows.forEach((tr, i) => {
    tr.querySelector('.row-idx').textContent = i + 1;
    tbody.appendChild(tr);
  });
}

function formatearActividad(a) {
  let elem = a.elemento ? a.elemento.trim() : '';
  let conector = " PARA ";
  if (elem.match(/^(PARA|DEL|AL|A LA|DE|EN)\b/i)) {
    conector = " ";
  }
  let ejeStr = (a.ejes && a.ejes.trim() !== '' && a.ejes.toUpperCase() !== 'NO HAY EJE') ? ` EN LOS EJES ${a.ejes}` : '';
  let nivelStr = a.nivel ? ` EN EL ${a.nivel}` : '';
  
  return `• ${a.descripcion}${elem ? conector + elem : ''}${ejeStr}${nivelStr}`;
}

// ============== GUARDAR Y CARGAR DESDE FIREBASE ==============

function getDbKey() {
  const tipo = document.getElementById('tipo-equipo').value; 
  const mes = document.getElementById('mes-reporte').value;
  const anio = document.getElementById('anio-reporte').value;
  return `equipos_data/${tipo}_${mes}_${anio}`;
}

function guardarControl() {
  const rows = document.querySelectorAll('#tbody-equipos tr');
  const dataToSave = [];
  
  rows.forEach(tr => {
    dataToSave.push({
      mes: tr.querySelector('.inp-mes').value,
      fecha: tr.querySelector('.inp-fecha').value,
      dia: tr.querySelector('.inp-dia').value,
      mIni: tr.querySelector('.inp-m-ini').value,
      mFin: tr.querySelector('.inp-m-fin').value,
      mCant: tr.querySelector('.inp-m-cant').value,
      tIni: tr.querySelector('.inp-t-ini').value,
      tFin: tr.querySelector('.inp-t-fin').value,
      tCant: tr.querySelector('.inp-t-cant').value,
      tot: tr.querySelector('.inp-tot').value,
      comb: tr.querySelector('.inp-comb').value,
      desc: tr.querySelector('.inp-desc').value,
    });
  });

  const metadata = {
    nombre_equipo: document.getElementById('nombre-equipo').value,
    os_equipo: document.getElementById('os-equipo').value
  };

  const payload = { rows: dataToSave, meta: metadata };

  if (typeof fbSave === 'function') {
    fbSave(getDbKey(), payload).then(() => {
      Swal.fire('Guardado', 'El control de este equipo y mes se guardó correctamente en la nube.', 'success');
    }).catch(e => {
      console.error(e);
      Swal.fire('Error', 'Hubo un problema al guardar', 'error');
    });
  } else {
    Swal.fire('Atención', 'No se ha cargado la base de datos', 'warning');
  }
}

function cargarControl() {
  if (typeof fbLoad === 'function') {
    fbLoad(getDbKey(), null).then(data => {
      document.getElementById('tbody-equipos').innerHTML = ''; // Limpiar filas actuales
      if (data) {
        if(data.meta) {
          document.getElementById('nombre-equipo').value = data.meta.nombre_equipo || '';
          document.getElementById('os-equipo').value = data.meta.os_equipo || '';
        }
        if(data.rows && Array.isArray(data.rows)) {
          data.rows.forEach(r => agregarFila(r));
        }
        calcGlobales();
      }
    });
  }
}

// ============== GENERACION EXCEL ==============

async function generarExcel() {
  const ExcelJSLib = (typeof ExcelJS !== 'undefined') ? ExcelJS : window.ExcelJS;
  if (!ExcelJSLib) {
    alert("ExcelJS no cargó correctamente.");
    return;
  }
  
  const workbook = new ExcelJSLib.Workbook();
  const worksheet = workbook.addWorksheet('Control Equipos');
  
  // Fuente base (todo el documento)
  const fontGlobal = { name: 'Swis721 Cn BT', size: 11 };
  const fontTabla = { name: 'Swis721 Cn BT', size: 9 };
  const fontTablaBold = { name: 'Swis721 Cn BT', size: 9, bold: true };
  
  // ================= CONFIGURAR ANCHOS DE COLUMNAS =================
  // Desde B hasta L ancho 8, A ancho 5, M ancho 80
  worksheet.columns = [
    { width: 5 },   // A - Parte N°
    { width: 8 },   // B - Mes
    { width: 8 },   // C - Fecha
    { width: 8 },   // D - Dia
    { width: 8 },   // E - M Inicio
    { width: 8 },   // F - M Fin
    { width: 8 },   // G - M Cantidad
    { width: 8 },   // H - T Inicio
    { width: 8 },   // I - T Fin
    { width: 8 },   // J - T Cantidad
    { width: 8 },   // K - Total Horas
    { width: 8 },   // L - Combustible
    { width: 80 },  // M - Descripcion
  ];
  
  // ================= INSERTAR LOGOS =================
  try {
    const res1 = await fetch('assets/logo1.png');
    const res2 = await fetch('assets/logo2.png');
    
    if (res1.ok && res2.ok) {
      const buf1 = await res1.arrayBuffer();
      const buf2 = await res2.arrayBuffer();
      
      const idLogo1 = workbook.addImage({ buffer: buf1, extension: 'png' });
      const idLogo2 = workbook.addImage({ buffer: buf2, extension: 'png' });
      
      worksheet.addImage(idLogo1, { tl: { col: 1, row: 0 }, ext: { width: 54, height: 79 }, editAs: 'absolute' });
      worksheet.addImage(idLogo2, { tl: { col: 10, row: 0 }, ext: { width: 75, height: 80 }, editAs: 'absolute' });
    }
  } catch (e) {
    console.warn("No se pudieron cargar los logos dinámicamente", e);
  }
  
  // ================= ENCABEZADO PRINCIPAL =================
  const tipoEquipo = document.getElementById('tipo-equipo').value;
  const mesReporte = document.getElementById('mes-reporte').value;
  const anioReporte = document.getElementById('anio-reporte').value;
  const equipoNombre = document.getElementById('nombre-equipo').value;
  const osEquipo = document.getElementById('os-equipo').value;
  
  // Fila 1
  worksheet.mergeCells('A1:M1');
  const titleCell = worksheet.getCell('A1');
  titleCell.value = `CONTROL DE EQUIPO MECANICO - ${mesReporte.toUpperCase()} ${anioReporte}`;
  titleCell.font = { name: 'Swis721 Cn BT', size: 14, bold: true, color: { argb: 'FF003366' } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };
  worksheet.getRow(1).height = 30;

  // Fila 2 vacía

  // Filas 3 a 7
  worksheet.mergeCells('A3:B3'); worksheet.getCell('A3').value = "PROYECTO";
  worksheet.mergeCells('C3:M3'); worksheet.getCell('C3').value = ": MEJORAMIENTO Y AMPLIACIÓN DE LOS SERVICIOS OPERATIVOS O MISIONALES INSTITUCIONALES EN LABORATORIO AMBIENTAL SAN AGUSTÍN DE TORATA";
  
  worksheet.mergeCells('A4:B4'); worksheet.getCell('A4').value = "TORATA";
  worksheet.mergeCells('C4:M4'); worksheet.getCell('C4').value = ": DISTRITO DE TORATA DE LA PROVINCIA DE MARISCAL NIETO DEL DEPARTAMENTO DE MOQUEGUA";
  
  worksheet.mergeCells('A5:B5'); worksheet.getCell('A5').value = "UBICACIÓN";
  worksheet.mergeCells('C5:M5'); worksheet.getCell('C5').value = ": TORATA - MARISCAL NIETO - MOQUEGUA";
  
  worksheet.mergeCells('A6:B6'); worksheet.getCell('A6').value = "ENTIDAD";
  worksheet.mergeCells('C6:M6'); worksheet.getCell('C6').value = ": MUNICIPALIDAD DISTRITAL DE TORATA";
  
  worksheet.mergeCells('A7:B7'); worksheet.getCell('A7').value = "PERIODO";
  worksheet.mergeCells('C7:M7'); worksheet.getCell('C7').value = `: ${mesReporte.substring(0,3)}-${anioReporte.substring(2)}`;
  
  for(let i=3; i<=7; i++){
    worksheet.getCell(`A${i}`).font = { name: 'Swis721 Cn BT', size: 11, bold: true };
    worksheet.getCell(`A${i}`).alignment = { horizontal: 'center', vertical: 'middle' }; // Centrado
    worksheet.getCell(`C${i}`).font = fontGlobal;
  }
  
  // Fila 8 vacía
  
  // Fila 9: O/S
  worksheet.mergeCells('A9:M9');
  const osCell = worksheet.getCell('A9');
  osCell.value = `O/S     N°${osEquipo}      ${equipoNombre.toUpperCase()}`;
  osCell.font = { name: 'Swis721 Cn BT', size: 11, bold: true, color: { argb: 'FF555555' } };
  osCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };
  osCell.alignment = { vertical: 'middle' };
  worksheet.getRow(9).height = 20;

  // Fila 10 vacía
  
  // ================= CABECERAS DE TABLA =================
  const headerStyle = {
    font: fontTablaBold,
    alignment: { horizontal: 'center', vertical: 'middle', wrapText: true },
    border: { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEEEEEE' } }
  };
  
  worksheet.mergeCells('A11:A12'); worksheet.getCell('A11').value = "PARTE N°";
  worksheet.mergeCells('B11:B12'); worksheet.getCell('B11').value = "MES";
  worksheet.mergeCells('C11:C12'); worksheet.getCell('C11').value = "FECHA";
  worksheet.mergeCells('D11:D12'); worksheet.getCell('D11').value = "DIA";
  
  worksheet.mergeCells('E11:G11');  worksheet.getCell('E11').value = "MAÑANA";
  worksheet.getCell('E12').value = "INICIO"; worksheet.getCell('F12').value = "FIN"; worksheet.getCell('G12').value = "CANTIDAD";
  
  worksheet.mergeCells('H11:J11');  worksheet.getCell('H11').value = "TARDE";
  worksheet.getCell('H12').value = "INICIO"; worksheet.getCell('I12').value = "FIN"; worksheet.getCell('J12').value = "CANTIDAD";
  
  worksheet.mergeCells('K11:K12'); worksheet.getCell('K11').value = "TOTAL HORAS MAQUINA";
  worksheet.mergeCells('L11:L12'); worksheet.getCell('L11').value = "COMBUSTIBLE";
  worksheet.mergeCells('M11:M12'); worksheet.getCell('M11').value = "DESCRIPCION DE ACTIVIDADES";
  
  for(let c=1; c<=13; c++) {
    const colLetter = worksheet.getColumn(c).letter;
    Object.assign(worksheet.getCell(`${colLetter}11`), headerStyle);
    Object.assign(worksheet.getCell(`${colLetter}12`), headerStyle);
  }
  
  // ================= CUERPO DE TABLA =================
  const tbody = document.getElementById('tbody-equipos');
  const rows = tbody.querySelectorAll('tr');
  let currentRow = 13;
  
  const cellStyle = {
    font: fontTabla,
    alignment: { horizontal: 'center', vertical: 'middle', wrapText: true },
    border: { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} }
  };
  const leftStyle = { ...cellStyle, alignment: { horizontal: 'left', vertical: 'middle', wrapText: true } };
  
  rows.forEach((tr, index) => {
    worksheet.getCell(`A${currentRow}`).value = (index + 1).toString().padStart(2, '0');
    worksheet.getCell(`B${currentRow}`).value = tr.querySelector('.inp-mes').value;
    
    let rawFecha = tr.querySelector('.inp-fecha').value;
    if(rawFecha) {
      let [y,m,d] = rawFecha.split('-');
      worksheet.getCell(`C${currentRow}`).value = `${d}/${m}/${y}`;
    }
    
    worksheet.getCell(`D${currentRow}`).value = tr.querySelector('.inp-dia').value;
    worksheet.getCell(`E${currentRow}`).value = tr.querySelector('.inp-m-ini').value;
    worksheet.getCell(`F${currentRow}`).value = tr.querySelector('.inp-m-fin').value;
    worksheet.getCell(`G${currentRow}`).value = tr.querySelector('.inp-m-cant').value;
    worksheet.getCell(`H${currentRow}`).value = tr.querySelector('.inp-t-ini').value;
    worksheet.getCell(`I${currentRow}`).value = tr.querySelector('.inp-t-fin').value;
    worksheet.getCell(`J${currentRow}`).value = tr.querySelector('.inp-t-cant').value;
    worksheet.getCell(`K${currentRow}`).value = tr.querySelector('.inp-tot').value;
    worksheet.getCell(`L${currentRow}`).value = tr.querySelector('.inp-comb').value;
    
    let descText = tr.querySelector('.inp-desc').value;
    worksheet.getCell(`M${currentRow}`).value = descText;
    
    for(let c=1; c<=12; c++) {
      Object.assign(worksheet.getCell(`${worksheet.getColumn(c).letter}${currentRow}`), cellStyle);
    }
    Object.assign(worksheet.getCell(`M${currentRow}`), leftStyle);
    
    let lineCount = (descText.match(/\n/g) || []).length + 1;
    let autoHeight = Math.max(30, (lineCount * 15) + 10);
    worksheet.getRow(currentRow).height = autoHeight; 
    
    currentRow++;
  });
  
  // ================= TOTALES =================
  const tManana = document.getElementById('tot-manana').value;
  const tTarde = document.getElementById('tot-tarde').value;
  const tGen = document.getElementById('tot-general').value;
  const tComb = document.getElementById('tot-combustible').value;
  
  worksheet.mergeCells(`D${currentRow}:F${currentRow}`);
  worksheet.getCell(`D${currentRow}`).value = "TOTAL HORAS MAÑANA";
  Object.assign(worksheet.getCell(`D${currentRow}`), headerStyle, { alignment: { horizontal: 'right', vertical: 'middle' } });
  
  worksheet.getCell(`G${currentRow}`).value = tManana;
  Object.assign(worksheet.getCell(`G${currentRow}`), headerStyle);
  
  worksheet.mergeCells(`H${currentRow}:I${currentRow}`);
  worksheet.getCell(`H${currentRow}`).value = "TOTAL HORAS TARDE";
  Object.assign(worksheet.getCell(`H${currentRow}`), headerStyle, { alignment: { horizontal: 'right', vertical: 'middle' } });
  
  worksheet.getCell(`J${currentRow}`).value = tTarde;
  Object.assign(worksheet.getCell(`J${currentRow}`), headerStyle);
  
  currentRow++;
  
  worksheet.mergeCells(`D${currentRow}:J${currentRow}`);
  worksheet.getCell(`D${currentRow}`).value = "TOTAL HORAS";
  Object.assign(worksheet.getCell(`D${currentRow}`), headerStyle, { alignment: { horizontal: 'right', vertical: 'middle' } });
  
  worksheet.getCell(`K${currentRow}`).value = tGen;
  Object.assign(worksheet.getCell(`K${currentRow}`), headerStyle);
  
  worksheet.getCell(`L${currentRow}`).value = tComb ? `${tComb} GAL` : "";
  Object.assign(worksheet.getCell(`L${currentRow}`), headerStyle);
  
  // Guardar Archivo
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  saveAs(blob, `Control_Equipos_${tipoEquipo}_${mesReporte}_${anioReporte}.xlsx`);
}
