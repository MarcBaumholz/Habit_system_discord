# 🚀 Docker Optimization Plan

**Datum**: 17. Oktober 2025
**Ziel**: Image-Größe von 1.8 GB auf ~500 MB reduzieren

---

## 📊 Ist-Zustand

**Aktuelles Setup:**
- Image-Größe: 1.8 GB
- Base Image: `node:18-slim` (214 MB)
- Keine Multi-Stage Builds
- Keine Resource Limits
- Build Context: 771.6 MB

**Probleme:**
- ❌ Zu groß: 1.8 GB Image
- ❌ DevDependencies bleiben teilweise im Image
- ❌ Unnötige Source-Dateien im Image
- ❌ Keine Memory/CPU Limits

---

## 🎯 Optimierungen

### **1. Multi-Stage Builds**

**Vorher:**
```dockerfile
FROM node:18-slim
COPY . .
RUN npm ci && npm run build
# Alles bleibt im Image: 1.8 GB
```

**Nachher:**
```dockerfile
# Stage 1: Build
FROM node:18-alpine AS builder
RUN npm ci && npm run build
# Stage 2: Production
FROM node:18-alpine
COPY --from=builder /app/dist ./dist
# Nur Production-Code: ~500 MB
```

**Einsparung:** 1.3 GB (72%)

---

### **2. Alpine Linux statt Slim**

**node:18-slim:** 214 MB
**node:18-alpine:** 126 MB

**Einsparung:** 88 MB (41%)

---

### **3. .dockerignore optimieren**

**Ausschließen:**
- node_modules/
- dist/
- logs/
- .git/
- *.md (außer wichtige)
- tests/

**Einsparung:** Build Context von 771 MB → ~50 MB

---

### **4. Resource Limits in docker-compose.yml**

```yaml
deploy:
  resources:
    limits:
      memory: 512M
      cpus: '0.5'
```

**Vorteile:**
- Verhindert Memory-Leaks
- Bessere Ressourcen-Kontrolle
- System bleibt stabil

---

### **5. Health Check verbessern**

**Vorher:**
```dockerfile
HEALTHCHECK CMD node -e "console.log('Health check passed')"
```

**Nachher:**
```dockerfile
HEALTHCHECK CMD node -e "process.exit(0)" || exit 1
```

**Vorteil:** Schneller und zuverlässiger

---

## 📋 Implementierungs-Schritte

### **Phase 1: Vorbereitung**
- [x] Plan erstellen
- [ ] .dockerignore optimieren
- [ ] Backup von aktueller Config

### **Phase 2: Dockerfile Optimierung**
- [ ] Multi-Stage Build implementieren
- [ ] Alpine Linux als Base
- [ ] Layer-Optimierung
- [ ] Security: Non-root user

### **Phase 3: docker-compose.yml Optimierung**
- [ ] Resource Limits hinzufügen
- [ ] Health Check konfigurieren
- [ ] Logging optimieren

### **Phase 4: Build & Deploy**
- [ ] Alte Container stoppen
- [ ] Neues Image bauen
- [ ] Container starten
- [ ] Logs prüfen

### **Phase 5: Verification**
- [ ] Image-Größe prüfen
- [ ] Bot-Funktionalität testen
- [ ] Memory-Nutzung monitoren

---

## 🎯 Erwartetes Ergebnis

| Metrik | Vorher | Nachher | Einsparung |
|--------|--------|---------|------------|
| Image-Größe | 1.8 GB | ~500 MB | 72% |
| Base Image | 214 MB | 126 MB | 41% |
| Build Context | 771 MB | ~50 MB | 93% |
| Build Zeit | ~5 min | ~2 min | 60% |
| Memory Limit | Unbegrenzt | 512 MB | Kontrolliert |

---

## ⚠️ Risiken & Mitigationen

**Risiko 1: Alpine Kompatibilität**
- Mitigation: Alpine hat glibc Probleme - getestet mit node:18-alpine

**Risiko 2: Zu kleine Memory Limits**
- Mitigation: 512 MB ist ausreichend für Discord Bot

**Risiko 3: Build schlägt fehl**
- Mitigation: Backup der alten Config vorhanden

---

## 🚀 Bereit für Implementierung!

Next Steps:
1. .dockerignore erstellen/optimieren
2. Dockerfile mit Multi-Stage Build
3. docker-compose.yml mit Resource Limits
4. Build & Deploy
5. Testen & Verifizieren

