
import React, { useRef, useEffect } from 'react';

interface CanvasVisualizerProps {
  visualizedText: string | null;
  isGenerating: boolean;
  activeOperator: string | null;
}

// --- CHAOTIC STATE VISUALIZATION (Initial State) ---
class Particle {
    x: number;
    y: number;
    size: number;
    baseX: number;
    baseY: number;
    density: number;
    color: string;

    constructor(effect: ChaoticEffect) {
        this.x = Math.random() * effect.width;
        this.y = Math.random() * effect.height;
        this.size = Math.random() * 1.5 + 0.5;
        this.baseX = this.x;
        this.baseY = this.y;
        this.density = (Math.random() * 30) + 1;
        this.color = `rgba(180, 210, 255, ${Math.random() * 0.5 + 0.3})`;
    }

    update(mouse: { x: number; y: number; radius: number }) {
        let dx = mouse.x - this.x;
        let dy = mouse.y - this.y;
        let distance = Math.sqrt(dx * dx + dy * dy);
        if (distance === 0) distance = 0.001;
        let forceDirectionX = dx / distance;
        let forceDirectionY = dy / distance;
        let maxDistance = mouse.radius;
        let force = (maxDistance - distance) / maxDistance;
        let directionX = (forceDirectionX * force * this.density);
        let directionY = (forceDirectionY * force * this.density);

        if (distance < mouse.radius) {
            this.x -= directionX;
            this.y -= directionY;
        } else {
            if (this.x !== this.baseX) {
                let dx = this.x - this.baseX;
                this.x -= dx / 20;
            }
            if (this.y !== this.baseY) {
                let dy = this.y - this.baseY;
                this.y -= dy / 20;
            }
        }
    }

    draw(ctx: CanvasRenderingContext2D) {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.closePath();
        ctx.fill();
    }
}

class ChaoticEffect {
    width: number;
    height: number;
    particles: Particle[] = [];
    mouse = { x: 0, y: 0, radius: 150 };
    
    constructor(width: number, height: number, numParticles: number) {
        this.width = width;
        this.height = height;
        this.init(numParticles);
        window.addEventListener('mousemove', e => {
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
        });
    }
    
    init(numParticles: number) {
        for (let i = 0; i < numParticles; i++) {
            this.particles.push(new Particle(this));
        }
    }
    
    update() {
        this.particles.forEach(p => p.update(this.mouse));
    }
    
    draw(ctx: CanvasRenderingContext2D) {
        this.particles.forEach(p => p.draw(ctx));
    }
}


// --- COHERENT STATE VISUALIZATION (Post-Generation) ---
interface Layer { radius: number; speed: number; angle: number; alpha: number; }
interface Node { x: number; y: number; size: number; alpha: number; }

class CoherenceEffect {
    width: number; height: number; glyph: string;
    stage = 0; stageProgress = 0;
    stageDurations = [100, 150, 150, 120, 180, 200, 300, 999];
    layers: Layer[] = []; nodes: Node[] = []; seed = 0;

    constructor(width: number, height: number, glyph: string) {
        this.width = width; this.height = height; this.glyph = glyph;
        for (let i = 0; i < this.glyph.length; i++) this.seed += this.glyph.charCodeAt(i);
        this.initLayers(); this.initNodes();
    }
    
    seededRandom(seed: number) { let s = Math.sin(seed) * 10000; return s - Math.floor(s); }

    initLayers() {
        for (let i = 0; i < 12; i++) {
            this.layers.push({
                radius: (this.width / 14) * (i + 1),
                speed: (this.seededRandom(this.seed + i) - 0.5) * 0.002,
                angle: this.seededRandom(this.seed + i + 12) * Math.PI * 2,
                alpha: 0.05 + this.seededRandom(this.seed + i + 24) * 0.1
            });
        }
    }

    initNodes() {
        const numNodes = 7;
        for (let i = 0; i < numNodes; i++) {
            const angle = this.seededRandom(this.seed + i * 2) * Math.PI * 2;
            const radius = this.width * 0.1 + this.seededRandom(this.seed + i * 3) * (this.width * 0.25);
            this.nodes.push({
                x: this.width/2 + Math.cos(angle) * radius,
                y: this.height/2 + Math.sin(angle) * radius,
                size: 2 + this.seededRandom(this.seed + i * 4) * 4,
                alpha: 0
            });
        }
    }

    update() {
        this.stageProgress++;
        if (this.stage < this.stageDurations.length && this.stageProgress > this.stageDurations[this.stage]) {
            this.stageProgress = 0; this.stage++;
        }
        this.layers.forEach(layer => layer.angle += layer.speed);
    }

    draw(ctx: CanvasRenderingContext2D) {
        const centerX = this.width / 2, centerY = this.height / 2;
        const progress = this.stageProgress / (this.stageDurations[this.stage] || 1);

        // Draw 12 Layers
        this.layers.forEach((layer, i) => {
            ctx.strokeStyle = `rgba(100, 200, 255, ${layer.alpha})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(centerX, centerY, layer.radius, layer.angle, layer.angle + Math.PI * 1.5);
            ctx.stroke();
            if (this.stage > 0 && i < this.stage + 4) {
                 const flashAlpha = Math.sin(progress * Math.PI) * 0.3;
                 ctx.strokeStyle = `rgba(200, 255, 255, ${flashAlpha})`;
                 ctx.beginPath();
                 ctx.arc(centerX, centerY, layer.radius, layer.angle, layer.angle + Math.PI * 1.5);
                 ctx.stroke();
            }
        });

        // Stage 0: GRAPHEME
        const glyphAlpha = this.stage === 0 ? Math.min(1, progress * 2) : 1;
        ctx.fillStyle = `rgba(200, 225, 255, ${glyphAlpha})`;
        ctx.font = 'bold 48px sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.shadowColor = 'rgba(150, 220, 255, 1)'; ctx.shadowBlur = 20;
        ctx.fillText(this.glyph, centerX, centerY);
        ctx.shadowBlur = 0;

        // Stage 1: PHONEME (cymatic resonance)
        if (this.stage >= 1) {
            const waveRadius = progress * (this.width * 0.5);
            ctx.strokeStyle = `rgba(150, 220, 255, ${1 - progress})`;
            ctx.lineWidth = 2; ctx.beginPath();
            ctx.arc(centerX, centerY, waveRadius, 0, Math.PI * 2); ctx.stroke();
        }
        
        // Stage 2: MORPHEME (syntactic curvature)
        if (this.stage >= 2) {
            ctx.strokeStyle = `rgba(150, 220, 255, ${Math.sin(progress * Math.PI) * 0.4})`;
            ctx.lineWidth = 1; ctx.beginPath();
            let p1 = this.nodes[0]; ctx.moveTo(p1.x, p1.y);
            for(let i = 1; i < this.nodes.length; i++) {
                const p2 = this.nodes[i];
                const cp1x = (p1.x + p2.x) / 2 + (p1.y - p2.y) * 0.3;
                const cp1y = (p1.y + p2.y) / 2 + (p2.x - p1.x) * 0.3;
                ctx.quadraticCurveTo(cp1x, cp1y, p2.x, p2.y); p1 = p2;
            }
            ctx.stroke();
        }

        // Stage 3 & 4: LEXEME (identity) & SEMEME (charge field)
        if (this.stage >= 3) {
            this.nodes.forEach(node => {
                node.alpha = this.stage === 3 ? Math.min(1, progress * 1.5) : 1;
                ctx.fillStyle = `rgba(255, 255, 255, ${node.alpha})`;
                ctx.beginPath(); ctx.arc(node.x, node.y, node.size, 0, Math.PI * 2); ctx.fill();
                if (this.stage >= 4) {
                    const fieldRadius = node.size + Math.sin(progress * Math.PI) * 20;
                    const gradient = ctx.createRadialGradient(node.x, node.y, node.size, node.x, node.y, fieldRadius);
                    gradient.addColorStop(0, `rgba(180, 220, 255, 0.3)`);
                    gradient.addColorStop(1, `rgba(180, 220, 255, 0)`);
                    ctx.fillStyle = gradient;
                    ctx.beginPath(); ctx.arc(node.x, node.y, fieldRadius, 0, Math.PI * 2); ctx.fill();
                }
            });
        }

        // Stage 5: PRAGMEME (causal action)
        if (this.stage >= 5) {
            ctx.strokeStyle = `rgba(200, 255, 255, 0.8)`; ctx.lineWidth = 0.5;
            for (let i = 0; i < this.nodes.length; i++) {
                for (let j = i + 1; j < this.nodes.length; j++) {
                    if (this.seededRandom(i * j + this.seed) > 0.6) {
                        const p1 = this.nodes[i], p2 = this.nodes[j];
                        ctx.globalAlpha = Math.min(1, progress * 2);
                        ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
                        const pulseX = p1.x + (p2.x - p1.x) * progress;
                        const pulseY = p1.y + (p2.y - p1.y) * progress;
                        ctx.fillStyle = 'white'; ctx.beginPath();
                        ctx.arc(pulseX, pulseY, 2, 0, Math.PI * 2); ctx.fill();
                        ctx.globalAlpha = 1;
                    }
                }
            }
        }
        
        // Stage 6 & 7: META-LOGOS (self-audit) & Recurse
        if (this.stage >= 6) {
            const pulseAlpha = Math.max(0, Math.sin(this.stageProgress * 0.05) * 0.1);
            const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, this.width * 0.6);
            gradient.addColorStop(0, `rgba(180, 220, 255, 0)`);
            gradient.addColorStop(0.8, `rgba(180, 220, 255, ${pulseAlpha})`);
            gradient.addColorStop(1, `rgba(180, 220, 255, 0)`);
            ctx.fillStyle = gradient; ctx.fillRect(0, 0, this.width, this.height);
        }
    }
}

const CanvasVisualizer: React.FC<CanvasVisualizerProps> = ({ visualizedText, isGenerating, activeOperator }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const activeOperatorRef = useRef({ operator: activeOperator, alpha: 0, scale: 1 });

  useEffect(() => {
      activeOperatorRef.current.operator = activeOperator;
      if (activeOperator) {
          activeOperatorRef.current.alpha = 1; // Start fade out
          activeOperatorRef.current.scale = 1; // Reset scale
      }
  }, [activeOperator]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const resizeCanvas = () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    
    const chaoticEffect = new ChaoticEffect(canvas.width, canvas.height, 200);
    let coherenceEffect: CoherenceEffect | null = null;
    if (visualizedText) {
        coherenceEffect = new CoherenceEffect(canvas.width, canvas.height, visualizedText);
    }
    
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      if (coherenceEffect) {
          coherenceEffect.update();
          coherenceEffect.draw(ctx);
      } else {
          chaoticEffect.update();
          chaoticEffect.draw(ctx);
      }

      // Draw active operator effect
      const activeOp = activeOperatorRef.current;
      if (activeOp.operator && activeOp.alpha > 0) {
          ctx.save();
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = `rgba(220, 240, 255, ${activeOp.alpha})`;
          ctx.shadowColor = `rgba(180, 220, 255, ${activeOp.alpha * 0.8})`;
          ctx.shadowBlur = 40;
          const fontSize = 120 * activeOp.scale;
          ctx.font = `bold ${fontSize}px sans-serif`;
          ctx.fillText(activeOp.operator, canvas.width / 2, canvas.height / 2);
          ctx.restore();

          // Animate fade and scale out
          activeOp.alpha -= 0.02;
          activeOp.scale += 0.01;
      }
      
      if (isGenerating) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.font = '24px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = 'rgba(100, 200, 255, 1)';
        ctx.shadowBlur = 15;
        ctx.fillText('RENDERING COHERENCE...', canvas.width / 2, canvas.height / 2);
        ctx.shadowBlur = 0;
      }
      
      animationFrameId = window.requestAnimationFrame(animate);
    }
    
    animate();

    return () => {
      window.cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [visualizedText, isGenerating]);

  return <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full -z-10" />;
};

export default CanvasVisualizer;
