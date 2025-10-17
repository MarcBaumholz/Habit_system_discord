# 🔄 PM2 Restart Anleitung

**Datum**: 14. Oktober 2025
**Status**: PM2 wurde gestoppt

---

## ✅ Was wurde gemacht

PM2 Process `discord-habit-system` wurde gestoppt:
- Status: **STOPPED**
- PID: 0 (nicht mehr laufend)
- Vorheriger Uptime: 21 Stunden

---

## 🚀 SO STARTEST DU PM2 WIEDER

### Option 1: Standard Restart (Empfohlen)

```bash
cd /home/pi/Documents/habit_System/Habit_system_discord
pm2 start ecosystem.config.js
```

### Option 2: Direct Restart (wenn schon in PM2 Liste)

```bash
pm2 start discord-habit-system
```

### Option 3: Mit Logs direkt anzeigen

```bash
cd /home/pi/Documents/habit_System/Habit_system_discord
pm2 start ecosystem.config.js
pm2 logs discord-habit-system
```

---

## 📊 Status Prüfen

### PM2 Liste anzeigen:
```bash
pm2 list
```

### Detaillierte Info:
```bash
pm2 info discord-habit-system
```

### Live Logs anschauen:
```bash
pm2 logs discord-habit-system
```

### Letzte 50 Zeilen Logs:
```bash
pm2 logs discord-habit-system --lines 50
```

---

## 🔧 Weitere nützliche Befehle

### PM2 Neustarten:
```bash
pm2 restart discord-habit-system
```

### PM2 Stoppen:
```bash
pm2 stop discord-habit-system
```

### PM2 komplett entfernen (aus Liste):
```bash
pm2 delete discord-habit-system
```

### Alle PM2 Prozesse anzeigen:
```bash
pm2 monit
```

---

## 🐛 Bei Problemen

### 1. PM2 startet nicht:

**Prüfe ob Port belegt ist:**
```bash
lsof -i :3000
```

**Prüfe ob Discord Token vorhanden:**
```bash
cd /home/pi/Documents/habit_System/Habit_system_discord
cat .env | grep DISCORD_BOT_TOKEN
```

### 2. Bot verbindet nicht:

**Rebuild TypeScript:**
```bash
cd /home/pi/Documents/habit_System/Habit_system_discord
npm run build
pm2 restart discord-habit-system
```

### 3. Logs prüfen:

**Error Log:**
```bash
tail -f /home/pi/Documents/habit_System/Habit_system_discord/logs/pm2-error.log
```

**Output Log:**
```bash
tail -f /home/pi/Documents/habit_System/Habit_system_discord/logs/pm2-out.log
```

**Combined Log:**
```bash
tail -f /home/pi/Documents/habit_System/Habit_system_discord/logs/pm2-combined.log
```

---

## 🔄 Auto-Restart bei Boot

### PM2 beim Systemstart automatisch laden:

```bash
pm2 startup
# Führe den Befehl aus, der angezeigt wird

# Dann:
pm2 save
```

### Auto-Restart deaktivieren:

```bash
pm2 unstartup
```

---

## 🐳 Alternative: Docker statt PM2

Falls du zu Docker wechseln möchtest:

```bash
cd /home/pi/Documents/habit_System/Habit_system_discord

# Docker Container bauen und starten
docker-compose up -d

# Status prüfen
docker-compose ps

# Logs anschauen
docker-compose logs -f habit-discord-bot
```

---

## 📊 Aktueller Status der anderen Dienste

Die folgenden Docker-Bots laufen **WEITER** (wurden nicht gestoppt):
- ✅ health-bot
- ✅ preisvergleich-bot
- ✅ calories-bot
- ✅ money-bot
- ✅ discord-todo-bot
- ✅ tagebuch-bot
- ✅ allgemeine-wohl-bot
- ✅ erinnerungen-bot

---

## 💡 Quick Commands Übersicht

```bash
# Starten
pm2 start discord-habit-system

# Stoppen
pm2 stop discord-habit-system

# Neustarten
pm2 restart discord-habit-system

# Status
pm2 list

# Logs
pm2 logs discord-habit-system

# Details
pm2 info discord-habit-system
```

---

**Hinweis**: Das System wurde gestoppt, weil die Agent-Funktionalität fehlerhaft war. Vor dem Neustart sollten die Agent-Fehler behoben werden, oder du nutzt Docker stattdessen.

