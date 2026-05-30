# 🏥 MediPass: Global Health, Local Care
> **Historial Médico Verificable y Recetas Internacionales sobre Monad Blockchain.**

MediPass es una plataforma descentralizada diseñada para **Nómadas Digitales**. Permite que los viajeros lleven su historial clínico completo en la blockchain de **Monad** y reciban atención médica local validada en cualquier parte del mundo, facilitando consultas por videollamada y la emisión de recetas electrónicas que cumplen con las normativas locales mediante firmas criptográficas.

---

## 🌟 La Problemática
Los nómadas digitales enfrentan tres barreras críticas de salud:
1. **Fragmentación:** Sus registros médicos están dispersos en múltiples países y clínicas.
2. **Invalidez Legal:** Una receta médica de un país "A" raramente es aceptada en una farmacia del país "B".
3. **Falta de Confianza:** Es difícil verificar si un médico extranjero tiene una matrícula vigente y real en un entorno desconocido.

## 🚀 Nuestra Solución
MediPass centraliza la salud del viajero aprovechando la velocidad de Monad:
- **Historial Único (Timeline):** Todo el historial médico encriptado en IPFS y anclado a la identidad (wallet) del paciente.
- **Red de Médicos Verificados:** Solo profesionales con matrícula validada (vía RBAC en el Smart Contract) pueden emitir recetas.
- **Prescriptions as SBTs:** Las recetas se emiten como Soulbound Tokens (SBTs) no transferibles, asegurando autenticidad y trazabilidad total.

---

## 🛠️ Tech Stack
- **Blockchain:** [Monad](https://monad.xyz) (High-performance EVM L1).
- **Frontend:** Next.js 14 (App Router), TypeScript, Tailwind CSS.
- **Web3 Integración:** Wagmi, ConnectKit, Viem.
- **Almacenamiento:** IPFS (Cifrado AES) para documentos sensibles.
- **Backend Bridge:** Express.js + Ethers.js para la gestión de roles y minteo de assets.

---

## 🎨 Dashboards e Interfaz

### 👤 Dashboard del Paciente (Digital Nomad)
- **Verifiable Timeline:** Línea de tiempo interactiva de consultas, vacunas y diagnósticos recuperados de la blockchain.
- **Directorio Local:** Acceso a una cartilla de profesionales verificados por país para resolver emergencias o falta de medicación.
- **Gestión de Recetas:** Vista centralizada de recetas activas listas para ser presentadas en farmacias locales.

### 🩺 Dashboard del Médico
- **Acceso Clínico:** Visualización autorizada del historial del paciente.
- **Emisión Digital:** Formulario para generar recetas médicas que se registran on-chain con la firma y matrícula del profesional.
- **Consultas Remotas:** Herramientas para facilitar la atención a distancia (videollamada integrada).

### 💊 Verificación de Farmacia
- **Validator:** Herramienta para verificar la autenticidad de una receta mediante el Token ID, asegurando que no haya sido utilizada previamente.

---

## 🏁 Inicio Rápido

### Requisitos Previos
- Node.js 18+
- Una wallet (Metamask/Rabby) configurada con la red Monad.

### Instalación

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/tu-usuario/medipass-frontend.git
   cd medipass-frontend
