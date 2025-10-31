// src/utils/imprimirFactura.js
export const imprimirFactura = (venta, detalles, efectivo) => {
  const total = detalles.reduce((acc, d) => acc + d.cantidad * d.precio, 0);
  const devuelta = efectivo ? efectivo - total : 0;

  const logoPath = `${window.location.origin}/src/assets/OWP-LOGO.png`;

  const ticketHTML = `
  <html>
    <head>
      <style>
        @page { size: 80mm auto; margin: 0; }
        body {
          font-family: 'Courier New', monospace;
          font-size: 13px;
          margin: 0;
          padding: 10px;
          width: 302px;
        }
        .center { text-align: center; }
        .right { text-align: right; }
        .table { width: 100%; border-collapse: collapse; }
        .table td { padding: 2px 0; }
        .line { text-align: center; margin: 4px 0; }
        img.logo {
          width: 60px;
          height: auto;
          margin-bottom: 4px;
          filter: grayscale(100%);
        }
      </style>
    </head>
    <body>
      <div class="center">
        <img src="${logoPath}" class="logo" alt="One Way Pizza" />
        <h2>One Way Pizza</h2>
        <p>Carretera los Jovillos - Puerto Viejo de Azua</p>
        <p>Tel:+1 (829) 255-7898</p>
        <p class="line">--------------------------------------</p>
        <p><b>Factura #${venta?.id}</b></p>
        <p>${new Date(venta?.fecha).toLocaleString()}</p>
        <p class="line">--------------------------------------</p>
      </div>

      <table class="table">
        <thead>
          <tr>
            <th style="text-align:left">Producto</th>
            <th style="text-align:center">Cant</th>
            <th style="text-align:right">Precio</th>
          </tr>
        </thead>
        <tbody>
          ${detalles
            .map(
              (item) => `
            <tr>
              <td>${item.nombre}</td>
              <td style="text-align:center">${item.cantidad}</td>
              <td style="text-align:right">RD$${item.precio.toFixed(2)}</td>
            </tr>`
            )
            .join("")}
        </tbody>
      </table>

      <p class="line">--------------------------------------</p>

      <div class="right">
        <p><b>Total:</b> RD$${total.toFixed(2)}</p>
        <p><b>Efectivo:</b> RD$${efectivo ? efectivo.toFixed(2) : "0.00"}</p>
        <p><b>Devuelta:</b> RD$${devuelta.toFixed(2)}</p>
      </div>

      <p class="line">--------------------------------------</p>
      <div class="center">
        <p>Atendido por: <b>${venta?.empleado || "Empleado"}</b></p>
        <p class="line">--------------------------------------</p>
        <p>¡Gracias por su compra!</p>
        <p>Síguenos en @onewaypizza</p>
      </div>
    </body>
  </html>
  `;

  const ventana = window.open("", "_blank", "width=400,height=600");
  ventana.document.write(ticketHTML);
  ventana.document.close();
  ventana.print();
  ventana.close();
};
