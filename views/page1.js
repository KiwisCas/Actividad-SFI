// Semáforo de caritas - Página 1
let socket;
let myId = null;
let currentFace = null; // 'happy' | 'neutral' | 'sad'
let receivedFrom = null; // { id, face }

function setup() {
    createCanvas(windowWidth, windowHeight);
    frameRate(60);

    socket = io();
    socket.on('connect', () => {
        myId = socket.id;
        console.log('Connected as', myId);
    });

    socket.on('faceChange', (payload) => {
        if (!payload) return;
        const { faceId, from } = payload;
        // Update local state to reflect the chosen face
        currentFace = faceId;
        receivedFrom = { id: from, face: faceId };
        // Update status text: if this client originally sent it, show 'envió', else 'recibió'
        const statusText = (from === myId) ? `Enviaste ${faceLabel(faceId)}` : `Recibiste ${faceLabel(faceId)} de ${shortId(from)}`;
        const statusEl = document.getElementById('statusText');
        if (statusEl) statusEl.textContent = statusText;
    });

    window.addEventListener('resize', () => resizeCanvas(windowWidth, windowHeight));

    // Wire UI buttons
    document.getElementById('btn-happy').addEventListener('click', () => sendFace('happy'));
    document.getElementById('btn-neutral').addEventListener('click', () => sendFace('neutral'));
    document.getElementById('btn-sad').addEventListener('click', () => sendFace('sad'));
}

function sendFace(faceId) {
    currentFace = faceId;
    // set status immediately to 'enviaste' for responsiveness
    const statusEl = document.getElementById('statusText');
    if (statusEl) statusEl.textContent = `Enviaste ${faceLabel(faceId)}`;
    socket.emit('faceChange', faceId);
}

function faceLabel(id) {
    if (id === 'happy') return '😊';
    if (id === 'neutral') return '😐';
    if (id === 'sad') return '😢';
    return '';
}

function shortId(id) {
    if (!id) return '';
    return id.slice(0, 6);
}

function draw() {
    // default background if no face selected
    if (!currentFace) background(30);
    else if (currentFace === 'happy') background(60, 180, 75); // green
    else if (currentFace === 'neutral') background(200, 200, 0); // yellow
    else if (currentFace === 'sad') background(220, 80, 70); // red

    // draw central face
    push();
    translate(width / 2, height / 2);
    noStroke();
    fill(255);
    ellipse(0, 0, min(width, height) * 0.4, min(width, height) * 0.4);
    fill(0);
    textAlign(CENTER, CENTER);
    textSize(min(width, height) * 0.12);
    if (currentFace) text(faceLabel(currentFace), 0, 0);
    pop();
}
