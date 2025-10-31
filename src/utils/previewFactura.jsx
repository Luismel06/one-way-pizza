// src/utils/previewFactura.js
import React from "react";
import styled from "styled-components";
import logo from "../assets/OWP-LOGO.png"; // Ruta del logo local

export const PreviewFactura = ({ venta, detalles, efectivo }) => {
  const calcularTotal = () =>
    detalles.reduce((acc, d) => acc + d.cantidad * d.precio, 0);

  const total = calcularTotal();
  const devuelta = efectivo ? efectivo - total : 0;

  return (
    <FacturaContainer>
      <Encabezado>
        <Logo src={logo} alt="One Way Pizza" />
        <h2>One Way Pizza</h2>
        <p>Carretera los Jovillos - Puerto Viejo de Azua</p>
        <p>Tel:+1 (829) 255-7898</p>
        <Linea>--------------------------------------</Linea>
        <p><b>Factura #{venta?.id}</b></p>
        <p>{new Date(venta?.fecha).toLocaleString()}</p>
        <Linea>--------------------------------------</Linea>
      </Encabezado>

      <Cuerpo>
        <table>
          <thead>
            <tr>
              <th style={{ textAlign: "left" }}>Producto</th>
              <th style={{ textAlign: "center" }}>Cant</th>
              <th style={{ textAlign: "right" }}>Precio</th>
            </tr>
          </thead>
          <tbody>
            {detalles.map((item, i) => (
              <tr key={i}>
                <td>{item.nombre}</td>
                <td style={{ textAlign: "center" }}>{item.cantidad}</td>
                <td style={{ textAlign: "right" }}>
                  RD${item.precio.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <Linea>--------------------------------------</Linea>
        <Totales>
          <p><b>Total:</b> RD${total.toFixed(2)}</p>
          <p><b>Efectivo:</b> RD${efectivo ? efectivo.toFixed(2) : "0.00"}</p>
          <p><b>Devuelta:</b> RD${devuelta.toFixed(2)}</p>
        </Totales>

        <Linea>--------------------------------------</Linea>
        <p style={{ textAlign: "center" }}>
          Atendido por: <b>{venta?.empleado || "Empleado"}</b>
        </p>
        <Linea>--------------------------------------</Linea>
        <p style={{ textAlign: "center", marginTop: "10px" }}>
          ¡Gracias por su compra!
        </p>
        <p style={{ textAlign: "center" }}>Síguenos en @onewaypizza</p>
      </Cuerpo>
    </FacturaContainer>
  );
};

// 🧩 Estilos
const FacturaContainer = styled.div`
  font-family: "Courier New", monospace;
  font-size: 13px;
  color: #000;
  background: #fff;
  width: 302px; /* 80 mm */
  padding: 10px;
  border: 1px solid #ccc;
`;

const Encabezado = styled.div`
  text-align: center;
  margin-bottom: 5px;
`;

const Logo = styled.img`
  width: 60px;
  height: auto;
  margin-bottom: 4px;
  filter: grayscale(100%); /* Escala de grises */
`;

const Cuerpo = styled.div`
  table {
    width: 100%;
    border-collapse: collapse;
  }
  td,
  th {
    font-size: 13px;
    padding: 2px 0;
  }
`;

const Linea = styled.p`
  text-align: center;
  margin: 4px 0;
`;

const Totales = styled.div`
  text-align: right;
  margin-top: 5px;
`;
