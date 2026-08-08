# Aura Client (Angular Frontend)

Este es el cliente frontend de **Aura**, desarrollado con **Angular 21** y **Node.js 22**.

---

## Entorno de Desarrollo con Docker

El proyecto está preparado para ejecutarse completamente en un entorno de desarrollo aislado utilizando Docker y Docker Compose.

### Características de la Configuración Docker
* **Live Reload (HMR)**: Los cambios en el código fuente se reflejan automáticamente en el navegador (`http://localhost:4200`).
* **Sincronización con VS Code**: El directorio `node_modules` y los archivos fuente están mapeados entre el contenedor y tu equipo local. Esto garantiza que autocompletado, TypeScript, Prettier y Angular Language Service funcionen en VS Code sin errores de dependencias o sub-rayados rojos.
* **Resiliencia (`restart: on-failure`)**: El contenedor **NO** se inicia automáticamente cuando enciendes la computadora o reinicias Docker, pero **SÍ** se reinicia automáticamente si ocurre un error inesperado durante el desarrollo.

---

## Configuración de Entornos y Seguridad en Git

Para evitar hardcodear URLs y proteger datos sensibles o configuraciones locales:

### 1. Plantillas de Entorno (`*.example.ts`)
El proyecto incluye dos plantillas versionadas en Git:
* `src/environments/environment.example.ts`: Plantilla para desarrollo local.
* `src/environments/environment.prod.example.ts`: Plantilla para compilación de producción.

### 2. Configurar archivos locales de entorno
Copia las plantillas para crear tus archivos de entorno activos:
```bash
cp src/environments/environment.example.ts src/environments/environment.ts
cp src/environments/environment.prod.example.ts src/environments/environment.prod.ts
```

> [!IMPORTANT]
> **Seguridad en Git:** Los archivos reales `environment.ts` y `environment.prod.ts` están listados en `.gitignore`. **NUNCA** elimines estas reglas de `.gitignore` ni subas credenciales, hosts privados o tokens al repositorio de Git.

### 3. Sustitución Automática en el Build de Producción
Al ejecutar la compilación de producción (`npm run build` o `npx ng build`), Angular CLI sustituirá en automático `environment.ts` por `environment.prod.ts` mediante la regla `fileReplacements` definida en `angular.json`.

---

## Instrucciones de Inicio

### Linux / macOS

1. **Navegar a la carpeta `Client`**:
   ```bash
   cd Client
   ```

2. **Arrancar el servidor de desarrollo**:
   ```bash
   docker compose up -d
   ```
   *(O alternativamente usa `npm run docker:up`)*

3. **Ver los logs en tiempo real**:
   ```bash
   docker compose logs -f
   ```

4. **Detener el servidor**:
   ```bash
   docker compose down
   ```

---

### Windows (WSL2 / PowerShell / CMD)

1. **Abre PowerShell, CMD o tu terminal de WSL2** y navega hasta la carpeta `Client`:
   ```powershell
   cd Client
   ```

2. **Arrancar el contenedor**:
   ```powershell
   docker compose up -d
   ```

3. **Ver los logs en tiempo real**:
   ```powershell
   docker compose logs -f
   ```

4. **Detener el contenedor**:
   ```powershell
   docker compose down
   ```

---

## Comandos Útiles

| Acción | Comando Docker Compose | Script npm (en host) |
| :--- | :--- | :--- |
| **Levantar servidor** | `docker compose up -d` | `npm run docker:up` |
| **Ver logs** | `docker compose logs -f` | `npm run docker:logs` |
| **Detener contenedor** | `docker compose down` | `npm run docker:down` |
| **Reconstruir imagen** | `docker compose build --no-cache` | `npm run docker:build` |
| **Instalar nueva librería** | `docker compose exec aura-client npm install <paquete>` | — |
| **Ejecutar tests** | `docker compose exec aura-client npm test` | — |

---

## 💻 Configuración para VS Code (Linter & Autocompletado)

Para que el analizador de código de VS Code (Angular Language Service, TypeScript, ESLint, Prettier) funcione sin errores en tu máquina local:

1. Al ejecutar `docker compose up -d` por primera vez, el contenedor instalará automáticamente las dependencias en la carpeta local `node_modules` si esta no existe.
2. Si instalas un paquete nuevo desde el contenedor usando:
   ```bash
   docker compose exec aura-client npm install <nombre-del-paquete>
   ```
   Las dependencias se actualizarán tanto en el contenedor como en tu carpeta local `node_modules` y `package.json`.
3. Si prefieres instalar dependencias localmente en tu máquina host, también puedes ejecutar `npm install` directamente en tu terminal local.

---

## ❓ Solución de Problemas (Troubleshooting)

### 1. El puerto 4200 está ocupado
Si la terminal indica que el puerto 4200 ya está en uso:
* Revisa si tienes otro proceso local corriendo Angular (`ng serve`) o detén contenedores antiguos:
  ```bash
  docker compose down
  ```

### 2. Cambios no se reflejan automáticamente (Hot Reload / Windows WSL2)
La configuración ya incluye `CHOKIDAR_USEPOLLING=true` y `--poll 1000` activado por defecto. Si estás utilizando un sistema de archivos cruzado (ej. código en NTFS Windows accedido desde WSL2), asegúrate de clonar el proyecto dentro del sistema de archivos nativo de WSL2 (`/home/usuario/...`) para un rendimiento óptimo.

### 3. Permisos de archivos en Linux
Si experimentas errores de permisos al crear o modificar archivos desde fuera del contenedor en Linux:
```bash
sudo chown -R $USER:$USER .
```

---

## 💻 Desarrollo Local (Sin Docker)

Si prefieres ejecutar el cliente directamente en tu sistema operativo host sin Docker:

1. Asegúrate de tener **Node.js v22+** instalado.
2. Instala dependencias:
   ```bash
   npm install
   ```
3. Inicia el servidor local:
   ```bash
   npm start
   ```
4. Abre tu navegador en `http://localhost:4200`.
