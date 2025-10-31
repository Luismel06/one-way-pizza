// 📄 src/styles/GlobalStyles.jsx
import { createGlobalStyle } from 'styled-components';

export const GlobalStyles = createGlobalStyle`
  /* 🔹 Estilos base */
  body {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    background-color: ${({ theme }) => theme.bgtotal};
    font-family: 'Poppins', sans-serif;
    color: #FFFFFF;
  }

  /* ===================================
     🧩 SweetAlert2 - Modo Claro/Oscuro
  =================================== */

  .swal2-container {
    z-index: 20000 !important;
  }

  .swal2-popup {
    border-radius: 16px !important;
    box-shadow: 0 4px 25px rgba(0, 0, 0, 0.25);
    background-color: ${({ theme }) =>
      theme.bgtotal === '#131F24' ? '#1e1e1e' : '#ffffff'} !important;
    color: ${({ theme }) =>
      theme.bgtotal === '#131F24' ? '#f1f1f1' : '#333333'} !important;
    transition: all 0.25s ease-in-out;
  }

  .swal2-title {
    font-size: 1.5rem !important;
    font-weight: 600 !important;
    color: ${({ theme }) =>
      theme.bgtotal === '#131F24' ? '#ffffff' : '#222222'} !important;
  }

  .swal2-html-container {
    font-size: 1rem !important;
    color: ${({ theme }) =>
      theme.bgtotal === '#131F24' ? '#cfcfcf' : '#555555'} !important;
  }

  /* 🔘 Botón Confirmar */
  .swal2-confirm {
    background-color: ${({ theme }) => theme.color1 || '#1cb0f6'} !important;
    color: #fff !important;
    border-radius: 8px !important;
    padding: 10px 22px !important;
    font-weight: 600 !important;
    font-size: 1rem !important;
    transition: all 0.25s ease;
  }

  .swal2-confirm:hover {
    background-color: ${({ theme }) => theme.colorToggle || '#1976d2'} !important;
    transform: scale(1.05);
  }

  /* 🔴 Botón Cancelar */
  .swal2-cancel {
    background-color: #ff5555 !important;
    color: #fff !important;
    border-radius: 8px !important;
    padding: 10px 22px !important;
    font-weight: 600 !important;
    font-size: 1rem !important;
    transition: all 0.25s ease;
  }

  .swal2-cancel:hover {
    background-color: #ff7777 !important;
    transform: scale(1.05);
  }

  /* 💫 Animación del popup */
  @keyframes swalPopIn {
    0% {
      transform: scale(0.9);
      opacity: 0;
    }
    100% {
      transform: scale(1);
      opacity: 1;
    }
  }
`;
