// js/equipos.js

let globalActividades = [];

// Load Firebase Data on start
document.addEventListener('DOMContentLoaded', () => {
  fbLoad('actividades', []).then(data => {
    globalActividades = Array.isArray(data) ? data : Object.values(data || {});
  });
});

function agregarFila() {
  const tbody = document.getElementById('tbody-equipos');
  const idx = tbody.children.length + 1;
  const tr = document.createElement('tr');
  
  tr.innerHTML = `
    <td>${idx}</td>
    <td><input type="text" class="inp-mes" /></td>
    <td><input type="date" class="inp-fecha" onchange="actualizarDia(this)" /></td>
    <td><input type="text" class="inp-dia" readonly /></td>
    <td><input type="time" class="inp-m-ini" /></td>
    <td><input type="time" class="inp-m-fin" /></td>
    <td><input type="text" class="inp-m-cant" placeholder="0:00" /></td>
    <td><input type="time" class="inp-t-ini" /></td>
    <td><input type="time" class="inp-t-fin" /></td>
    <td><input type="text" class="inp-t-cant" placeholder="0:00" /></td>
    <td><input type="text" class="inp-tot" placeholder="0:00" /></td>
    <td><input type="number" class="inp-comb" step="0.01" /></td>
    <td><textarea class="inp-desc"></textarea></td>
    <td><button class="btn btn-danger" onclick="this.closest('tr').remove()">X</button></td>
  `;
  tbody.appendChild(tr);
}

function actualizarDia(inputFecha) {
  const tr = inputFecha.closest('tr');
  const dateStr = inputFecha.value;
  if (!dateStr) return;
  
  const d = new Date(dateStr + 'T00:00:00');
  const dias = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];
  tr.querySelector('.inp-dia').value = dias[d.getDay()];
}

function extraerActividades() {
  const tbody = document.getElementById('tbody-equipos');
  const rows = tbody.querySelectorAll('tr');
  
  let extracciones = 0;
  
  rows.forEach(tr => {
    const fecha = tr.querySelector('.inp-fecha').value;
    if (fecha) {
      const vinculadas = globalActividades.filter(a => a.fecha === fecha && a.partida && a.partida.codigo === '11.01.01');
      
      if (vinculadas.length > 0) {
        const descText = vinculadas.map(a => a.descripcion).join('\n');
        tr.querySelector('.inp-desc').value = descText;
        extracciones++;
      }
    }
  });
  
  if (extracciones > 0) {
    Swal.fire('Éxito', `Se extrajeron actividades para ${extracciones} filas.`, 'success');
  } else {
    Swal.fire('Aviso', 'No se encontraron actividades topográficas para las fechas ingresadas.', 'info');
  }
}

async function generarExcel() {
  const ExcelJSLib = (typeof ExcelJS !== 'undefined') ? ExcelJS : window.ExcelJS;
  if (!ExcelJSLib) {
    alert("ExcelJS no cargó correctamente.");
    return;
  }
  
  const workbook = new ExcelJSLib.Workbook();
  const worksheet = workbook.addWorksheet('Control Equipos');
  
  // ================= CONFIGURAR ANCHOS DE COLUMNAS =================
  worksheet.columns = [
    { width: 5 },   // A - Parte N°
    { width: 12 },  // B - Mes
    { width: 12 },  // C - Fecha
    { width: 12 },  // D - Dia
    { width: 10 },  // E - M Inicio
    { width: 10 },  // F - M Fin
    { width: 10 },  // G - M Cantidad
    { width: 10 },  // H - T Inicio
    { width: 10 },  // I - T Fin
    { width: 10 },  // J - T Cantidad
    { width: 12 },  // K - Total Horas
    { width: 15 },  // L - Combustible
    { width: 50 },  // M - Descripcion
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
      
      // Logo1 en B1 (width 54, height 79)
      worksheet.addImage(idLogo1, { tl: { col: 1, row: 0 }, ext: { width: 54, height: 79 }, editAs: 'absolute' });
      
      // Logo2 en K1 (approx)
      worksheet.addImage(idLogo2, { tl: { col: 10, row: 0 }, ext: { width: 75, height: 80 }, editAs: 'absolute' });
    }
  } catch (e) {
    console.warn("No se pudieron cargar los logos dinámicamente", e);
  }
  
  // ================= ENCABEZADO PRINCIPAL (Filas 1 a 6) =================
  const mesReporte = document.getElementById('mes-reporte').value;
  const anioReporte = document.getElementById('anio-reporte').value;
  const equipoNombre = document.getElementById('nombre-equipo').value;
  const osEquipo = document.getElementById('os-equipo').value;
  
  worksheet.mergeCells('A1:M1');
  const titleCell = worksheet.getCell('A1');
  titleCell.value = `CONTROL DE EQUIPO MECANICO - ${mesReporte.toUpperCase()} ${anioReporte}`;
  titleCell.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FF003366' } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };
  worksheet.getRow(1).height = 30;

  worksheet.getCell('A2').value = "PROYECTO";
  worksheet.getCell('B2').value = ": MEJORAMIENTO Y AMPLIACIÓN DE LOS SERVICIOS OPERATIVOS O MISIONALES INSTITUCIONALES EN LABORATORIO AMBIENTAL SAN AGUSTÍN DE TORATA";
  
  worksheet.getCell('A3').value = "TORATA";
  worksheet.getCell('B3').value = ": DISTRITO DE TORATA DE LA PROVINCIA DE MARISCAL NIETO DEL DEPARTAMENTO DE MOQUEGUA";
  
  worksheet.getCell('A4').value = "UBICACIÓN";
  worksheet.getCell('B4').value = ": TORATA - MARISCAL NIETO - MOQUEGUA";
  
  worksheet.getCell('A5').value = "ENTIDAD";
  worksheet.getCell('B5').value = ": MUNICIPALIDAD DISTRITAL DE TORATA";
  
  worksheet.getCell('A6').value = "PERIODO";
  worksheet.getCell('B6').value = `: ${mesReporte.substring(0,3)}-${anioReporte.substring(2)}`;
  
  for(let i=2; i<=6; i++){
    worksheet.getCell(`A${i}`).font = { bold: true, size: 9 };
    worksheet.getCell(`B${i}`).font = { size: 9 };
  }
  
  // Espacio y O/S
  worksheet.mergeCells('A8:M8');
  const osCell = worksheet.getCell('A8');
  osCell.value = `O/S     N°${osEquipo}      ${equipoNombre.toUpperCase()}`;
  osCell.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FF555555' } };
  osCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };
  osCell.alignment = { vertical: 'middle' };
  worksheet.getRow(8).height = 20;
  
  // ================= CABECERAS DE TABLA =================
  const headerStyle = {
    font: { bold: true, size: 9 },
    alignment: { horizontal: 'center', vertical: 'middle', wrapText: true },
    border: {
      top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'}
    },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEEEEEE' } }
  };
  
  worksheet.mergeCells('A9:A10'); worksheet.getCell('A9').value = "PARTE N°";
  worksheet.mergeCells('B9:B10'); worksheet.getCell('B9').value = "MES";
  worksheet.mergeCells('C9:C10'); worksheet.getCell('C9').value = "FECHA";
  worksheet.mergeCells('D9:D10'); worksheet.getCell('D9').value = "DIA";
  
  worksheet.mergeCells('E9:G9');  worksheet.getCell('E9').value = "MAÑANA";
  worksheet.getCell('E10').value = "INICIO"; worksheet.getCell('F10').value = "FIN"; worksheet.getCell('G10').value = "CANTIDAD";
  
  worksheet.mergeCells('H9:J9');  worksheet.getCell('H9').value = "TARDE";
  worksheet.getCell('H10').value = "INICIO"; worksheet.getCell('I10').value = "FIN"; worksheet.getCell('J10').value = "CANTIDAD";
  
  worksheet.mergeCells('K9:K10'); worksheet.getCell('K9').value = "TOTAL HORAS MAQUINA";
  worksheet.mergeCells('L9:L10'); worksheet.getCell('L9').value = "COMBUSTIBLE";
  worksheet.mergeCells('M9:M10'); worksheet.getCell('M9').value = "DESCRIPCION DE ACTIVIDADES";
  
  for(let c=1; c<=13; c++) {
    const colLetter = worksheet.getColumn(c).letter;
    Object.assign(worksheet.getCell(`${colLetter}9`), headerStyle);
    Object.assign(worksheet.getCell(`${colLetter}10`), headerStyle);
  }
  
  // ================= CUERPO DE TABLA =================
  const tbody = document.getElementById('tbody-equipos');
  const rows = tbody.querySelectorAll('tr');
  let currentRow = 11;
  
  const cellStyle = {
    font: { size: 9 },
    alignment: { horizontal: 'center', vertical: 'middle', wrapText: true },
    border: { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} }
  };
  const leftStyle = { ...cellStyle, alignment: { horizontal: 'left', vertical: 'middle', wrapText: true } };
  
  rows.forEach((tr, index) => {
    worksheet.getCell(`A${currentRow}`).value = (index + 1).toString().padStart(2, '0');
    worksheet.getCell(`B${currentRow}`).value = tr.querySelector('.inp-mes').value;
    
    // Fecha formato dd/mm/yyyy
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
    worksheet.getCell(`M${currentRow}`).value = tr.querySelector('.inp-desc').value;
    
    for(let c=1; c<=12; c++) {
      Object.assign(worksheet.getCell(`${worksheet.getColumn(c).letter}${currentRow}`), cellStyle);
    }
    Object.assign(worksheet.getCell(`M${currentRow}`), leftStyle);
    
    worksheet.getRow(currentRow).height = 40; // Mayor altura para descripciones largas
    
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
  saveAs(blob, `Control_Equipos_${mesReporte}_${anioReporte}.xlsx`);
}
