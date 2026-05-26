#!/usr/bin/env python3
"""
💩 NIGIESQWARK-D67 FLUSHER 💩
The stinkiest, most chaotic poop simulator ever unleashed.
Run at your own risk. Side effects include: uncontrollable laughter,
terminal trauma, and an inexplicable urge to buy air freshener.
"""

import os
import sys
import time
import random
import threading
import subprocess
import urllib.request
import tempfile
import shutil

# ---------------------------------------------------------------------------
# 🔊  AUDIO — fart & flush sounds (royalty-free / public-domain URLs)
# ---------------------------------------------------------------------------
SOUND_URLS = [
    "https://www.myinstants.com/media/sounds/fart-with-reverb.mp3",
    "https://www.myinstants.com/media/sounds/wet-fart.mp3",
    "https://www.myinstants.com/media/sounds/toilet-flush.mp3",
]

# Fallback: on Linux we can produce a beep/noise via /dev/audio or paplay.
# We try urllib download → playsound → pygame → subprocess players in order.

_audio_tmp_dir = tempfile.mkdtemp(prefix="nigs_d67_")
_audio_cache: dict[str, str] = {}   # url → local path
_audio_stop = threading.Event()


def _fetch_sound(url: str) -> str | None:
    """Download a sound file and return the local path, or None on failure."""
    if url in _audio_cache:
        return _audio_cache[url]
    fname = os.path.join(_audio_tmp_dir, url.split("/")[-1])
    try:
        urllib.request.urlretrieve(url, fname)
        _audio_cache[url] = fname
        return fname
    except Exception:
        return None


def _play_file(path: str) -> None:
    """Try every available method to play the file."""
    # 1. playsound (pip install playsound)
    try:
        import playsound  # type: ignore
        playsound.playsound(path, block=True)
        return
    except Exception:
        pass

    # 2. pygame mixer
    try:
        import pygame  # type: ignore
        pygame.mixer.init()
        pygame.mixer.music.load(path)
        pygame.mixer.music.play()
        while pygame.mixer.music.get_busy():
            time.sleep(0.1)
        return
    except Exception:
        pass

    # 3. system CLI players
    players = ["mpg123", "mpv", "ffplay", "aplay", "afplay"]
    for player in players:
        if shutil.which(player):
            try:
                subprocess.run(
                    [player, path],
                    stdout=subprocess.DEVNULL,
                    stderr=subprocess.DEVNULL,
                    timeout=10,
                )
                return
            except Exception:
                pass

    # 4. macOS open
    if sys.platform == "darwin":
        try:
            subprocess.run(["open", path], check=True,
                           stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            time.sleep(4)
            return
        except Exception:
            pass

    # If nothing works, carry on in silence (still funny visually!)


def _audio_loop() -> None:
    """Continuously play random fart / flush sounds until _audio_stop is set."""
    while not _audio_stop.is_set():
        url = random.choice(SOUND_URLS)
        path = _fetch_sound(url)
        if path:
            _play_file(path)
        else:
            # Couldn't get audio — short wait before retry
            time.sleep(2)
        time.sleep(random.uniform(0.3, 1.2))


# ---------------------------------------------------------------------------
# 💩  ASCII ART LIBRARY
# ---------------------------------------------------------------------------
POOP_ARTS = [
    r"""
    _____
   /     \
  | o   o |
  |  ___  |
   \_____/
     |||
    (poo)
""",
    r"""
      💩
    ~~~~~~
   ( stink)
    ~~~~~~
""",
    r"""
   .---.
  ( 💩 )
   '---'
   || ||
""",
    r"""
  ___
 /💩 \
| 😤  |
 \___/
  | |
""",
    r"""
   💩💩💩
  💩💩💩💩
 💩💩💩💩💩
  💩💩💩💩
   💩💩💩
""",
    r"""
 ___________
|  TOILET   |
|___________|
|           |
|   💩💩💩  |
|___________|
  |       |
""",
    r"""
  ~*~ SPLAT ~*~
   💥💩💥
  /  💩  \
 |  💩💩  |
  \  💩  /
   ~~~~~~
""",
]

TOILET_FLUSH = r"""
  ╔═══════════╗
  ║  🚽 FLUSH ║
  ║  💩→→→🌀  ║
  ║  INITIATED║
  ╚═══════════╝
"""

EXPLOSION = r"""
         💥
       💩💩💩
     💩💩💩💩💩
   💩💩💩💩💩💩💩
     💩💩💩💩💩
       💩💩💩
         💥
"""

# ---------------------------------------------------------------------------
# 📝  ABSURD POOP LOG MESSAGES
# ---------------------------------------------------------------------------
POOP_LOGS = [
    "💥 SPLASH! Poop missed the toilet!",
    "🚽 FLUSH FAILED: System overload!",
    "💨 PFFFFT! Critical fart emission detected!",
    "🌊 OVERFLOW ALERT: Toilet capacity exceeded by 300%!",
    "💩 WARNING: Poop density approaching black-hole levels!",
    "🚨 EMERGENCY: The bowl has declared independence!",
    "💥 KABOOM! Direct hit on bathroom tiles!",
    "😱 ERROR 404: Dignity not found.",
    "🦠 BIOHAZARD: Stench levels off the charts!",
    "🌀 FLUSH VORTEX ACTIVATED — all hope is lost!",
    "💩 NIGIESQWARK-D67 PROTOCOL: MAXIMUM STINK ENGAGED!",
    "🚽 TOILET: 'I quit.' — Resignation accepted.",
    "💨 BRRRRRTTT! Neighbours have filed complaints.",
    "🧻 TOILET PAPER SUPPLY: CRITICALLY LOW. ABORT? Y/N",
    "💩 Poop chunk #7 has achieved sentience.",
    "🔥 SPICY LOG DETECTED — activating emergency sprinklers!",
    "😤 Methane levels rising. Please evacuate. Just kidding. Stay.",
    "🏆 WORLD RECORD: Longest unbroken fart stream — 47 seconds!",
    "🚨 POLICE CALLED BY NOSE. ETA: 2 minutes.",
    "💩 Brown alert! Brown alert! This is not a drill!",
    "🌮 Taco Tuesday consequences: DIRE.",
    "🤢 Air quality index: CATASTROPHIC/HILARIOUS.",
    "💩 Poop trajectory miscalculated. Damage: widespread.",
    "🚽 NIGIESQWARK FLUSH ENGINE v6.7 initialising…",
    "💥 SPLASH ZONE BREACH — EVACUATE THE PREMISES!",
    "🌊 THE GREAT POOP TSUNAMI OF 2026 HAS BEGUN.",
    "💨 SILENT BUT DEADLY PROTOCOL ACTIVATED.",
    "😂 Your son is reading this. Hi, son. 👋",
    "💩 Deploying emergency poop countermeasures… FAILED.",
    "🚽 Just keep flushing. Just keep flushing.",
]

# ---------------------------------------------------------------------------
# 🖥️  VISUAL HELPERS
# ---------------------------------------------------------------------------

def _clear() -> None:
    os.system("cls" if sys.platform == "win32" else "clear")


def _term_size() -> tuple[int, int]:
    try:
        cols, rows = shutil.get_terminal_size(fallback=(80, 24))
    except Exception:
        cols, rows = 80, 24
    return cols, rows


def _random_color() -> str:
    """Return a random ANSI color code string."""
    codes = [31, 32, 33, 34, 35, 36, 91, 92, 93, 94, 95, 96]
    return f"\033[{random.choice(codes)}m"


RESET = "\033[0m"
BOLD  = "\033[1m"


def _banner() -> str:
    return f"""{BOLD}\033[93m
╔══════════════════════════════════════════════════════════╗
║        💩  NIGIESQWARK-D67 FLUSHER  💩                   ║
║      THE STINKIEST EXPERIENCE ON THE INTERNET            ║
║              ~ ALL HOPE ABANDON YE ~                     ║
╚══════════════════════════════════════════════════════════╝
{RESET}"""


def _poop_rain(lines: int = 6) -> str:
    """Generate a random row of poop emojis / ASCII chunks."""
    cols, _ = _term_size()
    result = []
    for _ in range(lines):
        row = ""
        x = 0
        while x < cols - 4:
            chunk = random.choice(["💩", " 💩 ", "~~~", "💥 ", "🚽 ", "💨 "])
            row += _random_color() + chunk + RESET
            x += len(chunk)
        result.append(row)
    return "\n".join(result)


def _animated_flush() -> None:
    """Short flushing animation."""
    frames = [
        "🚽 ·  💩",
        "🚽 ·· 💩",
        "🚽 ···💩",
        "🚽 💩→ 🌀",
        "🚽   →  🌀💩",
        "🚽      🌀💩💩",
        "🌀💩💩💩  FLUSHED!",
    ]
    for frame in frames:
        sys.stdout.write(f"\r  {BOLD}\033[96m{frame}{RESET}   ")
        sys.stdout.flush()
        time.sleep(0.18)
    print()


def _splat_screen() -> None:
    """Fill the whole screen with poop chaos."""
    _clear()
    print(_banner())
    print(_poop_rain(4))
    art = random.choice(POOP_ARTS)
    print(_random_color() + art + RESET)
    print(_poop_rain(3))
    msg = random.choice(POOP_LOGS)
    print(f"\n  {BOLD}\033[91m>>> {msg}{RESET}\n")


def _intro_sequence() -> None:
    """Dramatic opening storm."""
    _clear()
    print(_banner())
    print(f"{BOLD}\033[93m  INITIATING NIGIESQWARK-D67 FLUSH PROTOCOL…{RESET}\n")
    time.sleep(0.6)

    for i in range(5, 0, -1):
        sys.stdout.write(f"\r  💩 Releasing payload in {i}… ")
        sys.stdout.flush()
        time.sleep(0.5)

    print(f"\n\n{BOLD}\033[91m  💥 PAYLOAD RELEASED! 💥{RESET}\n")
    time.sleep(0.4)
    print(EXPLOSION)
    time.sleep(0.6)

    _animated_flush()
    time.sleep(0.4)

    print(TOILET_FLUSH)
    time.sleep(0.8)


# ---------------------------------------------------------------------------
# 🎯  MAIN CHAOS LOOP
# ---------------------------------------------------------------------------

def _run_chaos() -> None:
    """The unstoppable poopstorm loop."""
    log_buffer: list[str] = []

    iteration = 0
    while True:
        iteration += 1
        _clear()

        # --- header ---
        cols, _ = _term_size()
        print(_banner())

        # --- poop rain top ---
        print(_poop_rain(3))

        # --- random big art ---
        art = random.choice(POOP_ARTS)
        print(_random_color() + art + RESET)

        # --- more rain ---
        print(_poop_rain(2))

        # --- rolling log (last 8 messages) ---
        new_log = random.choice(POOP_LOGS)
        log_buffer.append(new_log)
        if len(log_buffer) > 8:
            log_buffer.pop(0)

        print(f"\n{BOLD}\033[96m{'━' * min(cols, 60)}{RESET}")
        print(f"{BOLD}\033[93m  📋 POOP EVENT LOG — iteration #{iteration}{RESET}")
        print(f"{BOLD}\033[96m{'━' * min(cols, 60)}{RESET}")
        for entry in log_buffer:
            print(f"  \033[92m▶ {entry}{RESET}")

        # --- footer rain ---
        print()
        print(_poop_rain(2))

        # --- occasional flush animation ---
        if iteration % 5 == 0:
            print()
            _animated_flush()

        time.sleep(random.uniform(0.4, 0.9))


# ---------------------------------------------------------------------------
# 🚀  ENTRY POINT
# ---------------------------------------------------------------------------

def main() -> None:
    print(f"{BOLD}\033[93m  💩 Booting NIGIESQWARK-D67 FLUSHER…{RESET}")
    time.sleep(0.3)

    # Start audio chaos in background
    audio_thread = threading.Thread(target=_audio_loop, daemon=True)
    audio_thread.start()

    try:
        _intro_sequence()
        _run_chaos()
    except KeyboardInterrupt:
        _audio_stop.set()
        _clear()
        print(f"\n{BOLD}\033[93m  🚽 Flushing complete. Goodbye. 💩{RESET}\n")
        # Clean up downloaded audio
        try:
            shutil.rmtree(_audio_tmp_dir, ignore_errors=True)
        except Exception:
            pass
        sys.exit(0)


if __name__ == "__main__":
    main()
