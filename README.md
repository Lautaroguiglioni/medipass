📑 Ficha de Proyecto: MediPass
1. Información General
Nombre del Proyecto: MediPass
Tagline: "Tu salud sin fronteras, validada en la blockchain."
Vertical: HealthTech / Social Impact / Web3 Infrastructure
Blockchain: Monad (Devnet/Testnet)
Target: Nómadas Digitales, trabajadores remotos y viajeros frecuentes.
2. El Concepto
MediPass es un ecosistema de salud global que permite a los viajeros mantener un historial clínico único, portable y verificable. El sistema conecta a pacientes con una red de médicos locales en el país donde se encuentren, permitiendo consultas rápidas por videollamada y la emisión de recetas médicas legales mediante SBTs (Soulbound Tokens).
3. Problemas que Resuelve
Fragmentación de datos: Los pacientes pierden acceso a sus estudios y diagnósticos al cambiar de país.
Invalidez de recetas internacionales: Las farmacias no suelen aceptar recetas de médicos extranjeros. MediPass facilita el contacto con médicos locales matriculados.
Falsificación de identidad: El fraude en matrículas médicas es un riesgo global. MediPass utiliza la transparencia de la blockchain para verificar las credenciales de los profesionales.
4. Funcionalidades Core (MVP)
Historial Clínico Universal: Timeline de salud encriptado en IPFS con acceso controlado por el paciente.
Directorio de Médicos Verificados: Listado de profesionales por especialidad y país, validados mediante Roles (RBAC) en el contrato inteligente.
Telemedicina Integrada: Sistema de contacto para resolución de problemas médicos inmediatos (ej: reposición de medicación crónica).
Recetas Digitales On-Chain: Emisión de recetas como tokens no transferibles que el farmacéutico puede validar y marcar como "dispensadas" en la red Monad.
5. Componentes Técnicos
Smart Contracts (Monad): Gestión de roles de usuario (Paciente, Médico, Farmacéutico) y registro de hashes de historial clínico.
Frontend (Next.js): Interfaz premium en dark mode diseñada para una experiencia de usuario simple (estilo Web2.5).
IPFS (Storage): Almacenamiento descentralizado y encriptado para archivos médicos pesados y metadatos de recetas.
Backend Bridge: API interina para facilitar el cifrado de datos y la interacción con la red Monad sin que el usuario final necesite pagar gas (Gasless experience).
6. Modelo de Negocio (SaaS)
Suscripción Mensual (B2C): Los usuarios pagan una cuota fija en USD (o stablecoins) para tener su historia clínica disponible 24/7 y acceso a la red de médicos locales sin costos ocultos.
Verificación de Profesionales (B2B): Validación de credenciales para médicos que quieran expandir su base de pacientes internacionales.
7. Por qué Monad?
Velocidad de Respuesta: Para una emergencia médica, la finalidad de bloque de 1 segundo de Monad es crucial para emitir y validar recetas en tiempo real.
Costos Eficientes: Permite que el registro de cada consulta o actualización del historial clínico tenga un costo despreciable, permitiendo un modelo de suscripción rentable.
8. Flujo de Usuario (Demo Path)
Paciente conecta su wallet y sube su historial previo (Encriptado en IPFS).
El Paciente viaja y necesita medicación; busca un Médico local en la cartilla de MediPass.
El Médico accede al historial (previa autorización), realiza videollamada y emite una receta digital en Monad.
El Paciente presenta la receta en una Farmacia, donde el farmacéutico valida la autenticidad en la blockchain y entrega el medicamento.
MediPass: Carry your health, travel the world. 🌍⚡️
