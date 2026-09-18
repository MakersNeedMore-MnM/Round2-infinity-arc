// Client-side state machine, rendering, commit graph with clickable history
let sessionTranscript = [];

document.addEventListener("DOMContentLoaded", () => {
    const answerForm = document.getElementById("answer-form");
    if (answerForm) {
        answerForm.addEventListener("submit", handleFormSubmit);
    }
});

async function handleFormSubmit(e) {
    e.preventDefault();
    const inputField = document.getElementById("user-answer");
    const answer = inputField.value.trim();
    if (!answer) return;

    inputField.value = "";
    
    // Append user response to transcript history
    sessionTranscript.push({ role: "user", content: answer });

    try {
        const response = await fetch("/api/turn", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ transcript: sessionTranscript })
        });

        const data = await response.json();
        if (data.error) {
            alert(data.error);
            return;
        }

        // Append assistant response to transcript
        sessionTranscript.push({ role: "assistant", content: data });

        // Render updated UI and commit graph nodes
        renderTurn(data);
        updateCommitGraph(data);
        updateMasteryBars(data.mastery_estimates);

    } catch (err) {
        console.error("Error communicating with tutor engine:", err);
    }
}

function renderTurn(data) {
    const container = document.getElementById("tutor-content");
    if (!container) return;

    container.innerHTML = `
        <div class="move-badge ${data.move}">${data.move.replace('_', ' ')}</div>
        <div class="concept-label">concept: ${data.concept}</div>
        <div class="explanation-text">${data.explanation}</div>
        <div class="question-prompt">?> ${data.question}</div>
    `;
}

function updateCommitGraph(data) {
    const graphContainer = document.getElementById("learning-path");
    if (!graphContainer) return;

    const node = document.createElement("div");
    node.className = `commit-node ${data.move}`;
    node.innerHTML = `
        <span class="node-dot"></span>
        <div class="node-info">
            <strong>${data.concept}</strong>
            <span class="node-move">${data.move.replace('_', ' ')}</span>
        </div>
    `;
    
    // Make commit nodes clickable to inspect previous turns
    node.style.cursor = "pointer";
    node.addEventListener("click", () => {
        alert(`Turn Details:\nConcept: ${data.concept}\nMove: ${data.move}\nDiagnosis: ${data.diagnosis || 'N/A'}`);
    });

    graphContainer.appendChild(node);
}

function updateMasteryBars(estimates) {
    if (!estimates) return;
    for (const [concept, score] of Object.entries(estimates)) {
        const bar = document.getElementById(`mastery-${concept.replace(/\s+/g, '-')}`);
        if (bar) {
            bar.style.width = `${score}%`;
        }
    }
}