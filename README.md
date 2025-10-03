# Caso de estudio para el curso sistemas físicos interactivos

Este caso de estudio está inpirado en el trabajo de Sahand Babali. En [este](https://github.com/sahandbabali/Cross-Browser-Window-Interaction-using-p5.js-and-Websockets) 
enlace se puede encontrar el código fuente.

En el año 2024 el artista generativo Bjørn Staal usa el concepto en su exposición [Entangled](https://www.fxhash.xyz/vertex/entangled). Observa en este 
[video](https://x.com/_nonfigurativ_/status/1727322594570027343) el concepto en acción.

## Pasos para realizar los experimentos

Los pasos para ejecutar la aplicación son:

* Clona el respositorio localmente.
* En el directorio del proyecto, abre una terminal.
* Ejecutar en la terminal:
  ``` bash
  npm install
  ```
* Ejecutar
  ``` bash
  npm start
  ```
* Abre un navegador y escribe la dirección
  ```
  http://localhost:3000/page1
  ```
* Abre otro ventana del mismo navegador y escribe la dirección
  ```
  http://localhost:3000/page2
  ```

## Semáforo de caritas (nueva funcionalidad)

He añadido una aplicación interactiva en tiempo real que usa la misma infraestructura de comunicación.

Qué hace:
- Dos páginas: `/page1` y `/page2`.
- Cada página tiene tres botones con caritas (😊, 😐, 😢).
- Al pulsar un botón en cualquiera de las páginas se emite un evento por socket.io y ambas páginas actualizan:
  - color de fondo (verde/amarillo/rojo),
  - carita grande en el centro,
  - texto que indica si la página "Enviaste" o "Recibiste" la acción (muestra id corto del remitente).

Archivos cambiados:
- `server.js` (nuevo handler `faceChange`)
- `views/page1.html`, `views/page2.html` (UI)
- `views/page1.js`, `views/page2.js` (lógica p5 + socket.io)

Cómo probar (PowerShell / CMD):

1. Abrir terminal en la carpeta del proyecto:

```powershell
cd C:\Users\thoma\Documents\SFI\entangledTest-sfi1-2025-20
```

2. Instalar dependencias si no están instaladas:

```powershell
npm install
```

Si PowerShell bloquea la ejecución (política de ejecución), abre una consola CMD y ejecuta los comandos desde allí.

3. Iniciar servidor:

```powershell
node server.js
```

4. Abrir en el navegador dos pestañas:

```
http://localhost:3000/page1
http://localhost:3000/page2
```

5. Pulsar cualquiera de los tres botones en una pestaña y observar que ambas actualizan el fondo y la carita central. El texto mostrará "Enviaste" en la página que originó el evento y "Recibiste" en la otra (con id corto del emisor).

### Explicación de la idea

La idea principal es crear una interacción simple, visual y colaborativa que use la infraestructura existente de comunicación entre ventanas (socket.io). Cada ventana actúa como un agente que puede elegir un estado visual (una carita) y transmitir esa elección a todos los demás agentes conectados. Visualmente se presenta como un "semáforo" con tres estados (feliz, neutral, triste). El objetivo es que cuando un usuario cambia su estado en una ventana, todas las ventanas conectadas reflejen ese cambio simultáneamente, creando una experiencia compartida e inmediata.

Por qué es interesante:
- Es un ejemplo claro de sincronización en tiempo real entre múltiples clientes usando WebSockets.
- Permite experimentar con la noción de origen/recepción: la ventana que originó el evento muestra "Enviaste" mientras las otras muestran "Recibiste", ayudando a la trazabilidad del evento.
- Es fácil de extender (más estados, animaciones, historial, roles de usuario).

### Arquitectura y flujo de eventos

- Cliente (page1/page2):
  - UI: tres botones con caritas.
  - Lógica: al pulsar un botón, el cliente emite el evento `faceChange` con el identificador de la carita (`'happy'|'neutral'|'sad'`).
  - También escucha el evento `faceChange` y actualiza el estado visual local (fondo y carita grande) cuando recibe el evento.

- Servidor (`server.js`):
  - Escucha `faceChange` desde cualquier socket.
  - Reemite inmediatamente a todos los clientes con `io.emit('faceChange', { faceId, from: socket.id })`. Incluir `from` permite que los clientes distingan si el evento vino de sí mismos o de otro.

Flujo simplificado:
1. Usuario A pulsa el botón 😊 en `page1`.
2. `page1.js` ejecuta socket.emit('faceChange', 'happy').
3. `server.js` recibe el evento y hace io.emit('faceChange', { faceId: 'happy', from: '<socketIdA>' }).
4. Todos los clientes conectados (incluido A) reciben `faceChange` y actualizan su UI.
5. Cada cliente muestra texto: si `from === mySocketId` => "Enviaste 😊"; si no => "Recibiste 😊 de <id corto>".

### Contrato (inputs/outputs)

- Input (cliente -> servidor):
  - Evento: `faceChange`
  - Payload: string `faceId` ∈ {'happy','neutral','sad'}

- Output (servidor -> clientes):
  - Evento: `faceChange`
  - Payload: { faceId: string, from: string }

Errores/validaciones:
- El servidor no valida `faceId` en esta versión; asume que los clientes envían valores válidos. Como mejora se puede validar en `server.js`.

### Casos borde y consideraciones

- Cliente desconectado o reconexión: cuando un cliente se reconecta obtendrá futuros `faceChange` pero no el historial. Si quieres historial, el servidor deberá mantener un log y enviarlo al reconectar.
- Eventos simultáneos: si dos clientes envían cambios en el mismo instante, el último evento reemitido por el servidor será el que prevalezca visualmente; si necesitas orden total, hay que añadir timestamps o un mecanismo de resolución de conflictos.
- Seguridad: actualmente cualquier cliente puede emitir `faceChange`. Si en el futuro se requieren permisos, añade autenticación (cookies/jwt) y valida en el servidor.
- Escalabilidad: con muchos clientes el servidor re-emite a todos; para muchos usuarios se recomienda particionar en salas (rooms) y emitir sólo a la sala relevante.

### Extensiones sugeridas

- Registrar un historial de cambios y mostrar un feed con quién cambió qué y cuándo.
- Añadir animaciones suaves entre estados (transición de color, interpolación de tamaño de la carita).
- Permitir roles (observer vs controller) que determinen quién puede cambiar el semáforo.
- Añadir confirmaciones distribuidas: por ejemplo, requerir que la mayoría confirme un cambio para hacerlo definitivo.

### Código relevante (dónde buscar)

- `server.js` — escucha y reemite `faceChange`.
- `views/page1.js` — lógica de UI, envío y recepción.
- `views/page2.js` — comportamiento simétrico a `page1.js`.

---

Si quieres, puedo ahora:
- Añadir validación de `faceId` en `server.js`.
- Implementar historial en servidor y replay al reconectar.
- Mejorar la UI con animaciones.

Dime cuál quieres implementar a continuación y lo hago.



