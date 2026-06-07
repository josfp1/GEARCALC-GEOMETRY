# 🚴 Gear Calc v2 — Desarrollos + Comparador de Geometría

App PWA con dos módulos:
- **Desarrollos SRAM** con calculadora de presión tubeless/cámara
- **Comparador de geometría** con datos de Geometry Geeks (hasta 4 bicis)

---

## 🚀 Publicar en Netlify

### Paso 1 — Construir
```bash
npm install
npm run build
```

### Paso 2 — Subir a Netlify
1. Ve a [app.netlify.com](https://app.netlify.com)
2. "Add new site" → "Import an existing project" → conecta con GitHub
   **O** arrastra toda la carpeta del proyecto (no solo dist/) al panel de Netlify
3. Netlify detecta el `netlify.toml` y configura todo automáticamente:
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Functions directory: `netlify/functions`

### ⚠️ Importante para el comparador de geometría
La función serverless (`netlify/functions/geometry.js`) necesita que subas
el **proyecto completo**, no solo la carpeta `dist/`.

Si arrastras solo `dist/`, la búsqueda de geometría no funcionará.
Usa el método de GitHub o arrastra la carpeta raíz del proyecto.

---

## 📱 Instalar como app

### iPhone (Safari)
1. Abre la URL en Safari
2. Compartir → "Añadir a pantalla de inicio"

### PC (Chrome / Edge)
1. Abre la URL
2. Icono de instalar en la barra de direcciones

---

## 🛠 Desarrollo local

```bash
npm install
npm run dev          # Frontend en http://localhost:5173
```

Para probar la función de geometría en local necesitas Netlify CLI:
```bash
npm install -g netlify-cli
netlify dev          # Levanta todo en http://localhost:8888
```

---

## Estructura
```
gearcalc/
├── src/
│   ├── App.jsx          # App React completa
│   └── main.jsx         # Entry point
├── netlify/
│   └── functions/
│       └── geometry.js  # Proxy → Geometry Geeks (serverless)
├── public/
│   └── favicon.svg
├── netlify.toml         # Config Netlify (build + redirects + functions)
├── vite.config.js
└── package.json
```
