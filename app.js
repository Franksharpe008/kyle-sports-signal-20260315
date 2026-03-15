const tracks = {
  "full-demo": {
    file: "./media/full-demo.mp3",
    label: "Full signal",
    description: "Combined score and voice for the fastest read on the idea.",
  },
  "score-bed": {
    file: "./media/score-bed.mp3",
    label: "Score bed",
    description: "Arena-style instrumental with bright lift and broadcast pressure.",
  },
  "intro-voice": {
    file: "./media/intro-voice.mp3",
    label: "Intro voice",
    description: "Quick voice follow-up tailored to Kyle.",
  },
  "closer-voice": {
    file: "./media/closer-voice.mp3",
    label: "Closer voice",
    description: "Short closer that lands the business angle.",
  },
};

const gate = document.getElementById("launchGate");
const launchButton = document.getElementById("launchButton");
const canvas = document.getElementById("arenaCanvas");
const player = document.getElementById("player");
const playPause = document.getElementById("playPause");
const trackLabel = document.getElementById("trackLabel");
const trackDescription = document.getElementById("trackDescription");
const audioDock = document.getElementById("audioDock");
const audioPanel = audioDock.querySelector(".audio-panel");
const audioToggle = document.getElementById("audioToggle");
const audioHide = document.getElementById("audioHide");
let currentTrack = "full-demo";

function setTrack(name, autoplay = false) {
  const next = tracks[name];
  if (!next) return;
  currentTrack = name;
  player.src = next.file;
  trackLabel.textContent = next.label;
  trackDescription.textContent = next.description;
  playPause.textContent = "Play";
  if (autoplay) {
    player.play().then(() => {
      playPause.textContent = "Pause";
    }).catch(() => {});
  }
}

function togglePanel(forceOpen) {
  const hidden = typeof forceOpen === "boolean" ? !forceOpen : !audioPanel.hidden;
  audioPanel.hidden = hidden;
  audioToggle.textContent = hidden ? "Open sound" : "Sound open";
}

function setupReveals() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
        }
      });
    },
    { threshold: 0.16 },
  );

  document.querySelectorAll(".reveal").forEach((node) => observer.observe(node));
}

function setupTilt() {
  document.querySelectorAll(".tilt-card").forEach((card) => {
    card.addEventListener("pointermove", (event) => {
      const rect = card.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      card.style.transform = `rotateX(${(-y * 8).toFixed(2)}deg) rotateY(${(x * 10).toFixed(2)}deg) translateY(-4px)`;
    });
    card.addEventListener("pointerleave", () => {
      card.style.transform = "";
    });
  });
}

function setupAudio() {
  setTrack(currentTrack);
  togglePanel(false);

  document.querySelectorAll("[data-track]").forEach((button) => {
    button.addEventListener("click", () => {
      setTrack(button.dataset.track, true);
      togglePanel(true);
    });
  });

  playPause.addEventListener("click", () => {
    if (player.paused) {
      player.play().then(() => {
        playPause.textContent = "Pause";
      }).catch(() => {});
      return;
    }
    player.pause();
    playPause.textContent = "Play";
  });

  player.addEventListener("pause", () => {
    playPause.textContent = "Play";
  });

  player.addEventListener("play", () => {
    playPause.textContent = "Pause";
  });

  audioToggle.addEventListener("click", () => togglePanel());
  audioHide.addEventListener("click", () => togglePanel(false));
}

function setupGate() {
  launchButton.addEventListener("click", () => {
    gate.classList.add("is-open");
    togglePanel(true);
    setTrack("full-demo", true);
  });
}

function setupArena() {
  const context = canvas.getContext("2d");
  let width = 0;
  let height = 0;
  let dpr = 1;
  let beams = [];
  let particles = [];
  let waves = [];

  const randomBetween = (min, max) => min + Math.random() * (max - min);

  const seedBeam = () => ({
    x: randomBetween(0, 1),
    width: randomBetween(0.04, 0.12),
    speed: randomBetween(0.0007, 0.0022),
    alpha: randomBetween(0.05, 0.16),
    hue: Math.random() > 0.5 ? "68, 185, 255" : "255, 127, 50",
  });

  const seedParticle = () => ({
    x: randomBetween(0, 1),
    y: randomBetween(0, 1),
    radius: randomBetween(1, 3.8),
    speedY: randomBetween(0.0009, 0.0032),
    speedX: randomBetween(-0.0014, 0.0014),
    alpha: randomBetween(0.14, 0.56),
    hue: ["255, 216, 78", "255, 63, 168", "152, 255, 102", "68, 185, 255"][Math.floor(Math.random() * 4)],
  });

  const seedWave = () => ({
    radius: randomBetween(120, 340),
    speed: randomBetween(0.45, 0.9),
    alpha: randomBetween(0.04, 0.12),
    hue: Math.random() > 0.5 ? "255, 216, 78" : "68, 185, 255",
  });

  const resize = () => {
    width = window.innerWidth;
    height = window.innerHeight;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    beams = Array.from({ length: 14 }, seedBeam);
    particles = Array.from({ length: 120 }, seedParticle);
    waves = Array.from({ length: 5 }, seedWave);
  };

  const frame = (time) => {
    context.clearRect(0, 0, width, height);

    beams.forEach((beam) => {
      const beamX = beam.x * width;
      const gradient = context.createLinearGradient(beamX, 0, beamX, height);
      gradient.addColorStop(0, `rgba(${beam.hue}, 0)`);
      gradient.addColorStop(0.4, `rgba(${beam.hue}, ${beam.alpha})`);
      gradient.addColorStop(1, `rgba(${beam.hue}, 0)`);
      context.fillStyle = gradient;
      context.fillRect(beamX - width * beam.width * 0.5, 0, width * beam.width, height);
      beam.x += beam.speed;
      if (beam.x > 1.1) {
        beam.x = -0.1;
      }
    });

    particles.forEach((particle) => {
      context.beginPath();
      context.fillStyle = `rgba(${particle.hue}, ${particle.alpha})`;
      context.arc(particle.x * width, particle.y * height, particle.radius, 0, Math.PI * 2);
      context.fill();
      particle.y -= particle.speedY;
      particle.x += particle.speedX;
      if (particle.y < -0.05 || particle.x < -0.08 || particle.x > 1.08) {
        Object.assign(particle, seedParticle(), { y: 1.08 });
      }
    });

    waves.forEach((wave, index) => {
      const centerX = width * (0.28 + index * 0.13);
      const centerY = height * (0.74 - index * 0.05);
      const animatedRadius = wave.radius + Math.sin(time * 0.001 * wave.speed + index) * 24;
      context.beginPath();
      context.strokeStyle = `rgba(${wave.hue}, ${wave.alpha})`;
      context.lineWidth = 1.5;
      context.arc(centerX, centerY, animatedRadius, 0, Math.PI * 2);
      context.stroke();
    });

    window.requestAnimationFrame(frame);
  };

  resize();
  frame(0);
  window.addEventListener("resize", resize);
}

setupGate();
setupAudio();
setupReveals();
setupTilt();
setupArena();
