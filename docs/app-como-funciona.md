# Cómo funciona la app (moltbot)

Este documento explica en profundidad el propósito, la arquitectura, el flujo de ejecución, los adaptadores de canales, la gestión de agentes/workspaces, la configuración y las prácticas operativas recomendadas para la aplicación.

## Resumen y propósito
- Propósito: plataforma self‑hosted para asistentes/agents multi‑canal que enruta mensajes, ejecuta agentes (skills/tools), y ofrece integraciones con apps móviles/desktop y servicios de LLM.
- Archivos de referencia: `README.md`, `AGENTS.md`, `openclaw.mjs`.

## Arquitectura general (visión rápida)
- Gateway / control plane: componente central que expone una API/WS para clientes y canales (puerto por defecto 18789). Ver `src/gateway/`.
- Adaptadores de canales: módulos independientes por canal (WhatsApp, Telegram, Slack, Discord, iMessage, Web). Carpeta: `src/whatsapp/`, `src/telegram/`, `src/slack/`, `src/discord/`, `src/imessage/`, `src/web/`.
- Agents / Workspaces: unidades lógicas que contienen prompts, herramientas y reglas de enrutamiento. Ver `AGENTS.md` y `src/agents/`.
- Nodos / Media / Tools: procesos auxiliares que manejan audio, imágenes, ejecución local de acciones y herramientas externas. Ver `src/node-host/`, `src/media/`.
- Apps y UI: frontends y companion apps en `apps/` (iOS, Android, macOS) y la UI web servida por el gateway.

## Flujo de inicio y puntos de entrada
- Script/CLI principal: `openclaw.mjs` (entrada de usuario). También hay scripts en `scripts/` para tareas específicas.
- Build/Dev: comandos definidos en `package.json` (usa `pnpm`): instalación, build, dev servers y watchers.

Ejemplo rápido (desarrollo):

```bash
pnpm install
pnpm ui:dev       # si quieres la UI en modo dev
pnpm gateway:dev  # arranca el gateway en modo desarrollo
node openclaw.mjs # ejemplo de invocación directa
```

## Ejecución en Docker / despliegue
- Dockerfile y `docker-compose.yml` se encuentran en la raíz. Para un despliegue básico:

```bash
docker build -t moltbot:latest .
docker-compose up -d
```

- Puertos importantes: gateway (por defecto 18789), bridge/otros puertos expuestos en `docker-compose.yml`.
- Recomendación: usar túneles seguros (Tailscale Serve/Funnel, SSH reverse tunnel) para exponer el gateway ocasionalmente; consulte las notas en `docs/` si existen.

## Canales y adaptadores
- Arquitectura: cada canal implementa un adaptador que traduce eventos de la plataforma (p. ej. mensaje entrante) a la API interna del gateway.
- Carpetas clave: `src/whatsapp/`, `src/telegram/`, `src/slack/`, `src/discord/`, `src/imessage/`, `src/web/`.
- Para añadir un nuevo canal:
  - Crear un adaptador en `src/channels/` o la carpeta del canal.
  - Implementar handshake/pairing que autentique con el gateway.
  - Registrar el adaptador en la configuración del gateway.

## Agentes, workspaces y skills
- Definición: un agente encapsula prompts, herramientas (tools) y reglas de enrutamiento.
- `AGENTS.md` contiene convenciones y ejemplos. Los workspaces se suelen almacenar localmente en `~/.openclaw/workspace` o en la ruta configurada por `OPENCLAW_WORKSPACE_DIR`.
- Buenas prácticas:
  - Mantener herramientas (`TOOLS.md`/plantillas) separadas de prompts.
  - Versionar agents como archivos en el repo para reproducibilidad.

## Nodos, media y capacidades locales
- `src/node-host/` maneja ejecución de nodos locales (acciones, ejecución de código, integración con sistemas locales).
- Pipeline de media en `src/media/` soporta audio, imágenes y conversión para LLMs/agents.

## Configuración y variables de entorno importantes
- Variables comunes a documentar en `.env` o sistema de despliegue:
  - `OPENCLAW_GATEWAY_PORT` — puerto del gateway (default 18789).
  - `OPENCLAW_GATEWAY_TOKEN` — token para authentication entre componentes.
  - `OPENCLAW_CONFIG_DIR` — ruta al directorio de configuración.
  - Tokens / keys para integraciones LLMs (p. ej. `CLAUDE_*`, `OPENAI_API_KEY`) según los conectores que uses.
- Consulte `docker-compose.yml` y `Dockerfile` para ejemplos de cómo pasar variables.

Ejemplo mínimo `.env` (no usar credenciales reales):

```env
OPENCLAW_GATEWAY_PORT=18789
OPENCLAW_GATEWAY_TOKEN=changeme
# OPENAI_API_KEY=sk-...
# CLAUDE_WEB_SESSION_KEY=...
```

## Seguridad, sandboxing y buenas prácticas
- Sandboxing: el sistema admite modos de ejecución aislada para agents; revise la configuración de sandbox en `src/` y en `docs/` si existe.
- Recomendaciones:
  - No exponer el gateway públicamente sin un túnel seguro o proxy con autenticación.
  - Rotar tokens y mantener un archivo `.env` fuera del control de versiones.
  - Limitar qué agentes/skills pueden ejecutar acciones de alto privilegio.

## Operación y troubleshooting
- Logs: revisar la salida del gateway y de los adaptadores en el sistema de logs (STDOUT/archivos). Use `docker-compose logs -f` en despliegues por contenedor.
- Health checks y herramientas: si existe, utilice `openclaw doctor` o scripts en `scripts/` para diagnóstico.
- Tests: ejecutar la suite con `pnpm test` y revisar `vitest` configs si corresponde.

## Referencias rápidas (archivos clave)
- `README.md` — resumen general del repo.
- `AGENTS.md` — convenciones para definir agentes y tools.
- `openclaw.mjs` — entrada/CLI.
- `package.json` — scripts y comandos `pnpm`.
- `Dockerfile`, `docker-compose.yml` — contenedorización y despliegue.
- `src/gateway/`, `src/agents/`, `src/node-host/`, `src/media/`, `src/whatsapp/`, `src/telegram/`, `apps/` — componentes implementacionales.

## Apéndice: sugerencias para siguientes iteraciones
- Incluir ejemplos paso‑a‑paso de onboarding (wizard) y pairing de canales.
- Añadir `.env.sample` en la raíz con variables comentadas.
- Agregar diagramas mermaid o imágenes para la sección de arquitectura.

---
Si quieres, puedo:
- Convertir esto en una guía paso‑a‑paso más detallada (onboarding + pairing).
- Añadir un `.env.sample` y snippets de configuración de ejemplo.
