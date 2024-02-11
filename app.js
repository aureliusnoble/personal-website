// Select the canvas element
const canvas = document.getElementById('simulationCanvas');
const ctx = canvas.getContext('2d');
const MAX_LINE_DISTANCE = 40; 
const NUM_PARTICLES = 360;
const PARTICLE_SIZE = 4;
const FORCE_THRESHOLD = 200; // Pixel distance for applying force
const FORCE_SCALE = 0.0005; // Reduce this value to decrease speed
const MAX_SPEED = 2; // Maximum speed of a particle
const DECELERATION_FACTOR = 0.95; // Deceleration factor to apply when exceeding max speed
const INTER_TYPE_FORCE_STRENGTH = 0.010; // Strength of the force between different particle types
const INTER_TYPE_MAX_DISTANCE = 120; // Maximum distance for inter-type force to apply
const BASIC_REPULSIVE_FORCE_STRENGTH = 0.1; // Strength of the basic repulsive force
const BASIC_REPULSIVE_MAX_DISTANCE = 10; // Maximum distance for basic repulsive force to apply
const MOUSE_REPULSION_FORCE = 140; // Adjust for stronger/weaker force
const MOUSE_EFFECT_RADIUS = 120; // Pixel radius for mouse effect



// Set canvas to full browser width/height
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let mouse = {
    x: undefined,
    y: undefined
}

function getCanvasOffset() {
    const rect = canvas.getBoundingClientRect();
    return { x: rect.left, y: rect.top };
}

// Initialize canvas offset
let canvasOffset = getCanvasOffset();

// Update mouse coordinates with respect to canvas position
canvas.addEventListener('mousemove', function(event) {
    canvasOffset = getCanvasOffset(); // Update offset on each mouse move
    mouse.x = event.clientX - canvasOffset.x;
    mouse.y = event.clientY - canvasOffset.y;
});

// Update canvas offset on resize
window.addEventListener('resize', function() {
    canvasOffset = getCanvasOffset();
    resizeCanvas(); // Adjusts the canvas size
    initParticles(); // Adjusts the particle count
});

// Particle class definition
class Particle {
    constructor(type, x, y) {
        this.type = type;
        this.x = x;
        this.y = y;
        this.velocity = { x: 0, y: 0 };
    }

    // Method to apply force to a particle
    applyForce(force) {

        this.velocity.x += force.x * FORCE_SCALE;
        this.velocity.y += force.y * FORCE_SCALE;
    }
    
    // Update particle position
    update() {
        // Apply deceleration if speed exceeds max speed
        const speed = Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.y * this.velocity.y);
        if (speed > MAX_SPEED) {
            this.velocity.x *= DECELERATION_FACTOR;
            this.velocity.y *= DECELERATION_FACTOR;
        }

        this.x += this.velocity.x;
        this.y += this.velocity.y;

        // Wrap around horizontally
        if (this.x < 0) this.x = canvas.width + this.x;
        if (this.x > canvas.width) this.x = this.x - canvas.width;

        // Wrap around vertically
        if (this.y < 0) this.y = canvas.height + this.y;
        if (this.y > canvas.height) this.y = this.y - canvas.height;
    }

    // Render particle on canvas
    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, PARTICLE_SIZE, 0, Math.PI * 2);
        ctx.fillStyle = this.getColor();
        ctx.fill();
    }

    // Get color based on particle type
    getColor() {
        const colors = ['#FFA07A', '#98FB98', '#ADD8E6', '#FFD700']; // Red, Green, Blue, Yellow
        return colors[this.type];
    }
}

function interpolateColor(color1, color2, factor) {
    var result = color1.slice();
    for (var i = 0; i < 3; i++) {
        result[i] = Math.round(result[i] + factor * (color2[i] - color1[i]));
    }
    return result;
}

function calculateDesiredParticleCount() {
    const area = window.innerWidth * window.innerHeight;
    return Math.round(area * 0.0003); // Adjust this ratio to match your desired density
}


// Global variables
let particles = [];

// Initialize particles
function initParticles() {
    const desiredCount = calculateDesiredParticleCount();
    const currentCount = particles.length;
    if (currentCount < desiredCount) {
        for (let i = currentCount; i < desiredCount; i++) {
            const type = Math.floor(Math.random() * 4); // Assuming 4 types
            const x = Math.random() * canvas.width;
            const y = Math.random() * canvas.height;
            particles.push(new Particle(type, x, y));
        }
    } else {
        particles.length = desiredCount; // Remove excess particles
    }
}


// Force matrix for different particle types (4x4 matrix for 4 particle types)
let forceMatrix = [];
const scalingFactor = Math.random() * 0.9 + 0.1; // Random scaling factor between 0.1 and 1.5

for (let i = 0; i < 4; i++) { // Assuming 4 particle types
    forceMatrix[i] = [];
    for (let j = 0; j < 4; j++) {
        forceMatrix[i][j] = (Math.random() * 2 - 1) * scalingFactor; // Random values between -1 and 1, scaled
    }
}



function calculateForce(particle, other) {
    const dx = other.x - particle.x;
    const dy = other.y - particle.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    let forceValue = 0;

    // Inter-type force calculation
    if (distance < INTER_TYPE_MAX_DISTANCE) {
        const forceMagnitude = (INTER_TYPE_MAX_DISTANCE - distance) / INTER_TYPE_MAX_DISTANCE * forceMatrix[particle.type][other.type] * INTER_TYPE_FORCE_STRENGTH;
        forceValue += forceMagnitude;
    }

    // Basic repulsive force calculation
    if (distance < BASIC_REPULSIVE_MAX_DISTANCE) {
        const repulsiveForceMagnitude = (BASIC_REPULSIVE_MAX_DISTANCE - distance) / BASIC_REPULSIVE_MAX_DISTANCE * BASIC_REPULSIVE_FORCE_STRENGTH;
        forceValue -= repulsiveForceMagnitude;
    }

    return forceValue;
}


// Update simulation
function updateSimulation() {
    particles.forEach(particle => {
        particle.update();
    });
}

// Global variable for maximum line drawing distance


// renderParticles function
function renderParticles() {
    for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
            const forceValue = calculateForce(particles[i], particles[j]);
            const normalizedForce = Math.min(Math.max(forceValue, -1), 1); // Normalize force between -1 and 1
            const dx = particles[j].x - particles[i].x;
            const dy = particles[j].y - particles[i].y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < MAX_LINE_DISTANCE) {
                ctx.beginPath();
                ctx.moveTo(particles[i].x, particles[i].y);
                ctx.lineTo(particles[j].x, particles[j].y);
                ctx.strokeStyle = getColorForForce(normalizedForce); // Use the simplified color function
                ctx.stroke();
            }
        }
    }
    
    // Draw lines from mouse to particles within MOUSE_EFFECT_RADIUS
    if (mouse.x !== undefined && mouse.y !== undefined) {
        particles.forEach(particle => {
            const dx = particle.x - mouse.x;
            const dy = particle.y - mouse.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < MOUSE_EFFECT_RADIUS) {
                ctx.beginPath();
                ctx.moveTo(mouse.x, mouse.y);
                ctx.lineTo(particle.x, particle.y);
                
                // Calculate force value for color
                const forceValue = MOUSE_REPULSION_FORCE / distance;
                ctx.strokeStyle = getColorForMouseForce(forceValue);
                ctx.stroke();
            }
        });
    }

    // Draw each particle
    particles.forEach(particle => {
        particle.draw();
    });
}
function getColorForMouseForce(forceValue) {
    let r = 255, g = 255, b = 255; // Start with white

    // Assuming forceValue is positive, scale from white to blue
    // Adjust this logic based on your desired color scheme
    b -= Math.round(255 * (forceValue *10)/ MOUSE_REPULSION_FORCE);
    g -= Math.round(255 * (forceValue *10)/ MOUSE_REPULSION_FORCE);
    return `rgb(${r}, ${g}, ${b})`;
}

function getColorForForce(forceValue) {
    let r = 255, g = 255, b = 255; // Start with white

    forceValue = forceValue * 144

    if (forceValue > 0) {
        // Scale from white to green
        r -= Math.round(255 * forceValue); // Decrease the red channel
        b -= Math.round(255 * forceValue); // Decrease the blue channel
    } else {
        // Scale from white to red
        g -= Math.round(255 * -forceValue); // Decrease the green channel
        b -= Math.round(255 * -forceValue); // Decrease the blue channel
    }

    return `rgb(${r}, ${g}, ${b})`;
}

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    initParticles(); // Reinitialize particles to adjust the count
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Update forces based on distance and types
function applyForces() {
    particles.forEach((particle, i) => {
        // Apply inter-particle forces
        for (let j = i + 1; j < particles.length; j++) {
            const other = particles[j];
            const dx = other.x - particle.x;
            const dy = other.y - particle.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < FORCE_THRESHOLD && distance > PARTICLE_SIZE * 2) {
                const forceMagnitude = forceMatrix[particle.type][other.type] / distance;
                const force = { x: dx * forceMagnitude, y: dy * forceMagnitude };
                particle.applyForce(force);
                other.applyForce({ x: -force.x, y: -force.y });
            }
        }

        // Mouse repulsion logic
        if (mouse.x !== undefined && mouse.y !== undefined) {
            const mouseDX = particle.x - mouse.x;
            const mouseDY = particle.y - mouse.y;
            const mouseDistance = Math.sqrt(mouseDX * mouseDX + mouseDY * mouseDY);

            if (mouseDistance < MOUSE_EFFECT_RADIUS && mouseDistance > 0) { // Avoid division by zero

                const repulsionForceMagnitude = MOUSE_REPULSION_FORCE / mouseDistance;
                const repulsionForceDirection = { x: mouseDX, y: mouseDY };
                
                particle.applyForce({ 
                    x: repulsionForceDirection.x * repulsionForceMagnitude, 
                    y: repulsionForceDirection.y * repulsionForceMagnitude 
                });
                
            }
        }
    });
}

// Update simulation
function updateSimulation() {
    particles.forEach(particle => {
        particle.update();
    });
}
document.addEventListener('DOMContentLoaded', () => {
    const pages = {
        home: `<section><h2>Welcome Home</h2><p>This is the homepage content.</p></section>`,
    about: `
    <section class="about-section">
        <div class="about-img">
            <img src="headshot.jpeg" alt="Headshot">
        </div>
        <div class="about-text">
            <p>I am a PhD candidate in Economic History at the London School of Economics, supervised by Olivier Accominotti and Neil Cummins.<br><br>
            
            My research looks at long-run wealth inequality, and the persistence of aristocratic elites, with a focus on 'Big Data' collection methods and network analysis.
            </p>
        </div>
    </section>`,
        inprogress: `<section><h2>Research</h2><p>Overview of research interests.</p></section>`,
        workshops: `<section><h2>Workshops</h2><p>Upcoming workshops.</p></section>`,
        contact: `<section><h2>Contact</h2><p>Contact information.</p></section>`
    };

    const pageContent = document.getElementById('pageContent');

    document.querySelectorAll('nav a').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault(); // Prevent default link behavior
            let pageName = this.getAttribute('href').replace('.html', '');
            if (pageName.includes('#')) {
                pageName = pageName.split('#')[1];
            }

            console.log(`Link clicked for: ${pageName}`);
            updateContent(pageName, true);
        });
    });

function updateContent(pageName, pushToHistory = false) {
    console.log(`Updating content for: ${pageName}, pushToHistory: ${pushToHistory}`);
    
    // Check if the requested page is 'home'
    if(pageName === 'home') {
        // Clear the content for the homepage
        pageContent.style.opacity = 0;
        
        // Optionally, remove the content after the fade-out animation
        setTimeout(() => {
            pageContent.innerHTML = ''; // Clears the inner content for the homepage
        }, 500); // Match the duration with the CSS transition
        
        // Update the browser's history state if required
        if (pushToHistory) {
            window.history.pushState({page: 'home', timestamp: new Date().getTime()}, "", '#home');
            console.log(`Pushed to history: home`);
        }
    } else if(pages[pageName]) {
        // Handle other pages as before
        pageContent.style.opacity = 0;

        setTimeout(() => {
            pageContent.innerHTML = pages[pageName];
            pageContent.style.opacity = 1;

            if (pushToHistory) {
                window.history.pushState({page: pageName, timestamp: new Date().getTime()}, "", `#${pageName}`);
                console.log(`Pushed to history: ${pageName}`);
            }
        }, 500); // This should match the duration of the CSS transition
    } else {
        console.log("No content found for:", pageName);
    }
}

    window.addEventListener('popstate', function(event) {
        console.log("Popstate event triggered", event.state);
        if(event.state && event.state.page) {
            console.log(`Popstate updating content for: ${event.state.page}`);
            updateContent(event.state.page);
        } else {
            console.log("No state found in popstate event, loading home");
            updateContent('home');
        }
    });

    // Load initial page based on current URL hash if present
    if(window.location.hash) {
        // Strip the '#' and update content accordingly
        const initialPageName = window.location.hash.replace('#', '');
        console.log(`Initial load for hash: ${initialPageName}`);
        updateContent(initialPageName);
    } else {
        // Load default page
        console.log("Initial load, no hash found, loading home");
        updateContent('home');
    }
});



// Animation loop
function animate() {
    requestAnimationFrame(animate);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    applyForces();
    updateSimulation();
    renderParticles();
}

// Initialize and start simulation
initParticles();
animate();
