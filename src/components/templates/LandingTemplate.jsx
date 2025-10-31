// src/components/templates/LandingTemplate.jsx
import styled from "styled-components";
import { useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";

// ✅ Primero declaramos los styled-components:
const LandingContainer = styled.div`
  height: 100vh;
  width: 100%;
  position: relative;
  background-image: url("https://images.unsplash.com/photo-1601924582971-259b69e70b0b?auto=format&fit=crop&w=1920&q=80");
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  overflow: hidden;
`;

const Overlay = styled.div`
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
`;

const Content = styled.div`
  position: relative;
  z-index: 1;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
  text-align: center;
  gap: 1.5rem;
  padding: 2rem;
`;

const Logo = styled.img`
  width: 130px;
  animation: flotar 2s ease-in-out infinite alternate;

  @keyframes flotar {
    from {
      transform: translateY(0);
    }
    to {
      transform: translateY(-10px);
    }
  }
`;

const Title = styled.h1`
  font-size: 2.5rem;
  font-weight: 700;

  span {
    color: #f88533;
  }
`;

const Subtitle = styled.p`
  font-size: 1.2rem;
  color: #ddd;
`;

const Button = styled.button`
  background: #f88533;
  color: white;
  border: none;
  font-size: 1.2rem;
  font-weight: 600;
  padding: 0.8rem 2rem;
  border-radius: 30px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  transition: 0.3s ease;
  box-shadow: 0 0 10px #f88533a0;

  &:hover {
    background: #ff9b4f;
    box-shadow: 0 0 20px #f88533d0;
    transform: scale(1.05);
  }
`;

// ✅ Luego exportamos el componente que los usa:
export function LandingTemplate() {
  const navigate = useNavigate();

  return (
    <LandingContainer>
      <Overlay />
      <Content>
        <Logo src="/OWP-LOGO.png" alt="One Way Pizza" />
        <Title>
          Bienvenido a <span>One Way Pizza</span>
        </Title>
        <Subtitle>Gestión eficiente, sabor inigualable 🍕</Subtitle>
        <Button onClick={() => navigate("/login")}>
          <Icon icon="mdi:login" width="24" />
          Acceder
        </Button>
      </Content>
    </LandingContainer>
  );
}
