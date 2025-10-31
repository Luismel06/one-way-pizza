// src/components/templates/LandingTemplate.jsx
import styled from "styled-components";
import fondo2 from "../../assets/fondo2.jpg"; // ✅ Usa el mismo fondo del login
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

export function LandingTemplate() {
  const navigate = useNavigate();

  return (
    <LandingContainer>
      <Overlay />
      <Content
        as={motion.div}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
      >
        <h1>🍕 Bienvenido a <span>One Way Pizza</span></h1>
        <p>El sistema de gestión diseñado para tu restaurante.</p>

        <Button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate("/login")}
        >
          Acceder
        </Button>
      </Content>
    </LandingContainer>
  );
}

/* 🎨 Estilos */
const LandingContainer = styled.div`
  background: url(${fondo2}) center/cover no-repeat;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
`;

const Overlay = styled.div`
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
`;

const Content = styled.div`
  z-index: 2;
  text-align: center;
  color: #fff;

  h1 {
    font-size: 3rem;
    font-weight: 800;
    color: #fff;
    margin-bottom: 10px;

    span {
      color: #ff8c32;
    }
  }

  p {
    font-size: 1.2rem;
    color: #ddd;
    margin-bottom: 30px;
  }
`;

const Button = styled(motion.button)`
  background-color: #ff8c32;
  color: #fff;
  font-weight: 700;
  font-size: 1.1rem;
  padding: 14px 38px;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 10px rgba(255, 140, 50, 0.3);

  &:hover {
    background-color: #ff9e50;
    box-shadow: 0 6px 14px rgba(255, 140, 50, 0.5);
  }
`;
